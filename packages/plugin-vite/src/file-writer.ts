import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import type { TranslationEntry, SaveResult } from './types';

export function writeTranslationToFile(
  entry: TranslationEntry,
  searchRoots: string[],
  defaultPath: string
): SaveResult {
  const { key, value, locale, filePath } = entry;

  // Validate filePath if provided — must be within allowed roots
  if (filePath) {
    const resolvedPath = resolve(filePath);
    const isWithinRoots = searchRoots.some((root) => {
      const resolvedRoot = resolve(root);
      return resolvedPath.startsWith(resolvedRoot + '/') || resolvedPath.startsWith(resolvedRoot + '\\');
    });

    if (!isWithinRoots) {
      return {
        success: false,
        error: `Path "${filePath}" is outside allowed roots: ${searchRoots.join(', ')}`,
      };
    }
  }

  // Find the correct file for this locale
  const targetFile = filePath ?? findFileForKey(key, locale, searchRoots) ?? getDefaultFile(locale, defaultPath);

  if (!targetFile) {
    return {
      success: false,
      error: `No file found for locale "${locale}" and key "${key}"`,
    };
  }

  // Verify the resolved path is within allowed roots
  const resolvedTarget = resolve(targetFile);
  const isWithinRoots = searchRoots.some((root) => {
    const resolvedRoot = resolve(root);
    return resolvedTarget.startsWith(resolvedRoot + '/') || resolvedTarget.startsWith(resolvedRoot + '\\');
  });

  if (!isWithinRoots) {
    return {
      success: false,
      error: `Resolved path "${resolvedTarget}" is outside allowed roots`,
    };
  }

  try {
    let content: Record<string, unknown>;
    let indent = 2;
    let trailingNewline = true;
    let isNestedFormat = false;

    try {
      const raw = readFileSync(resolvedTarget, 'utf-8');
      trailingNewline = raw.endsWith('\n');

      // Detect indentation
      const indentMatch = raw.match(/^(\s+)\S/m);
      if (indentMatch) {
        indent = indentMatch[1].length;
      }

      content = JSON.parse(raw);

      // Detect nested format: { "en": { "key": "value" }, "fr": { ... } }
      // where the file is named after one of the locale keys
      const parsedLocale = basenameWithoutExt(resolvedTarget);
      if (
        parsedLocale &&
        typeof content[parsedLocale] === 'object' &&
        content[parsedLocale] !== null &&
        !Array.isArray(content[parsedLocale])
      ) {
        isNestedFormat = true;
      }
    } catch {
      // File doesn't exist or is invalid JSON — start fresh
      content = {};
      isNestedFormat = false;
      try {
        mkdirSync(dirname(resolvedTarget), { recursive: true });
      } catch {
        // Directory might already exist
      }
    }

    // Set the key value — write to the correct node
    if (isNestedFormat) {
      const parsedLocale = basenameWithoutExt(resolvedTarget);
      if (parsedLocale && typeof content[parsedLocale] === 'object' && content[parsedLocale] !== null) {
        (content[parsedLocale] as Record<string, unknown>)[key] = value;
      } else {
        content[key] = value;
      }
    } else {
      content[key] = value;
    }

    // Write back with preserved indentation
    const output = JSON.stringify(content, null, indent) + (trailingNewline ? '\n' : '');
    writeFileSync(resolvedTarget, output, 'utf-8');

    return { success: true, filePath: resolvedTarget };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function findFileForKey(key: string, locale: string, searchRoots: string[]): string | null {
  const fileName = `${locale}.json`;

  for (const root of searchRoots) {
    const result = searchDirForKey(root, fileName, key, locale);
    if (result) return result;
  }

  return null;
}

function searchDirForKey(dir: string, fileName: string, key: string, locale: string): string | null {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        const result = searchDirForKey(fullPath, fileName, key, locale);
        if (result) return result;
      } else if (entry.isFile() && entry.name === fileName) {
        try {
          const content = JSON.parse(readFileSync(fullPath, 'utf-8'));

          // Check flat format: content[key] directly
          if (content[key] !== undefined) {
            return fullPath;
          }

          // Check nested format: content[locale][key]
          if (
            typeof content[locale] === 'object' &&
            content[locale] !== null &&
            !Array.isArray(content[locale]) &&
            (content[locale] as Record<string, unknown>)[key] !== undefined
          ) {
            return fullPath;
          }
        } catch {
          continue;
        }
      }
    }
  } catch {
    // Directory doesn't exist or isn't readable
  }
  return null;
}

function getDefaultFile(locale: string, defaultPath: string): string {
  return join(defaultPath, `${locale}.json`);
}

function basenameWithoutExt(filePath: string): string | null {
  const name = filePath.split('/').pop()?.split('\\').pop();
  if (!name) return null;
  const dotIndex = name.lastIndexOf('.');
  return dotIndex > 0 ? name.substring(0, dotIndex) : name;
}
