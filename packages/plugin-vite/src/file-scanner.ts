import { readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import type { DevServerConfig, ScannedFile } from './types';

export function scanTranslationFiles(config: DevServerConfig): ScannedFile[] {
  const { translationsPath, searchRoots, locales } = config;
  const roots = searchRoots ? [translationsPath, ...searchRoots] : [translationsPath];
  const files: ScannedFile[] = [];

  for (const root of roots) {
    const found = scanDirectory(root, locales);
    for (const file of found) {
      if (!files.some((f) => f.path === file.path)) {
        files.push(file);
      }
    }
  }

  return files;
}

function scanDirectory(dir: string, locales: string[]): ScannedFile[] {
  const files: ScannedFile[] = [];

  if (!existsSync(dir)) return files;

  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...scanSubdirectory(fullPath, locales));
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        const localeName = basename(entry.name, '.json');
        if (locales.includes(localeName)) {
          files.push({ locale: localeName, path: fullPath });
        }
      }
    }
  } catch {
    return files;
  }

  return files;
}

function scanSubdirectory(dir: string, locales: string[]): ScannedFile[] {
  const files: ScannedFile[] = [];

  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...scanSubdirectory(fullPath, locales));
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        const localeName = basename(entry.name, '.json');
        if (locales.includes(localeName)) {
          files.push({ locale: localeName, path: fullPath });
        }
      }
    }
  } catch {
    return files;
  }

  return files;
}

function existsSync(path: string): boolean {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
}