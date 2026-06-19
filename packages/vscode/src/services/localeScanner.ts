import { localeFromPath } from '@localive/core';

export interface LocaleFileData {
  path: string;
  locale: string;
  translations: Record<string, unknown>;
}

export function flattenTranslations(
  obj: Record<string, unknown>,
  prefix = '',
): Map<string, string> {
  const result = new Map<string, string>();

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      result.set(fullKey, value);
    } else if (value !== null && typeof value === 'object') {
      for (const [subKey, subValue] of flattenTranslations(
        value as Record<string, unknown>,
        fullKey,
      )) {
        result.set(subKey, subValue);
      }
    }
  }

  return result;
}

export function parseLocaleFile(path: string, content: string): LocaleFileData | null {
  try {
    const translations: Record<string, unknown> = JSON.parse(content);
    const locale = localeFromPath(path);
    return { path, locale, translations };
  } catch {
    return null;
  }
}