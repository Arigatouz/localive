import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideLocalive } from '@localive/angular';
import type { I18nAdapter, Locale, TranslationDictionary } from '@localive/core';

import en from '../locales/en.json';
import fr from '../locales/fr.json';

const translations: Record<string, TranslationDictionary> = {
  en: (en as Record<string, Record<string, string>>)['en'] as TranslationDictionary,
  fr: (fr as Record<string, Record<string, string>>)['fr'] as TranslationDictionary,
};

let currentLocale: Locale = 'en';
const localeCallbacks: Array<(locale: Locale) => void> = [];

const simpleAdapter: I18nAdapter = {
  name: 'simple',
  getLocale: () => currentLocale,
  getTranslations: (locale: Locale) => translations[locale] ?? {},
  onLocaleChange: (callback: (locale: Locale) => void) => {
    localeCallbacks.push(callback);
    return () => {
      const idx = localeCallbacks.indexOf(callback);
      if (idx > -1) localeCallbacks.splice(idx, 1);
    };
  },
  destroy: () => {
    localeCallbacks.length = 0;
  },
};

export function switchLocale(locale: string) {
  currentLocale = locale as Locale;
  localeCallbacks.forEach((cb) => cb(currentLocale));
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideLocalive(() => simpleAdapter, {
      locales: ['en', 'fr'],
      defaultLocale: 'en',
    }),
  ],
};
