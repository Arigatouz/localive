import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { TranslationDictionary } from '@localive/core';

export function createTestFile(
  dir: string,
  locale: string,
  content: TranslationDictionary,
  indent: number = 2
): string {
  const filePath = join(dir, `${locale}.json`);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(filePath, JSON.stringify(content, null, indent) + '\n', 'utf-8');
  return filePath;
}

export function assertJsonFile(
  filePath: string,
  expected: TranslationDictionary
): { match: boolean; actual: TranslationDictionary | null } {
  const { readFileSync } = require('node:fs');
  try {
    const content = readFileSync(filePath, 'utf-8');
    const actual = JSON.parse(content);
    return { match: JSON.stringify(actual) === JSON.stringify(expected), actual };
  } catch {
    return { match: false, actual: null };
  }
}

export function createTempDir(prefix: string = 'localive-test-'): string {
  const { tmpdir } = require('node:os');
  const { randomUUID } = require('node:crypto');
  const dir = join(tmpdir(), `${prefix}${randomUUID()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function cleanupDir(dir: string): void {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}