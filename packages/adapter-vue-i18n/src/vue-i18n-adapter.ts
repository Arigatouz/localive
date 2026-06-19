import type { I18nAdapter, Locale, TranslationDictionary } from '@localive/core';

export interface VueI18nInstance {
  locale: Locale | { value: Locale };
  fallbackLocale: unknown;
  messages: MessagesSource;
  availableLocales: Locale[];
  global?: {
    locale: { value: Locale };
    messages: MessagesSource;
    availableLocales: Locale[];
  };
  t(key: string, ...args: unknown[]): string;
}

type MessagesRecord = Record<Locale, TranslationDictionary>;
type MessagesSource = MessagesRecord | { value: MessagesRecord };

function unwrapMessages(
  messages: MessagesSource
): MessagesRecord {
  return hasMessageRef(messages) ? messages.value : messages;
}

function hasMessageRef(messages: MessagesSource): messages is { value: MessagesRecord } {
  return typeof messages === 'object' && messages !== null && 'value' in messages;
}

export function withVueI18n(
  vueI18n: VueI18nInstance,
  onLocaleChange?: (callback: (locale: Locale) => void) => () => void
): I18nAdapter {
  const localeChangeCallbacks: Array<(locale: Locale) => void> = [];
  let externalUnsubscribe: (() => void) | null = null;

  function getCurrentLocale(): Locale {
    if (typeof vueI18n.locale === 'object' && 'value' in vueI18n.locale) {
      return vueI18n.locale.value;
    }
    return vueI18n.locale as Locale;
  }

  function getMessages(): MessagesRecord {
    if (vueI18n.global?.messages) {
      return unwrapMessages(vueI18n.global.messages);
    }
    return unwrapMessages(vueI18n.messages);
  }

  if (onLocaleChange) {
    externalUnsubscribe = onLocaleChange((locale: Locale) => {
      for (const cb of localeChangeCallbacks) {
        cb(locale);
      }
    });
  }

  return {
    name: 'vue-i18n',

    getLocale(): Locale {
      return getCurrentLocale();
    },

    getTranslations(locale: Locale): TranslationDictionary {
      const messages = getMessages();
      const dict = messages[locale];
      return dict ?? {};
    },

    onLocaleChange(callback: (locale: Locale) => void): () => void {
      localeChangeCallbacks.push(callback);
      return () => {
        const idx = localeChangeCallbacks.indexOf(callback);
        if (idx > -1) localeChangeCallbacks.splice(idx, 1);
      };
    },

    destroy() {
      if (externalUnsubscribe) {
        externalUnsubscribe();
        externalUnsubscribe = null;
      }
      localeChangeCallbacks.length = 0;
    },
  };
}
