import { describe, it, expect } from 'vitest';
import { validateLocale, validateKey, validatePath, sanitizeRequestBody } from './security';

describe('plugin security', () => {
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

    it('rejects path traversal', () => {
      expect(validateLocale('../etc').valid).toBe(false);
    });

    it('accepts locales with underscores', () => {
      expect(validateLocale('en_US').valid).toBe(true);
      expect(validateLocale('pt_BR').valid).toBe(true);
      expect(validateLocale('zh_CN').valid).toBe(true);
    });
  });

  describe('validateKey', () => {
    it('rejects prototype pollution segments', () => {
      expect(validateKey('__proto__').valid).toBe(false);
      expect(validateKey('prototype').valid).toBe(false);
      expect(validateKey('constructor').valid).toBe(false);
      expect(validateKey('foo.__proto__.bar').valid).toBe(false);
    });

    it('accepts valid keys', () => {
      expect(validateKey('common.greeting').valid).toBe(true);
      expect(validateKey('home.title').valid).toBe(true);
    });
  });

  describe('validatePath', () => {
    const allowedRoots = ['/app/i18n', '/app/features'];

    it('rejects path traversal', () => {
      expect(validatePath('/app/i18n/../../../etc/passwd', allowedRoots).valid).toBe(false);
    });

    it('accepts valid paths', () => {
      expect(validatePath('/app/i18n/en.json', allowedRoots).valid).toBe(true);
    });
  });

  describe('sanitizeRequestBody', () => {
    it('extracts valid fields from request body', () => {
      const result = sanitizeRequestBody({
        key: 'common.greeting',
        value: 'Hello',
        locale: 'en',
      });

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.entry.key).toBe('common.greeting');
        expect(result.entry.value).toBe('Hello');
        expect(result.entry.locale).toBe('en');
      }
    });

    it('rejects body with __proto__ key', () => {
      const result = sanitizeRequestBody({
        key: '__proto__',
        value: 'malicious',
        locale: 'en',
      });

      expect(result.valid).toBe(false);
    });

    it('rejects body with invalid locale', () => {
      const result = sanitizeRequestBody({
        key: 'hello',
        value: 'World',
        locale: '../etc',
      });

      expect(result.valid).toBe(false);
    });

    it('rejects body with missing required fields', () => {
      const result = sanitizeRequestBody({
        key: 'hello',
      });

      expect(result.valid).toBe(false);
    });

    it('rejects body with non-string key', () => {
      const result = sanitizeRequestBody({
        key: 123,
        value: 'World',
        locale: 'en',
      });

      expect(result.valid).toBe(false);
    });

    it('accepts namespace as optional', () => {
      const result = sanitizeRequestBody({
        key: 'hello',
        value: 'World',
        locale: 'en',
        namespace: 'common',
      });

      expect(result.valid).toBe(true);
    });
  });
});