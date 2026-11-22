import type { Locale, TranslationDictionary } from '@localive/core';

export interface MessageField {
  id: string;
  locale: Locale;
  /** Branch of a plural or select message, such as `plural=one`. */
  variant?: string;
  /** Stored text, or null when this locale has no translation yet. */
  original: string | null;
}

/**
 * One field per locale, or per locale and variant when any locale stores variants,
 * so a locale missing a branch still gets a field to add it. `firstLocale` comes first.
 */
export function buildMessageFields(
  key: string,
  locales: Locale[],
  firstLocale: Locale,
  translationsOf: (locale: Locale) => TranslationDictionary,
): MessageField[] {
  const orderedLocales = [firstLocale, ...locales.filter((locale) => locale !== firstLocale)];
  const values = new Map(orderedLocales.map((locale) => [locale, translationsOf(locale)[key]]));
  const variants = [...new Set([...values.values()].flatMap((value) => (typeof value === 'object' ? Object.keys(value) : [])))];

  return orderedLocales.flatMap((locale) => {
    const value = values.get(locale);
    if (variants.length === 0) {
      return [{ id: locale, locale, original: typeof value === 'string' ? value : null }];
    }
    return variants.map((variant) => ({
      id: `${locale}\0${variant}`,
      locale,
      variant,
      original: typeof value === 'object' && Object.hasOwn(value, variant) ? value[variant] : null,
    }));
  });
}
