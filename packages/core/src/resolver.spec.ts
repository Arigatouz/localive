import { describe, it, expect, beforeEach } from 'vitest';
import { KeyResolver } from './resolver';
import { I18nLiveStore } from './store';
import type { Locale, TranslationDictionary, I18nAdapter } from './types';
import { createMockAdapter } from '../../../tools/testing';

describe('KeyResolver', () => {
  let resolver: KeyResolver;
  let store: I18nLiveStore;
  let adapter: I18nAdapter;

  const enDict: TranslationDictionary = {
    'common.greeting': 'Hello',
    'common.farewell': 'Goodbye',
    'home.title': 'Welcome Home',
    'home.subtitle': 'Nice to see you, {{name}}!',
    'users.count': '{{count}} users online',
  };

  const frDict: TranslationDictionary = {
    'common.greeting': 'Bonjour',
    'common.farewell': 'Au revoir',
    'home.title': 'Bienvenue',
  };

  beforeEach(() => {
    document.body.innerHTML = '';
    adapter = createMockAdapter({
      name: 'test-adapter',
      getLocale: () => 'en',
      getTranslations: (locale: Locale) => locale === 'en' ? enDict : frDict,
    });
    store = new I18nLiveStore({
      locale: 'en',
      dictionaries: new Map<Locale, TranslationDictionary>([
        ['en', enDict],
        ['fr', frDict],
      ]),
    });
    resolver = new KeyResolver(store, adapter);
  });

  describe('resolveKey', () => {
    it('resolves key from data-i18n-key attribute (primary)', () => {
      const el = document.createElement('span');
      el.setAttribute('data-i18n-key', 'common.greeting');
      el.textContent = 'Hello';

      expect(resolver.resolveKey(el)).toBe('common.greeting');
    });

    it('returns the exact key from data-i18n-key even when text matches multiple keys', () => {
      const el = document.createElement('span');
      el.setAttribute('data-i18n-key', 'home.title');
      el.textContent = 'Welcome Home';

      expect(resolver.resolveKey(el)).toBe('home.title');
    });

    it('falls back to reverse-lookup when no data-i18n-key attribute', () => {
      const el = document.createElement('span');
      el.textContent = 'Hello';

      expect(resolver.resolveKey(el)).toBe('common.greeting');
    });

    it('reverse-lookup handles interpolated values like {{name}}', () => {
      const el = document.createElement('span');
      el.textContent = 'Nice to see you, Alice!';

      expect(resolver.resolveKey(el)).toBe('home.subtitle');
    });

    it('reverse-lookup handles simple numeric interpolation', () => {
      const el = document.createElement('span');
      el.textContent = '5 users online';

      expect(resolver.resolveKey(el)).toBe('users.count');
    });

    it('returns null for elements with no translation match', () => {
      const el = document.createElement('span');
      el.textContent = 'This text does not exist in translations';

      expect(resolver.resolveKey(el)).toBeNull();
    });

    it('returns null for empty elements', () => {
      const el = document.createElement('span');

      expect(resolver.resolveKey(el)).toBeNull();
    });

    it('works with nested DOM structures', () => {
      const parent = document.createElement('div');
      const child = document.createElement('span');
      child.setAttribute('data-i18n-key', 'common.greeting');
      child.textContent = 'Hello';
      parent.appendChild(child);

      expect(resolver.resolveKey(child)).toBe('common.greeting');
    });

    it('uses getKeyFromElement from adapter when available', () => {
      const customAdapter = createMockAdapter({
        name: 'custom',
        getLocale: () => 'en',
        getTranslations: () => enDict,
        getKeyFromElement: (el: HTMLElement) => {
          const id = el.id;
          return id ? `dynamic.${id}` : null;
        },
      });
      const customResolver = new KeyResolver(store, customAdapter);

      const el = document.createElement('span');
      el.id = 'title';

      expect(customResolver.resolveKey(el)).toBe('dynamic.title');
    });
  });

  describe('resolveKey with adapter getKeyFromElement priority', () => {
    it('prefers data-i18n-key over adapter getKeyFromElement', () => {
      const el = document.createElement('span');
      el.setAttribute('data-i18n-key', 'common.greeting');
      el.id = 'farewell';

      const customAdapter = createMockAdapter({
        name: 'custom',
        getLocale: () => 'en',
        getTranslations: () => enDict,
        getKeyFromElement: (el: HTMLElement) => {
          return el.id ? `dynamic.${el.id}` : null;
        },
      });
      const customResolver = new KeyResolver(store, customAdapter);

      expect(customResolver.resolveKey(el)).toBe('common.greeting');
    });
  });
});