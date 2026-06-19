import { readFileSync } from 'node:fs';
import { sortedKeys } from '@localive/core';
import type { ExtractOptions, ExtractResult } from './contracts';
import { listSourceFiles, resolveCwd } from './fs-utils';

const T_FUNCTION_PATTERN = /\bt\(\s*['"`]([^'"`]+)['"`]\s*\)/gu;
const DATA_I18N_KEY_PATTERN = /data-i18n-key\s*=\s*['"]([^'"]+)['"]/gu;
const ANGULAR_ATTR_PATTERN = /\[attr\.data-i18n-key\]\s*=\s*["']'([^"']+)'["']/gu;
const VUE_LOCALIVE_TAG_PATTERN = /v-localive-tag\s*=\s*["']'([^"']+)'["']/gu;
const ANGULAR_TRANSLATIONS_ACCESS_PATTERN = /translations\(\)\[currentLocale\(\)\]\.([A-Za-z][A-Za-z0-9]*)/gu;

export function extractKeys(options: ExtractOptions = {}): ExtractResult {
  const cwd = resolveCwd(options.cwd);
  const files = listSourceFiles(cwd, options.sourceRoots);
  const keys = new Set<string>();

  for (const filePath of files) {
    const source = readFileSync(filePath, 'utf-8');
    collectMatches(source, T_FUNCTION_PATTERN, keys);
    collectMatches(source, DATA_I18N_KEY_PATTERN, keys);
    collectMatches(source, ANGULAR_ATTR_PATTERN, keys);
    collectMatches(source, VUE_LOCALIVE_TAG_PATTERN, keys);
    collectAngularPropertyKeys(source, keys);
  }

  return {
    cwd,
    files,
    keys: sortedKeys(keys),
  };
}

function collectMatches(source: string, pattern: RegExp, keys: Set<string>): void {
  pattern.lastIndex = 0;
  for (const match of source.matchAll(pattern)) {
    const key = match[1]?.trim();
    if (key) {
      keys.add(key);
    }
  }
}

function collectAngularPropertyKeys(source: string, keys: Set<string>): void {
  ANGULAR_TRANSLATIONS_ACCESS_PATTERN.lastIndex = 0;
  for (const match of source.matchAll(ANGULAR_TRANSLATIONS_ACCESS_PATTERN)) {
    const propertyName = match[1];
    const key = propertyToKey(propertyName);
    if (key) {
      keys.add(key);
    }
  }
}

function propertyToKey(propertyName: string): string | null {
  const match = propertyName.match(/^([a-z]+)([A-Z].*)$/u);
  if (!match) {
    return null;
  }

  const [, namespace, suffix] = match;
  const normalizedSuffix = suffix.replace(/[A-Z]/gu, (char) => `.${char.toLowerCase()}`);
  return `${namespace}${normalizedSuffix}`;
}
