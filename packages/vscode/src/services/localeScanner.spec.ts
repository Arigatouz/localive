import { describe, it, expect } from 'vitest';
import { flattenTranslations, parseLocaleFile } from './localeScanner';

describe('localeScanner', () => {
  describe('flattenTranslations', () => {
    it('flattens simple key-value pairs', () => {
      const result = flattenTranslations({ hello: 'Hello', world: 'World' });
      expect(result.get('hello')).toBe('Hello');
      expect(result.get('world')).toBe('World');
    });

    it('flattens nested objects with dot notation', () => {
      const result = flattenTranslations({
        nav: { home: 'Home', about: 'About' },
      });
      expect(result.get('nav.home')).toBe('Home');
      expect(result.get('nav.about')).toBe('About');
    });

    it('handles deeply nested objects', () => {
      const result = flattenTranslations({
        app: { dashboard: { title: 'Dashboard' } },
      });
      expect(result.get('app.dashboard.title')).toBe('Dashboard');
    });

    it('handles mixed flat and nested keys', () => {
      const result = flattenTranslations({
        title: 'App Title',
        nav: { home: 'Home' },
      });
      expect(result.get('title')).toBe('App Title');
      expect(result.get('nav.home')).toBe('Home');
    });

    it('returns empty map for empty object', () => {
      const result = flattenTranslations({});
      expect(result.size).toBe(0);
    });
  });

  describe('parseLocaleFile', () => {
    it('parses valid JSON and extracts locale from path', () => {
      const result = parseLocaleFile('/project/src/locales/en.json', '{"hello":"Hello"}');
      expect(result).not.toBeNull();
      expect(result!.locale).toBe('en');
      expect(result!.translations).toEqual({ hello: 'Hello' });
    });

    it('returns null for invalid JSON', () => {
      const result = parseLocaleFile('/project/src/locales/en.json', 'not json');
      expect(result).toBeNull();
    });

    it('extracts locale from nested directory paths', () => {
      const result = parseLocaleFile('/project/src/i18n/fr/common.json', '{"oui":"Oui"}');
      expect(result).not.toBeNull();
      expect(result!.locale).toBe('common');
    });
  });
});