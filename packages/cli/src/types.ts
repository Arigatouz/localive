import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { sortedKeys } from '@localive/core';
import type { TypesOptions, TypesResult } from './contracts';
import { readLocaleFile, resolveCwd, resolveLocaleFiles } from './fs-utils';

export function generateTypes(options: TypesOptions = {}): TypesResult {
  const cwd = resolveCwd(options.cwd);
  const localeInfos = resolveLocaleFiles(cwd, options.localeFiles);
  const keys = new Set<string>();

  for (const localeInfo of localeInfos) {
    const localeFile = readLocaleFile(localeInfo.filePath, localeInfo.locale);
    for (const key of Object.keys(localeFile.translations)) {
      keys.add(key);
    }
  }

  const dedupedKeys = sortedKeys(keys);
  const outFile = resolve(cwd, options.outFile ?? 'localive.d.ts');
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, renderTypeFile(dedupedKeys), 'utf-8');

  return {
    cwd,
    outFile,
    keys: dedupedKeys,
  };
}

function renderTypeFile(keys: string[]): string {
  const union = keys.length > 0
    ? keys.map((key) => `  | '${escapeSingleQuotes(key)}'`).join('\n')
    : '  | never';

  return [
    'export type TranslationKey =',
    union + ';',
    '',
  ].join('\n');
}

function escapeSingleQuotes(value: string): string {
  return value.replace(/'/gu, "\\'");
}
