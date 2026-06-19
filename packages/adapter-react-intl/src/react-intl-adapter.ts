import type { I18nAdapter, Locale, TranslationDictionary } from '@localive/core';

export interface ReactIntlInstance {
  locale: string;
  defaultLocale?: string;
  messages: Record<string, Record<string, string>>;
  formats?: Record<string, unknown>;
  onLocaleChange?: (callback: (locale: string) => void) => () => void;
  setLocale?: (locale: string) => Promise<void>;
}

export function withReactIntl(intl: ReactIntlInstance): I18nAdapter {
  const localeChangeCallbacks: Array<(locale: Locale) => void> = [];
  const destroyed = { value: false };

  let unsubscribe: (() => void) | undefined;

  if (intl.onLocaleChange) {
    unsubscribe = intl.onLocaleChange((locale: string) => {
      if (destroyed.value) return;
      for (const cb of localeChangeCallbacks) {
        cb(locale as Locale);
      }
    });
  }

  return {
    name: 'react-intl',

    getLocale(): Locale {
      return (intl.locale || intl.defaultLocale || 'en') as Locale;
    },

    getTranslations(locale: Locale): TranslationDictionary {
      return intl.messages[locale] ?? {};
    },

    onLocaleChange(callback: (locale: Locale) => void): () => void {
      localeChangeCallbacks.push(callback);
      return () => {
        const idx = localeChangeCallbacks.indexOf(callback);
        if (idx > -1) localeChangeCallbacks.splice(idx, 1);
      };
    },

    destroy() {
      destroyed.value = true;
      if (unsubscribe) unsubscribe();
      localeChangeCallbacks.length = 0;
    },
  };
}