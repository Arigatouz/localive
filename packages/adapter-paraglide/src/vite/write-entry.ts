import type { TranslationEntry } from '@localive/core';
import { applyEdits, findNodeAtLocation, modify, parseTree, type FormattingOptions, type Node, type ParseError } from 'jsonc-parser';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { readProject, type MessageProject, type StoredMessage, type VariantMessage } from './catalog.js';
import { declaredNames, findPatternProblem, readPattern } from './message-pattern.js';

export interface SaveResult {
  success: boolean;
  filePath?: string;
  error?: string;
  conflict?: boolean;
}

interface PlannedWrite {
  file: string;
  /** File whose formatting a new file copies. */
  formattingSource: string;
  path: (string | number)[];
  value: string | [VariantMessage];
  currentText: string | null;
}

class RefusedEntry extends Error {
  constructor(
    message: string,
    readonly isConflict = false,
  ) {
    super(message);
  }
}

/** Saves an entry into the inlang message files, changing only the bytes of that message. */
export function writeEntry(projectPath: string, entry: TranslationEntry): SaveResult {
  try {
    const plan = planWrite(readProject(projectPath), entry);
    writeJson(plan, entry.key);
    return { success: true, filePath: plan.file };
  } catch (error) {
    return {
      success: false,
      conflict: error instanceof RefusedEntry && error.isConflict ? true : undefined,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function planWrite(project: MessageProject, { key, value, locale, variant, expected }: TranslationEntry): PlannedWrite {
  if (!project.locales.includes(locale)) throw new RefusedEntry(`"${locale}" is not a locale of the project`);
  if (project.readOnly.has(key)) throw new RefusedEntry(`"${key}" uses a message shape that cannot be edited here`);

  const stored = project.storedByLocale[locale].get(key);
  const reference = stored ?? findInAnyLocale(project, key);
  if (!reference) throw new RefusedEntry(`"${key}" is not a message of the project`);

  const plan =
    variant === undefined
      ? planTextWrite(key, value, stored, reference)
      : planVariantWrite(key, variant, value, stored, reference);
  if (expected !== undefined && plan.currentText !== expected) {
    throw new RefusedEntry(`"${key}" changed since it was loaded`, true);
  }

  const problem = findPatternProblem(value, ...allowedPatternParts(project, key));
  if (problem) throw new RefusedEntry(`Cannot save "${key}": ${problem}`);

  const file = stored?.file ?? project.filesByLocale[locale][reference.patternIndex];
  return { ...plan, file, formattingSource: reference.file };
}

function planTextWrite(key: string, value: string, stored: StoredMessage | undefined, reference: StoredMessage) {
  if (typeof reference.value !== 'string') throw new RefusedEntry(`"${key}" has variants; save one variant at a time`);
  return { path: reference.path, value, currentText: (stored?.value as string | undefined) ?? null };
}

function planVariantWrite(key: string, variant: string, value: string, stored: StoredMessage | undefined, reference: StoredMessage) {
  const message = reference.value;
  if (typeof message === 'string') throw new RefusedEntry(`"${key}" has no variants`);

  for (const condition of variant.split(',')) {
    const selector = condition.split('=')[0].trim();
    if (!condition.includes('=') || !message.selectors.includes(selector)) {
      throw new RefusedEntry(`"${key}" does not declare the selector "${selector}" used by variant "${variant}"`);
    }
  }

  if (stored) {
    const { match } = stored.value as VariantMessage;
    const currentText = Object.hasOwn(match, variant) ? match[variant] : null;
    return { path: [...stored.path, 0, 'match', variant], value, currentText };
  }
  const { declarations, selectors } = message;
  const newMessage: [VariantMessage] = [{ declarations, selectors, match: { [variant]: value } }];
  return { path: reference.path, value: newMessage, currentText: null };
}

function findInAnyLocale(project: MessageProject, key: string): StoredMessage | undefined {
  const locales = [project.baseLocale, ...project.locales.filter((locale) => locale !== project.baseLocale)];
  for (const locale of locales) {
    const stored = project.storedByLocale[locale].get(key);
    if (stored) return stored;
  }
  return undefined;
}

function allowedPatternParts(project: MessageProject, key: string): [Set<string>, Set<string>] {
  const names = new Set<string>();
  const tags = new Set<string>();
  for (const locale of project.locales) {
    const message = project.storedByLocale[locale].get(key)?.value;
    if (message === undefined) continue;

    const patterns = typeof message === 'string' ? [message] : Object.values(message.match);
    if (typeof message !== 'string') declaredNames(message.declarations).forEach((name) => names.add(name));
    for (const pattern of patterns) {
      const { placeholders, markup } = readPattern(pattern);
      placeholders.forEach((name) => names.add(name));
      markup.forEach(({ name }) => tags.add(name));
    }
  }
  return [names, tags];
}

function writeJson(plan: PlannedWrite, key: string): void {
  const existing = readTextIfExists(plan.file);
  const formatting = detectFormatting(existing ?? readFileSync(plan.formattingSource, 'utf-8'));
  const text = existing?.trim() ? existing : '{}';

  const errors: ParseError[] = [];
  const tree = parseTree(text, errors, { allowTrailingComma: false, disallowComments: true });
  if (!tree || errors.length > 0) throw new RefusedEntry(`${plan.file} is not valid JSON`);
  if (hasDuplicateKeys(tree)) throw new RefusedEntry(`${plan.file} has duplicate keys, so the one Paraglide uses is unclear`);

  for (let length = 1; length < plan.path.length; length++) {
    const parent = findNodeAtLocation(tree, plan.path.slice(0, length));
    if (parent && typeof plan.path[length] === 'string' && parent.type !== 'object') {
      throw new RefusedEntry(`"${plan.path.slice(0, length).join('.')}" in ${plan.file} is not a group, so "${key}" cannot go inside it`);
    }
  }

  const updated = applyEdits(text, modify(text, plan.path, plan.value, { formattingOptions: formatting }));
  const output = existing?.trim() || !formatting.insertFinalNewline ? updated : updated + formatting.eol;
  mkdirSync(dirname(plan.file), { recursive: true });
  writeFileSync(plan.file, output);
}

function detectFormatting(text: string): FormattingOptions {
  const indent = text.match(/^[ \t]+(?=\S)/m)?.[0] ?? '  ';
  return {
    insertSpaces: !indent.includes('\t'),
    tabSize: indent.includes('\t') ? 1 : indent.length,
    eol: text.includes('\r\n') ? '\r\n' : '\n',
    insertFinalNewline: /\r?\n$/.test(text),
  };
}

function hasDuplicateKeys(node: Node): boolean {
  if (node.type === 'object') {
    const names = (node.children ?? []).map((property) => property.children?.[0]?.value as string);
    if (new Set(names).size !== names.length) return true;
  }
  return (node.children ?? []).some(hasDuplicateKeys);
}

function readTextIfExists(file: string): string | undefined {
  try {
    return readFileSync(file, 'utf-8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}
