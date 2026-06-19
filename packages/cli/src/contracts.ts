export interface ExtractOptions {
  cwd?: string;
  sourceRoots?: string[];
}

export interface ExtractResult {
  cwd: string;
  files: string[];
  keys: string[];
}

export interface LocaleFileInfo {
  filePath: string;
  locale: string;
}

export interface LocaleFileData extends LocaleFileInfo {
  shape: 'flat' | 'wrapped';
  raw: Record<string, unknown>;
  translations: Record<string, string>;
}

export interface ValidateOptions extends ExtractOptions {
  localeFiles?: string[];
}

export interface LocaleValidationResult {
  locale: string;
  filePath: string;
  missingKeys: string[];
  unusedKeys: string[];
}

export interface ValidateResult extends ExtractResult {
  localeResults: LocaleValidationResult[];
  ok: boolean;
}

export interface SyncOptions extends ValidateOptions {
  sourceLocale?: string;
  missingValue?: 'empty' | 'source';
}

export interface LocaleSyncResult {
  locale: string;
  filePath: string;
  addedKeys: string[];
}

export interface SyncResult extends ValidateResult {
  syncResults: LocaleSyncResult[];
}

export interface TypesOptions {
  cwd?: string;
  localeFiles?: string[];
  outFile?: string;
}

export interface TypesResult {
  cwd: string;
  outFile: string;
  keys: string[];
}

export interface RunCliOptions {
  cwd?: string;
  stdout?: Pick<Console, 'log' | 'error'>;
}
