import { describe, it, expect } from 'vitest';
import { validateLocale, validateKey, validatePath, sanitizeValue } from './security';

describe('security', () => {
  describe('validateLocale', () => {
    it('accepts valid locale codes', () => {
      expect(validateLocale('en').valid).toBe(true);
      expect(validateLocale('fr').valid).toBe(true);
      expect(validateLocale('de-DE').valid).toBe(true);
      expect(validateLocale('pt-BR').valid).toBe(true);
      expect(validateLocale('zh-Hans').valid).toBe(true);
    });

    it('rejects empty strings', () => {
      expect(validateLocale('').valid).toBe(false);
    });

    it('rejects locales starting with non-letter characters', () => {
      expect(validateLocale('1en').valid).toBe(false);
      expect(validateLocale('-de').valid).toBe(false);
    });

    it('rejects locales with special characters', () => {
      expect(validateLocale('en_US').valid).toBe(false);
      expect(validateLocale('en..').valid).toBe(false);
    });

    it('rejects path traversal in locale', () => {
      expect(validateLocale('../etc').valid).toBe(false);
    });
  });

  describe('validateKey', () => {
    it('accepts valid translation keys', () => {
      expect(validateKey('common.greeting').valid).toBe(true);
      expect(validateKey('home.title').valid).toBe(true);
      expect(validateKey('nav.dashboard').valid).toBe(true);
    });

    it('rejects __proto__ keys', () => {
      expect(validateKey('__proto__').valid).toBe(false);
    });

    it('rejects prototype keys', () => {
      expect(validateKey('prototype').valid).toBe(false);
    });

    it('rejects constructor keys', () => {
      expect(validateKey('constructor').valid).toBe(false);
    });

    it('rejects keys with __proto__ segments', () => {
      expect(validateKey('foo.__proto__.bar').valid).toBe(false);
    });

    it('accepts keys that contain "constructor" as a substring in a real key', () => {
      expect(validateKey('form.constructor_name').valid).toBe(true);
    });

    it('rejects keys with prototype as exact segment', () => {
      expect(validateKey('foo.prototype.bar').valid).toBe(false);
    });
  });

  describe('validatePath', () => {
    const allowedRoots = ['/app/i18n', '/app/features'];

    it('accepts paths within allowed roots', () => {
      const result = validatePath('/app/i18n/en.json', allowedRoots);
      expect(result.valid).toBe(true);
    });

    it('accepts paths in feature-split folders', () => {
      const result = validatePath('/app/features/auth/i18n/en.json', allowedRoots);
      expect(result.valid).toBe(true);
    });

    it('rejects path traversal with ../', () => {
      const result = validatePath('/app/i18n/../../../etc/passwd', allowedRoots);
      expect(result.valid).toBe(false);
    });

    it('rejects path traversal with URL-encoded characters', () => {
      const result = validatePath('/app/i18n/%2e%2e%2f%2e%2e%2f/etc/passwd', allowedRoots);
      expect(result.valid).toBe(false);
    });

    it('rejects paths outside allowed roots', () => {
      const result = validatePath('/etc/passwd', allowedRoots);
      expect(result.valid).toBe(false);
    });

    it('accepts deeply nested paths within roots', () => {
      const result = validatePath('/app/i18n/features/auth/en.json', allowedRoots);
      expect(result.valid).toBe(true);
    });
  });

  describe('sanitizeValue', () => {
    it('passes through normal strings', () => {
      expect(sanitizeValue('Hello World')).toBe('Hello World');
    });

    it('passes through interpolation placeholders', () => {
      expect(sanitizeValue('Hello, {{name}}!')).toBe('Hello, {{name}}!');
      expect(sanitizeValue('{{count}} items')).toBe('{{count}} items');
    });

    it('preserves ICU plural syntax', () => {
      expect(sanitizeValue('{count, plural, =1 {one item} other {# items}}')).toBe(
        '{count, plural, =1 {one item} other {# items}}'
      );
    });

    it('preserves HTML in translations', () => {
      expect(sanitizeValue('<b>Bold</b>')).toBe('<b>Bold</b>');
    });

    it('preserves emoji and unicode', () => {
      expect(sanitizeValue('Hello 🌍')).toBe('Hello 🌍');
    });
  });
});