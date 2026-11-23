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
  /** Selector of the plural or select branch this value belongs to, such as `plural=one`. */
  variant?: string;
  /** Value the edit was based on, or null for a missing translation; the save fails if it has changed. */
  expected?: string | null;
}

export interface SaveResult {
  success: boolean;
  /** The stored value no longer matches the entry's `expected`; answered with HTTP 409. */
  conflict?: boolean;
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