import type { LocaleValidationResult, ValidateOptions, ValidateResult } from './contracts';
import { readLocaleFile, resolveCwd, resolveLocaleFiles } from './fs-utils';
import { extractKeys } from './extract';

export function validateKeys(options: ValidateOptions = {}): ValidateResult {
  const cwd = resolveCwd(options.cwd);
  const extractResult = extractKeys({ cwd, sourceRoots: options.sourceRoots });
  const localeInfos = resolveLocaleFiles(cwd, options.localeFiles);

  const localeResults = localeInfos.map((localeInfo): LocaleValidationResult => {
    const localeFile = readLocaleFile(localeInfo.filePath, localeInfo.locale);
    const localeKeys = new Set(Object.keys(localeFile.translations));

    const missingKeys = extractResult.keys.filter((key) => !localeKeys.has(key));
    const unusedKeys = [...localeKeys].filter((key) => !extractResult.keys.includes(key)).sort();

    return {
      locale: localeInfo.locale,
      filePath: localeInfo.filePath,
      missingKeys,
      unusedKeys,
    };
  });

  return {
    ...extractResult,
    localeResults,
    ok: localeResults.every((result) => result.missingKeys.length === 0 && result.unusedKeys.length === 0),
  };
}
