import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { localeFromPath } from '@localive/core';
import type { LocaleFileData, LocaleFileInfo } from './contracts';

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte', '.html']);

export function resolveCwd(cwd?: string): string {
  return resolve(cwd ?? process.cwd());
}

export function resolveSourceRoots(cwd: string, sourceRoots?: string[]): string[] {
  const rawRoots = sourceRoots?.length ? sourceRoots : ['src'];
  return rawRoots.map((root) => resolve(cwd, root));
}

export function listSourceFiles(cwd: string, sourceRoots?: string[]): string[] {
  const roots = resolveSourceRoots(cwd, sourceRoots);
  const files = new Set<string>();

  for (const root of roots) {
    for (const filePath of walkFiles(root)) {
      if (SOURCE_EXTENSIONS.has(extname(filePath))) {
        files.add(filePath);
      }
    }
  }

  return [...files].sort();
}

export function resolveLocaleFiles(cwd: string, localeFiles?: string[]): LocaleFileInfo[] {
  const resolvedFiles = localeFiles?.length
    ? localeFiles.map((filePath) => resolve(cwd, filePath))
    : walkFiles(resolve(cwd, 'src/locales')).filter((filePath) => extname(filePath) === '.json');

  return resolvedFiles
    .sort()
    .map((filePath) => ({
      filePath,
      locale: localeFromPath(filePath),
    }));
}

export function readLocaleFile(filePath: string, locale: string): LocaleFileData {
  const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as Record<string, unknown>;
  const wrappedValue = raw[locale];

  if (isRecord(wrappedValue)) {
    return {
      filePath,
      locale,
      shape: 'wrapped',
      raw,
      translations: toTranslationDictionary(wrappedValue),
    };
  }

  return {
    filePath,
    locale,
    shape: 'flat',
    raw,
    translations: toTranslationDictionary(raw),
  };
}

export function writeLocaleFile(data: LocaleFileData, translations: Record<string, string>): void {
  const nextRaw = data.shape === 'wrapped'
    ? { ...data.raw, [data.locale]: translations }
    : translations;

  mkdirSync(dirname(data.filePath), { recursive: true });
  writeFileSync(data.filePath, JSON.stringify(nextRaw, null, 2) + '\n', 'utf-8');
}

function walkFiles(dir: string): string[] {
  if (!exists(dir)) {
    return [];
  }

  const files: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }
    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function exists(filePath: string): boolean {
  try {
    statSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toTranslationDictionary(value: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entryValue]) => (
      typeof entryValue === 'string' ? [[key, entryValue]] : []
    )),
  );
}
