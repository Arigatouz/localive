import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withI18next } from './i18next-adapter';
import type { I18nAdapter, Locale, TranslationDictionary } from '@localive/core';

function createMockI18next(overrides?: Record<string, unknown>) {
  const translations: Record<string, TranslationDictionary> = {
    en: {
      'common.greeting': 'Hello',
      'common.farewell': 'Goodbye',
      'home.title': 'Welcome Home',
      'home.subtitle': 'Nice to see you, {{name}}!',
    },
    fr: {
      'common.greeting': 'Bonjour',
      'common.farewell': 'Au revoir',
      'home.title': 'Bienvenue',
      'home.subtitle': 'Content de vous voir, {{name}} !',
    },
  };

  const listeners: Record<string, Array<(...args: unknown[]) => void>> = {};

  const i18n = {
    language: 'en' as Locale,
    options: { ns: ['translation'], defaultNS: 'translation' },
    isInitialized: true,
    getResourceBundle: vi.fn((locale: string) => translations[locale] ?? {}),
    on: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(callback);
      return i18n;
    }),
    off: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((cb) => cb !== callback);
      }
      return i18n;
    }),
    changeLanguage: vi.fn((locale: string) => {
      i18n.language = locale as Locale;
      if (listeners['languageChanged']) {
        for (const cb of listeners['languageChanged']) {
          cb(locale);
        }
      }
      return Promise.resolve();
    }),
    t: vi.fn((key: string) => translations[i18n.language]?.[key] ?? key),
    ...overrides,
  };

  return i18n;
}

describe('withI18next', () => {
  let mockI18n: ReturnType<typeof createMockI18next>;
  let adapter: I18nAdapter;

  beforeEach(() => {
    mockI18n = createMockI18next();
    adapter = withI18next(mockI18n as any);
  });

  it('returns an adapter with name "i18next"', () => {
    expect(adapter.name).toBe('i18next');
  });

  it('returns current locale from i18next.language', () => {
    expect(adapter.getLocale()).toBe('en');
  });

  it('returns locale after language change', () => {
    mockI18n.changeLanguage('fr');
    expect(adapter.getLocale()).toBe('fr');
  });

  it('returns translations from i18next.getResourceBundle()', () => {
    const dict = adapter.getTranslations('en');
    expect(dict['common.greeting']).toBe('Hello');
    expect(dict['home.title']).toBe('Welcome Home');
  });

  it('returns translations for a different locale', () => {
    const dict = adapter.getTranslations('fr');
    expect(dict['common.greeting']).toBe('Bonjour');
  });

  it('returns empty object for missing locale', () => {
    const dict = adapter.getTranslations('de');
    expect(dict).toEqual({});
  });

  it('notifies on locale change via i18next languageChanged event', () => {
    const callback = vi.fn();
    const unsubscribe = adapter.onLocaleChange(callback);

    mockI18n.changeLanguage('fr');

    expect(callback).toHaveBeenCalledWith('fr');

    unsubscribe();
  });

  it('stops listening after unsubscribe', () => {
    const callback = vi.fn();
    const unsubscribe = adapter.onLocaleChange(callback);

    unsubscribe();
    mockI18n.changeLanguage('fr');

    expect(callback).not.toHaveBeenCalled();
  });

  it('cleans up listener on destroy()', () => {
    const callback = vi.fn();
    adapter.onLocaleChange(callback);

    adapter.destroy!();

    mockI18n.changeLanguage('fr');
    expect(callback).not.toHaveBeenCalled();
  });

  it('works with namespaces', () => {
    const namespaceI18n = createMockI18next({
      options: { ns: ['common', 'home'], defaultNS: 'home' },
    });
    const nsAdapter = withI18next(namespaceI18n as any);

    expect(nsAdapter.name).toBe('i18next');
    expect(nsAdapter.getLocale()).toBe('en');
  });

  it('does not return getKeyFromElement (no marker injection)', () => {
    expect(adapter.getKeyFromElement).toBeUndefined();
  });
});