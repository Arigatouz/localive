import type { I18nAdapter, Locale, TranslationDictionary } from '@localive/core';

export interface SvelteI18nInstance {
  locale: { subscribe: (cb: (v: string) => void) => () => void; set: (v: string) => void };
  _: { subscribe: (cb: (v: (key: string, options?: Record<string, unknown>) => string) => void) => () => void };
  load: (locale: string, dict: Record<string, Record<string, string>>) => Promise<void>;
  getLocale: () => string;
}

export interface WithSvelteI18nOptions {
  dictionaryGetter?: (locale: string) => TranslationDictionary;
}

export function withSvelteI18n(
  i18n: SvelteI18nInstance,
  options?: WithSvelteI18nOptions
): I18nAdapter {
  const localeChangeCallbacks: Array<(locale: Locale) => void> = [];
  const destroyed = { value: false };
  let currentLocale: Locale = 'en';

  const unsubscribe = i18n.locale.subscribe((locale: string) => {
    currentLocale = locale as Locale;
    if (!destroyed.value) {
      for (const cb of localeChangeCallbacks) {
        cb(locale as Locale);
      }
    }
  });

  return {
    name: 'svelte-i18n',

    getLocale(): Locale {
      return currentLocale;
    },

    getTranslations(locale: Locale): TranslationDictionary {
      if (options?.dictionaryGetter) {
        return options.dictionaryGetter(locale);
      }
      return {};
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
      unsubscribe();
      localeChangeCallbacks.length = 0;
    },
  };
}
