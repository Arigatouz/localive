import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export interface VariantMessage {
  declarations: string[];
  selectors: string[];
  match: Record<string, string>;
}

export interface StoredMessage {
  file: string;
  /** JSON path of the message inside its file. */
  path: string[];
  /** Position of the file's path pattern in the project settings. */
  patternIndex: number;
  value: string | VariantMessage;
}

export interface MessageProject {
  baseLocale: string;
  locales: string[];
  filesByLocale: Record<string, string[]>;
  storedByLocale: Record<string, Map<string, StoredMessage>>;
  readOnly: Set<string>;
}

/** What the browser needs: every editable message by locale, with variants as selector-to-text records. */
export interface MessageCatalog {
  baseLocale: string;
  locales: string[];
  messages: Record<string, Record<string, string | Record<string, string>>>;
  readOnly: string[];
}

const MESSAGE_FORMAT_SETTINGS = 'plugin.inlang.messageFormat';

export function readCatalog(projectPath: string): MessageCatalog {
  const { baseLocale, locales, storedByLocale, readOnly } = readProject(projectPath);
  const messages = Object.fromEntries(
    locales.map((locale) => [
      locale,
      Object.fromEntries(
        [...storedByLocale[locale]].map(([key, { value }]) => [key, typeof value === 'string' ? value : value.match]),
      ),
    ]),
  );
  return { baseLocale, locales, messages, readOnly: [...readOnly] };
}

/** Reads messages the way @inlang/plugin-message-format does: later path patterns override earlier ones. */
export function readProject(projectPath: string): MessageProject {
  const settings = readJson(join(projectPath, 'settings.json')) as Record<string, unknown>;
  const messageFormat = settings[MESSAGE_FORMAT_SETTINGS] as { pathPattern?: string | string[] } | undefined;
  if (!messageFormat) {
    throw new Error(`Localive can edit only messages stored with @inlang/plugin-message-format, configured under "${MESSAGE_FORMAT_SETTINGS}".`);
  }

  const pattern = messageFormat.pathPattern;
  if (!pattern || pattern.length === 0) throw new Error(`${MESSAGE_FORMAT_SETTINGS}.pathPattern is missing in the project settings.`);

  const locales = settings.locales as string[];
  const projectFolder = dirname(resolve(projectPath));
  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  const readOnly = new Set<string>();
  const filesByLocale: Record<string, string[]> = {};
  const storedByLocale: Record<string, Map<string, StoredMessage>> = {};

  for (const locale of locales) {
    filesByLocale[locale] = patterns.map((item) => resolve(projectFolder, item.replace(/\{(locale|languageTag)\}/g, locale)));
    storedByLocale[locale] = new Map();
    filesByLocale[locale].forEach((file, patternIndex) => {
      const content = readJsonIfExists(file);
      if (content !== undefined) collectMessages(content, { file, patternIndex, path: [] }, storedByLocale[locale], readOnly);
    });
  }

  return { baseLocale: settings.baseLocale as string, locales, filesByLocale, storedByLocale, readOnly };
}

function collectMessages(
  node: unknown,
  location: Omit<StoredMessage, 'value'>,
  into: Map<string, StoredMessage>,
  readOnly: Set<string>,
): void {
  if (!isRecord(node)) throw new Error(`${location.file} does not contain a JSON object.`);

  for (const [name, value] of Object.entries(node)) {
    if (location.path.length === 0 && name === '$schema') continue;

    const path = [...location.path, name];
    const key = path.join('.');
    if (typeof value === 'string') {
      into.set(key, { ...location, path, value });
    } else if (Array.isArray(value)) {
      const variants = asVariantMessage(value);
      if (variants) into.set(key, { ...location, path, value: variants });
      else readOnly.add(key);
    } else if (isRecord(value)) {
      collectMessages(value, { ...location, path }, into, readOnly);
    }
  }
}

function asVariantMessage(value: unknown[]): VariantMessage | undefined {
  const [message] = value;
  if (value.length !== 1 || !isRecord(message) || !isRecord(message.match)) return undefined;
  if (!Object.values(message.match).every((text) => typeof text === 'string')) return undefined;

  return {
    declarations: (message.declarations ?? []) as string[],
    selectors: (message.selectors ?? []) as string[],
    match: message.match as Record<string, string>,
  };
}

function readJsonIfExists(file: string): unknown {
  try {
    return readJson(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

function readJson(file: string): unknown {
  const text = readFileSync(file, 'utf-8');
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Cannot parse ${file}: ${(error as Error).message}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
