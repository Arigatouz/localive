import { describe, it, expect } from 'vitest';
import { TranslationStore, flattenTranslations } from './translationStore';
import type { LocaleFileData } from './localeScanner';

function makeFile(path: string, locale: string, translations: Record<string, unknown>): LocaleFileData {
  return { path, locale, translations };
}

describe('TranslationStore', () => {
  describe('update + getTranslation', () => {
    it('stores and retrieves a translation by key and locale', () => {
      const store = new TranslationStore();
      store.update([makeFile('/app/locales/en.json', 'en', { hello: 'Hello' })]);

      expect(store.getTranslation('hello', 'en')).toBe('Hello');
    });

    it('returns undefined for missing key or locale', () => {
      const store = new TranslationStore();
      store.update([makeFile('/app/locales/en.json', 'en', { hello: 'Hello' })]);

      expect(store.getTranslation('missing', 'en')).toBeUndefined();
      expect(store.getTranslation('hello', 'fr')).toBeUndefined();
    });

    it('stores the same key across multiple locales', () => {
      const store = new TranslationStore();
      store.update([
        makeFile('/app/locales/en.json', 'en', { greeting: 'Hello' }),
        makeFile('/app/locales/fr.json', 'fr', { greeting: 'Bonjour' }),
      ]);

      expect(store.getTranslation('greeting', 'en')).toBe('Hello');
      expect(store.getTranslation('greeting', 'fr')).toBe('Bonjour');
    });
  });

  describe('getAllTranslations', () => {
    it('returns translations for a key across all locales', () => {
      const store = new TranslationStore();
      store.update([
        makeFile('/app/locales/en.json', 'en', { greeting: 'Hello' }),
        makeFile('/app/locales/fr.json', 'fr', { greeting: 'Bonjour' }),
        makeFile('/app/locales/de.json', 'de', { greeting: 'Hallo' }),
      ]);

      const all = store.getAllTranslations('greeting');
      expect(all.size).toBe(3);
      expect(all.get('en')?.value).toBe('Hello');
      expect(all.get('fr')?.value).toBe('Bonjour');
      expect(all.get('de')?.value).toBe('Hallo');
    });

    it('returns empty map for missing key', () => {
      const store = new TranslationStore();
      const all = store.getAllTranslations('missing');
      expect(all.size).toBe(0);
    });
  });

  describe('getKeys', () => {
    it('returns all stored keys', () => {
      const store = new TranslationStore();
      store.update([
        makeFile('/app/locales/en.json', 'en', { hello: 'Hello', world: 'World' }),
      ]);

      const keys = store.getKeys();
      expect(keys).toContain('hello');
      expect(keys).toContain('world');
    });
  });

  describe('getLocales', () => {
    it('returns all locales from stored translations', () => {
      const store = new TranslationStore();
      store.update([
        makeFile('/app/locales/en.json', 'en', { hello: 'Hello' }),
        makeFile('/app/locales/fr.json', 'fr', { greeting: 'Bonjour' }),
      ]);

      const locales = store.getLocales();
      expect(locales).toContain('en');
      expect(locales).toContain('fr');
    });
  });

  describe('missingKeys', () => {
    it('identifies keys present in some locales but missing in others', () => {
      const store = new TranslationStore();
      store.update([
        makeFile('/app/locales/en.json', 'en', { hello: 'Hello', onlyEn: 'English only' }),
        makeFile('/app/locales/fr.json', 'fr', { hello: 'Bonjour' }),
      ]);

      const missing = store.missingKeys(['en', 'fr']);
      expect(missing.get('onlyEn')).toEqual(['fr']);
    });

    it('returns empty map when all locales have all keys', () => {
      const store = new TranslationStore();
      store.update([
        makeFile('/app/locales/en.json', 'en', { hello: 'Hello' }),
        makeFile('/app/locales/fr.json', 'fr', { hello: 'Bonjour' }),
      ]);

      const missing = store.missingKeys(['en', 'fr']);
      expect(missing.size).toBe(0);
    });
  });

  describe('hasKey', () => {
    it('returns true for an existing key', () => {
      const store = new TranslationStore();
      store.update([makeFile('/app/locales/en.json', 'en', { hello: 'Hello' })]);
      expect(store.hasKey('hello')).toBe(true);
    });

    it('returns false for a missing key', () => {
      const store = new TranslationStore();
      expect(store.hasKey('missing')).toBe(false);
    });
  });

  describe('nested translations', () => {
    it('flattens nested objects with dot notation', () => {
      const store = new TranslationStore();
      store.update([
        makeFile('/app/locales/en.json', 'en', {
          nav: { home: 'Home', about: 'About' },
        }),
      ]);

      expect(store.getTranslation('nav.home', 'en')).toBe('Home');
      expect(store.getTranslation('nav.about', 'en')).toBe('About');
    });
  });

  describe('getLocaleFile', () => {
    it('returns the file data for a locale', () => {
      const store = new TranslationStore();
      store.update([makeFile('/app/locales/en.json', 'en', { hello: 'Hello' })]);
      const file = store.getLocaleFile('en');
      expect(file).not.toBeNull();
      expect(file!.locale).toBe('en');
    });

    it('returns undefined for missing locale', () => {
      const store = new TranslationStore();
      expect(store.getLocaleFile('xx')).toBeUndefined();
    });
  });
});

describe('flattenTranslations', () => {
  it('flattens nested objects', () => {
    const result = flattenTranslations({
      nav: { home: 'Home' },
      title: 'App Title',
    });
    expect(result.get('nav.home')).toBe('Home');
    expect(result.get('title')).toBe('App Title');
  });
});