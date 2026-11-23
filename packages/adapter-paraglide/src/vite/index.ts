import type { TranslationEntry } from '@localive/core';
import type { IncomingMessage } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { markerFor } from '../runtime/index.js';
import { readCatalog, type MessageCatalog } from './catalog.js';
import { instrumentMessageModule, type TransformedModule } from './instrument-messages.js';
import { handleRequestInScope } from './request-scope.js';
import { loadRuntimeBridge, resolveRuntimeBridge } from './runtime-bridge.js';
import { writeEntry, type SaveResult } from './write-entry.js';

export interface ParaglideIntegrationOptions {
  /** Path of the inlang project folder, such as `./project.inlang`, relative to the working directory like Paraglide's. */
  project: string;
  /** Keys whose output stays unmarked, for messages used in URLs, headers or comparisons. */
  exclude?: (string | RegExp)[];
}

/** Matches the integration shape of `@localive/vite`, which accepts it structurally. */
export interface ParaglideIntegration {
  write(entry: TranslationEntry): SaveResult;
  readCatalog(): MessageCatalog;
  resolveId(source: string): string | null;
  load(id: string): string | null;
  transform(this: { parse(code: string): unknown }, code: string, id: string): TransformedModule | null;
  handleRequest(req: IncomingMessage, next: () => void): void;
}

// The built vite.js sits beside runtime.js in dist.
const RUNTIME_FILE = fileURLToPath(new URL(/* @vite-ignore */ './runtime.js', import.meta.url));

export function paraglideIntegration({ project, exclude = [] }: ParaglideIntegrationOptions): ParaglideIntegration {
  const projectPath = resolve(project);
  const isExcluded = (key: string) => exclude.some((pattern) => (typeof pattern === 'string' ? pattern === key : pattern.test(key)));
  const reportedCollisions = new Set<string>();

  return {
    write: (entry) => writeEntry(projectPath, entry),
    readCatalog() {
      const catalog = readCatalog(projectPath);
      for (const collision of findMarkerCollisions(catalog)) {
        if (reportedCollisions.has(collision)) continue;
        reportedCollisions.add(collision);
        console.warn(`[localive] ${collision} share a marker, so clicking either may open the other.`);
      }
      return catalog;
    },
    resolveId: resolveRuntimeBridge,
    load: (id) => loadRuntimeBridge(id, { searchFolders: [dirname(projectPath), process.cwd()], runtimeFile: RUNTIME_FILE }),
    transform(code, id) {
      return instrumentMessageModule(code, id, (source) => this.parse(source), { isExcluded });
    },
    handleRequest: handleRequestInScope,
  };
}

function findMarkerCollisions({ locales, messages }: MessageCatalog): string[] {
  const keys = new Set(locales.flatMap((locale) => Object.keys(messages[locale])));
  const messagesByMarker = new Map<string, string>();
  const collisions: string[] = [];
  for (const locale of locales) {
    for (const key of keys) {
      const name = `"${key}" (${locale})`;
      const marker = markerFor(locale, key);
      const other = messagesByMarker.get(marker);
      if (other) collisions.push(`${other} and ${name}`);
      else messagesByMarker.set(marker, name);
    }
  }
  return collisions;
}

export type { MessageCatalog } from './catalog.js';
export type { SaveResult } from './write-entry.js';
