export interface DevServerConfig {
  translationsPath: string;
  searchRoots?: string[];
  locales: string[];
  defaultLocale?: string;
  endpoint?: string;
  ws?: boolean;
  wsPort?: number;
}

export interface TranslationEntry {
  key: string;
  value: string;
  locale: string;
  namespace?: string;
  filePath?: string;
}

export interface SaveResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export interface ScannedFile {
  locale: string;
  path: string;
  namespace?: string;
}

export interface ValidatedEntry {
  valid: true;
  entry: TranslationEntry;
}

export interface ValidationError {
  valid: false;
  error: string;
}

export type SanitizationResult = ValidatedEntry | ValidationError;