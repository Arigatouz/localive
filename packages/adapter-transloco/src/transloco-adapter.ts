import type { I18nAdapter, Locale, TranslationDictionary } from '@localive/core';

export interface TranslocoServiceLike {
  getActiveLang(): string;
  setActiveLang(lang: string): void;
  getTranslation(lang: string): TranslationDictionary;
  translate(key: string, params?: Record<string, unknown>): string;
  langChanges$: { subscribe(callback: (lang: Locale) => void): { unsubscribe(): void } };
  config?: { availableLangs?: string[]; defaultLang?: string };
}

export function withTransloco(
  service: TranslocoServiceLike,
  _pipeClass: new (...args: unknown[]) => unknown,
  _directiveClass?: new (...args: unknown[]) => unknown
): I18nAdapter {
  const localeChangeCallbacks: Array<(locale: Locale) => void> = [];
  let subscription: { unsubscribe(): void } | null = null;

  subscription = service.langChanges$.subscribe((lang: Locale) => {
    for (const cb of localeChangeCallbacks) {
      cb(lang);
    }
  });

  return {
    name: 'transloco',

    getLocale(): Locale {
      return service.getActiveLang() as Locale;
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

      // Try to find key from Transloco pipe/directive markers
      // Transloco sets data-transloco-key on elements when using structural directive
      const translocoKey = element.getAttribute('data-transloco-key');
      if (translocoKey) return translocoKey;

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