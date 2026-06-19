import { describe, it, expect } from 'vitest';
import { findKeyAtOffset, findAllKeys } from './keyParser';

describe('keyParser', () => {
  describe('findKeyAtOffset', () => {
    it('finds key inside t() call', () => {
      const text = "const greeting = t('home.title');";
      const offset = text.indexOf("'home.title'") + 3;
      const result = findKeyAtOffset(text, offset);
      expect(result).not.toBeNull();
      expect(result!.key).toBe('home.title');
    });

    it('finds key inside data-i18n-key attribute', () => {
      const text = '<span data-i18n-key="app.greeting">Hello</span>';
      const offset = text.indexOf('"app.greeting"') + 2;
      const result = findKeyAtOffset(text, offset);
      expect(result).not.toBeNull();
      expect(result!.key).toBe('app.greeting');
    });

    it('finds key inside Angular attr binding', () => {
      const text = "[attr.data-i18n-key]=\"'nav.link'\"";
      const offset = text.indexOf("'nav.link'") + 2;
      const result = findKeyAtOffset(text, offset);
      expect(result).not.toBeNull();
      expect(result!.key).toBe('nav.link');
    });

    it('finds key inside v-localive-tag directive', () => {
      const text = "<span v-localive-tag=\"'sidebar.menu'\">";
      const offset = text.indexOf("'sidebar.menu'") + 2;
      const result = findKeyAtOffset(text, offset);
      expect(result).not.toBeNull();
      expect(result!.key).toBe('sidebar.menu');
    });

    it('returns null when cursor is not on a key', () => {
      const text = 'const x = 42;';
      const result = findKeyAtOffset(text, 5);
      expect(result).toBeNull();
    });

    it('handles double-quoted t() keys', () => {
      const text = 't("welcome.message")';
      const offset = text.indexOf('"welcome.message"') + 2;
      const result = findKeyAtOffset(text, offset);
      expect(result).not.toBeNull();
      expect(result!.key).toBe('welcome.message');
    });

    it('handles template literal t() keys', () => {
      const text = 't(`dashboard.stats`)';
      const offset = text.indexOf('`dashboard.stats`') + 2;
      const result = findKeyAtOffset(text, offset);
      expect(result).not.toBeNull();
      expect(result!.key).toBe('dashboard.stats');
    });
  });

  describe('findAllKeys', () => {
    it('finds all keys in mixed content', () => {
      const text = `
        t('home.title')
        <span data-i18n-key="nav.link">
        [attr.data-i18n-key]="'footer.copy'"
        v-localive-tag="'sidebar.menu'"
      `;
      const results = findAllKeys(text);
      expect(results).toHaveLength(4);
      expect(results.map((r) => r.key)).toContain('home.title');
      expect(results.map((r) => r.key)).toContain('nav.link');
      expect(results.map((r) => r.key)).toContain('footer.copy');
      expect(results.map((r) => r.key)).toContain('sidebar.menu');
    });

    it('returns empty array for no matches', () => {
      const text = 'const x = 42;';
      const results = findAllKeys(text);
      expect(results).toHaveLength(0);
    });

    it('deduplicates keys found by different patterns', () => {
      const text = "t('hello') t('hello')";
      const results = findAllKeys(text);
      expect(results).toHaveLength(2);
      expect(results.every((r) => r.key === 'hello')).toBe(true);
    });
  });
});