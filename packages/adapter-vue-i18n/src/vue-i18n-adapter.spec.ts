import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withVueI18n } from './vue-i18n-adapter';
import type { I18nAdapter, Locale, TranslationDictionary } from '@localive/core';

function createMockVueI18n() {
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

  let currentLocale: Locale = 'en';
  const listeners: Array<(locale: Locale) => void> = [];

  const vueI18n = {
    locale: currentLocale as any,
    fallbackLocale: 'en',
    messages: { ...translations },
    availableLocales: ['en', 'fr'] as Locale[],
    t: vi.fn((key: string) => translations[currentLocale]?.[key] ?? key),
    global: {
      locale: { value: currentLocale },
      messages: { ...translations },
      availableLocales: ['en', 'fr'],
      t: vi.fn((key: string) => translations[currentLocale]?.[key] ?? key),
    },
  };

  return {
    vueI18n,
    setLocale: (locale: Locale) => {
      currentLocale = locale;
      vueI18n.locale = locale;
      vueI18n.global.locale.value = locale;
      for (const cb of listeners) cb(locale);
    },
    onLocaleChange: (cb: (locale: Locale) => void) => {
      listeners.push(cb);
      return () => {
        const idx = listeners.indexOf(cb);
        if (idx > -1) listeners.splice(idx, 1);
      };
    },
  };
}

describe('withVueI18n', () => {
  let mock: ReturnType<typeof createMockVueI18n>;
  let adapter: I18nAdapter;

  beforeEach(() => {
    mock = createMockVueI18n();
    adapter = withVueI18n(mock.vueI18n as any, mock.onLocaleChange);
  });

  it('returns an adapter with name "vue-i18n"', () => {
    expect(adapter.name).toBe('vue-i18n');
  });

  it('returns current locale from vue-i18n', () => {
    expect(adapter.getLocale()).toBe('en');
  });

  it('returns locale after language change', () => {
    mock.setLocale('fr');
    expect(adapter.getLocale()).toBe('fr');
  });

  it('returns translations from vue-i18n messages', () => {
    const dict = adapter.getTranslations('en');
    expect(dict['common.greeting']).toBe('Hello');
    expect(dict['home.title']).toBe('Welcome Home');
  });

  it('returns translations for a different locale', () => {
    const dict = adapter.getTranslations('fr');
    expect(dict['common.greeting']).toBe('Bonjour');
  });

  it('handles missing locale gracefully', () => {
    const dict = adapter.getTranslations('de');
    expect(dict).toEqual({});
  });

  it('notifies on locale change via callback', () => {
    const callback = vi.fn();
    const unsubscribe = adapter.onLocaleChange(callback);

    mock.setLocale('fr');

    expect(callback).toHaveBeenCalledWith('fr');

    unsubscribe();
  });

  it('stops listening after unsubscribe', () => {
    const callback = vi.fn();
    const unsubscribe = adapter.onLocaleChange(callback);

    unsubscribe();
    mock.setLocale('fr');

    expect(callback).not.toHaveBeenCalled();
  });

  it('cleans up listener on destroy()', () => {
    const callback = vi.fn();
    adapter.onLocaleChange(callback);

    adapter.destroy!();

    mock.setLocale('fr');
    expect(callback).not.toHaveBeenCalled();
  });

  it('works with flat message structures', () => {
    const dict = adapter.getTranslations('en');
    expect(dict['common.greeting']).toBe('Hello');
  });

  it('works with nested message structures', () => {
    const nestedI18n = createMockVueI18n();
    // Override to simulate nested structure
    const nestedMessages = {
      en: {
        'common.greeting': 'Hello',
        'common.nested.deep': 'Deep value',
      },
      fr: {
        'common.greeting': 'Bonjour',
      },
    };
    nestedI18n.vueI18n.global.messages = nestedMessages;
    nestedI18n.vueI18n.messages = nestedMessages;

    const nestedAdapter = withVueI18n(nestedI18n.vueI18n as any, nestedI18n.onLocaleChange);
    const dict = nestedAdapter.getTranslations('en');
    expect(dict['common.greeting']).toBe('Hello');
    expect(dict['common.nested.deep']).toBe('Deep value');
  });

  it('does not return getKeyFromElement (no marker injection)', () => {
    expect(adapter.getKeyFromElement).toBeUndefined();
  });
});