import type { I18nAdapter, Locale, TranslationDictionary } from '@localive/core';

export interface TranslateServiceLike {
  currentLang: string;
  onLangChange: { subscribe(callback: (event: { lang: string }) => void): { unsubscribe(): void } };
  getTranslation(lang: string): TranslationDictionary;
  set(key: string, value: string, lang?: string): void;
  use(lang: string): Promise<TranslationDictionary>;
  instant(key: string, params?: Record<string, unknown>): string;
  getDefaultLang(): string;
}

export function withNgxTranslate(
  service: TranslateServiceLike,
  _pipeClass: new (...args: unknown[]) => unknown
): I18nAdapter {
  const localeChangeCallbacks: Array<(locale: Locale) => void> = [];
  let subscription: { unsubscribe(): void } | null = null;

  subscription = service.onLangChange.subscribe((event: { lang: string }) => {
    for (const cb of localeChangeCallbacks) {
      cb(event.lang as Locale);
    }
  });

  return {
    name: 'ngx-translate',

    getLocale(): Locale {
      return (service.currentLang || service.getDefaultLang()) as Locale;
    },

    getTranslations(locale: Locale): TranslationDictionary {
      return service.getTranslation(locale) ?? {};
    },

    onLocaleChange(callback: (locale: Locale) => void): () => void {
      localeChangeCallbacks.push(callback);
      return () => {
        const idx = localeChangeCallbacks.indexOf(callback);
        if (idx > -1) localeChangeCallbacks.splice(idx, 1);
      };
    },

    getKeyFromElement(element: HTMLElement): string | null {
      const keyAttr = element.getAttribute('data-i18n-key');
      if (keyAttr) return keyAttr;
      return null;
    },

    destroy() {
      if (subscription) {
        subscription.unsubscribe();
        subscription = null;
      }
      localeChangeCallbacks.length = 0;
    },
  };
}