import type { LocaleFileData } from './localeScanner';

export interface TranslationEntry {
  value: string;
  locale: string;
  path: string;
}

export class TranslationStore implements Disposable {
  private keyToLocales = new Map<string, Map<string, TranslationEntry>>();
  private fileData = new Map<string, LocaleFileData>();

  [Symbol.dispose](): void {
    this.keyToLocales.clear();
    this.fileData.clear();
  }

  update(files: LocaleFileData[]): void {
    this.keyToLocales.clear();
    this.fileData.clear();

    for (const file of files) {
      this.fileData.set(file.path, file);
      this.indexFile(file);
    }
  }

  getTranslation(key: string, locale: string): string | undefined {
    return this.keyToLocales.get(key)?.get(locale)?.value;
  }

  getAllTranslations(key: string): Map<string, TranslationEntry> {
    return this.keyToLocales.get(key) ?? new Map();
  }

  getKeys(): string[] {
    return Array.from(this.keyToLocales.keys());
  }

  getLocales(): string[] {
    const locales = new Set<string>();
    for (const [, entries] of this.keyToLocales) {
      for (const locale of entries.keys()) {
        locales.add(locale);
      }
    }
    return Array.from(locales);
  }

  getDefaultLocale(): string | undefined {
    const locales = this.getLocales();
    return locales.length > 0 ? locales.sort()[0] : undefined;
  }

  getLocaleFile(locale: string): LocaleFileData | undefined {
    for (const [, data] of this.fileData) {
      if (data.locale === locale) {
        return data;
      }
    }
    return undefined;
  }

  getLocaleFileData(): LocaleFileData[] {
    return Array.from(this.fileData.values());
  }

  hasKey(key: string): boolean {
    return this.keyToLocales.has(key);
  }

  dispose(): void {
    this.keyToLocales.clear();
    this.fileData.clear();
  }

  missingKeys(locales: string[]): Map<string, string[]> {
    const result = new Map<string, string[]>();
    for (const [key, entries] of this.keyToLocales) {
      const presentLocales = new Set(entries.keys());
      const missing = locales.filter((l) => !presentLocales.has(l));
      if (missing.length > 0) {
        result.set(key, missing);
      }
    }
    return result;
  }

  private indexFile(file: LocaleFileData): void {
    const flat = flattenTranslations(file.translations);
    for (const [key, value] of flat) {
      if (!this.keyToLocales.has(key)) {
        this.keyToLocales.set(key, new Map());
      }
      this.keyToLocales.get(key)!.set(file.locale, {
        value,
        locale: file.locale,
        path: file.path,
      });
    }
  }
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