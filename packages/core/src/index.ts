// @localive/core — Framework-agnostic live i18n editing engine
export { createLocalive } from './create';
export { I18nLiveStore } from './store';
export { KeyResolver } from './resolver';
export { validateLocale, validateKey, validatePath, sanitizeValue } from './security';
export { localeFromPath, sortedKeys } from './locale-utils';

export type {
  Locale,
  TranslationEntry,
  TranslationFile,
  TranslationDictionary,
  I18nLiveConfig,
  I18nAdapter,
  I18nPlugin,
  I18nLiveInstance,
  I18nLiveStore as I18nLiveStoreType,
  I18nLiveStoreState,
  SaveResult,
  AutoTaggerOptions,
  OverlayOptions,
  DevServerConfig,
  ValidationResult,
  ScannedFile,
  WriteOptions,
} from './types';