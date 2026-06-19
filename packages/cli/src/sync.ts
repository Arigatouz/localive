import type { LocaleFileData, LocaleSyncResult, SyncOptions, SyncResult } from './contracts';
import { readLocaleFile, resolveCwd, resolveLocaleFiles, writeLocaleFile } from './fs-utils';
import { validateKeys } from './validate';

export function syncLocaleFiles(options: SyncOptions = {}): SyncResult {
  const cwd = resolveCwd(options.cwd);
  const validationResult = validateKeys({ cwd, sourceRoots: options.sourceRoots, localeFiles: options.localeFiles });
  const sourceLocale = options.sourceLocale ?? validationResult.localeResults[0]?.locale ?? 'en';
  const missingValue = options.missingValue ?? 'empty';
  const localeInfos = resolveLocaleFiles(cwd, options.localeFiles);

  const localeFiles = new Map<string, LocaleFileData>();
  for (const localeInfo of localeInfos) {
    localeFiles.set(localeInfo.locale, readLocaleFile(localeInfo.filePath, localeInfo.locale));
  }

  const sourceTranslations = localeFiles.get(sourceLocale)?.translations ?? {};
  const syncResults: LocaleSyncResult[] = [];

  for (const localeResult of validationResult.localeResults) {
    const localeFile = localeFiles.get(localeResult.locale);
    if (!localeFile) {
      continue;
    }

    const nextTranslations = { ...localeFile.translations };
    for (const key of localeResult.missingKeys) {
      nextTranslations[key] = missingValue === 'source' && localeResult.locale !== sourceLocale
        ? sourceTranslations[key] ?? ''
        : '';
    }

    if (localeResult.missingKeys.length > 0) {
      writeLocaleFile(localeFile, nextTranslations);
    }

    syncResults.push({
      locale: localeResult.locale,
      filePath: localeResult.filePath,
      addedKeys: [...localeResult.missingKeys],
    });
  }

  return {
    ...validateKeys({ cwd, sourceRoots: options.sourceRoots, localeFiles: options.localeFiles }),
    syncResults,
  };
}
