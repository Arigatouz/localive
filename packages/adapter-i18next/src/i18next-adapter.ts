import type { I18nAdapter, Locale, TranslationDictionary } from '@localive/core';

export interface I18nextInstance {
  language: string;
  options?: { ns?: string | readonly string[]; defaultNS?: string | false | readonly string[] };
  isInitialized?: boolean;
  getResourceBundle(locale: string, namespace?: string): TranslationDictionary;
  on(event: string, callback: (...args: unknown[]) => void): I18nextInstance | void;
  off(event: string, callback: (...args: unknown[]) => void): I18nextInstance | void;
  changeLanguage(locale: string): Promise<unknown>;
  t(key: string, options?: Record<string, unknown>): string;
}

export interface WithI18nextOptions {
  namespace?: string;
}

export function withI18next(
  i18next: I18nextInstance,
  options?: WithI18nextOptions
): I18nAdapter {
  const defaultNamespace = i18next.options?.defaultNS;
  const resolvedDefaultNamespace = Array.isArray(defaultNamespace)
    ? defaultNamespace[0]
    : typeof defaultNamespace === 'string'
      ? defaultNamespace
      : undefined;
  const ns = options?.namespace
    ?? resolvedDefaultNamespace
    ?? 'translation';
  const langChangeCallbacks: Array<(locale: Locale) => void> = [];
  const destroyed = { value: false };

  const onLanguageChanged = (...args: unknown[]) => {
    const locale = (args[0] as string | undefined) ?? i18next.language;
    if (destroyed.value) return;
    for (const cb of langChangeCallbacks) {
      cb(locale as Locale);
    }
  };

  i18next.on('languageChanged', onLanguageChanged);

  return {
    name: 'i18next',

    getLocale(): Locale {
      return (i18next.language || 'en') as Locale;
    },

    getTranslations(locale: Locale): TranslationDictionary {
      const bundle = i18next.getResourceBundle(locale, ns);
      return bundle ?? {};
    },

    onLocaleChange(callback: (locale: Locale) => void): () => void {
      langChangeCallbacks.push(callback);
      return () => {
        const idx = langChangeCallbacks.indexOf(callback);
        if (idx > -1) langChangeCallbacks.splice(idx, 1);
      };
    },

    destroy() {
      destroyed.value = true;
      i18next.off('languageChanged', onLanguageChanged);
      langChangeCallbacks.length = 0;
    },
  };
}
