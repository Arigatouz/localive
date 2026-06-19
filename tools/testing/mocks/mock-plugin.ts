import type { I18nPlugin, TranslationEntry, Locale } from '@localive/core';

export function createMockPlugin(overrides?: Partial<I18nPlugin>): I18nPlugin {
  return {
    name: overrides?.name ?? 'mock-plugin',
    beforeSave: overrides?.beforeSave ?? ((entry: TranslationEntry) => entry),
    afterSave: overrides?.afterSave ?? (() => {}),
    onMissingKey: overrides?.onMissingKey ?? (() => {}),
    suggestTranslation: overrides?.suggestTranslation ?? (async () => null),
  };
}