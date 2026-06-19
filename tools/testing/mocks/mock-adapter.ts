import { vi } from 'vitest';
import type { I18nAdapter, Locale, TranslationDictionary } from '@localive/core';

export function createMockAdapter(overrides?: Partial<I18nAdapter>): I18nAdapter {
  const dictionaries: Record<Locale, TranslationDictionary> = {
    en: {
      'common.greeting': 'Hello',
      'common.farewell': 'Goodbye',
      'home.title': 'Welcome Home',
      'home.subtitle': 'Nice to see you, {{name}}!',
      'users.count': '{{count}} users online',
    },
    fr: {
      'common.greeting': 'Bonjour',
      'common.farewell': 'Au revoir',
      'home.title': 'Bienvenue',
      'home.subtitle': 'Content de vous voir, {{name}} !',
      'users.count': '{{count}} utilisateurs en ligne',
    },
  };

  let currentLocale: Locale = overrides?.getLocale?.() ?? 'en';
  const localeChangeCallbacks: Array<(locale: Locale) => void> = [];

  return {
    name: overrides?.name ?? 'mock-adapter',
    getLocale: overrides?.getLocale ?? (() => currentLocale),
    getTranslations: overrides?.getTranslations ?? ((locale: Locale) => dictionaries[locale] ?? {}),
    onLocaleChange: overrides?.onLocaleChange ?? ((cb: (locale: Locale) => void) => {
      localeChangeCallbacks.push(cb);
      return () => {
        const idx = localeChangeCallbacks.indexOf(cb);
        if (idx > -1) localeChangeCallbacks.splice(idx, 1);
      };
    }),
    destroy: overrides?.destroy ?? (() => {}),
    ...overrides,
  };
}

export function changeMockLocale(adapter: I18nAdapter, newLocale: Locale) {
  if (adapter.onLocaleChange) {
    adapter.onLocaleChange(newLocale);
  }
}

export const mockTranslations: Record<Locale, TranslationDictionary> = {
  en: {
    'common.greeting': 'Hello',
    'common.farewell': 'Goodbye',
    'home.title': 'Welcome Home',
    'home.subtitle': 'Nice to see you, {{name}}!',
    'users.count': '{{count}} users online',
  },
  fr: {
    'common.greeting': 'Bonjour',
    'common.farewell': 'Au revoir',
    'home.title': 'Bienvenue',
    'home.subtitle': 'Content de vous voir, {{name}} !',
    'users.count': '{{count}} utilisateurs en ligne',
  },
};