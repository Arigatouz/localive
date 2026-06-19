import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withSvelteI18n } from './svelte-i18n-adapter';
import type { I18nAdapter, Locale, TranslationDictionary } from '@localive/core';

function createMockSvelteI18n() {
  const translations: Record<string, Record<string, string>> = {
    en: { 'welcome.greeting': 'Hello', 'welcome.title': 'Welcome' },
    fr: { 'welcome.greeting': 'Bonjour', 'welcome.title': 'Bienvenue' },
  };

  let currentLocale = 'en';
  const localeSubscribers: Array<(v: string) => void> = [];

  const i18n = {
    locale: {
      subscribe: vi.fn((cb: (v: string) => void) => {
        localeSubscribers.push(cb);
        cb(currentLocale);
        return () => {
          const idx = localeSubscribers.indexOf(cb);
          if (idx > -1) localeSubscribers.splice(idx, 1);
        };
      }),
      set: vi.fn((locale: string) => {
        currentLocale = locale;
        for (const cb of localeSubscribers) cb(locale);
      }),
    },
    _: {
      subscribe: vi.fn(() => () => {}),
    },
    load: vi.fn(() => Promise.resolve()),
    getLocale: vi.fn(() => currentLocale),
  };

  return i18n;
}

describe('withSvelteI18n', () => {
  let mockI18n: ReturnType<typeof createMockSvelteI18n>;
  let adapter: I18nAdapter;

  beforeEach(() => {
    mockI18n = createMockSvelteI18n();
    adapter = withSvelteI18n(mockI18n as any);
  });

  it('returns an adapter with name "svelte-i18n"', () => {
    expect(adapter.name).toBe('svelte-i18n');
  });

  it('returns current locale from i18n.locale store', () => {
    expect(adapter.getLocale()).toBe('en');
  });

  it('returns locale after locale change', () => {
    mockI18n.locale.set('fr');
    expect(adapter.getLocale()).toBe('fr');
  });

  it('notifies on locale change via store subscription', () => {
    const callback = vi.fn();
    const unsubscribe = adapter.onLocaleChange(callback);

    mockI18n.locale.set('fr');
    expect(callback).toHaveBeenCalledWith('fr');

    unsubscribe();
  });

  it('stops listening after unsubscribe', () => {
    const callback = vi.fn();
    const unsubscribe = adapter.onLocaleChange(callback);

    unsubscribe();
    mockI18n.locale.set('fr');
    expect(callback).not.toHaveBeenCalled();
  });

  it('cleans up subscription on destroy()', () => {
    const callback = vi.fn();
    adapter.onLocaleChange(callback);

    adapter.destroy!();

    mockI18n.locale.set('fr');
    expect(callback).not.toHaveBeenCalled();
  });

  it('returns translations from dictionaryGetter when provided', async () => {
    const dictGetter = vi.fn((locale: string) => {
      const translations: Record<string, Record<string, string>> = {
        en: { 'welcome.greeting': 'Hello' },
        fr: { 'welcome.greeting': 'Bonjour' },
      };
      return translations[locale] ?? {};
    });

    const dictAdapter = withSvelteI18n(mockI18n as any, {
      dictionaryGetter: dictGetter,
    });

    const dict = await dictAdapter.getTranslations('en');
    expect(dictGetter).toHaveBeenCalledWith('en');
    expect(dict['welcome.greeting']).toBe('Hello');
  });

  it('returns empty object when no dictionaryGetter and translations not available', async () => {
    const dict = await adapter.getTranslations('en');
    expect(dict).toEqual({});
  });

  it('works without dictionaryGetter', () => {
    expect(adapter.name).toBe('svelte-i18n');
    expect(adapter.getLocale()).toBe('en');
  });

  it('does not return getKeyFromElement (no marker injection)', () => {
    expect(adapter.getKeyFromElement).toBeUndefined();
  });
});