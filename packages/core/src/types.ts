/**
 * @localive/core — Public API Types
 *
 * Framework-agnostic types for the Localive live i18n editing system.
 * Zero framework dependencies. Tree-shakable. ESM-first.
 */

// ─── Translation Data ────────────────────────────────────

export type Locale = string;

export interface TranslationEntry {
  key: string;
  value: string;
  locale: Locale;
  namespace?: string;
  filePath?: string;
}

export interface TranslationFile {
  locale: Locale;
  path: string;
  content: Record<string, unknown>;
}

export type TranslationDictionary = Record<string, string | TranslationValue>;

export type TranslationValue = string | Record<string, string>;

// ─── Config ──────────────────────────────────────────────

export interface I18nLiveConfig {
  /** Root directory for translation files */
  translationsPath: string;
  /** Additional directories to scan for feature-split translation files */
  searchRoots?: string[];
  /** Supported locale codes, e.g. ['en', 'fr', 'de'] */
  locales: Locale[];
  /** Default / source locale */
  defaultLocale: Locale;
  /** Adapter connecting Localive to the app's i18n library */
  adapter: I18nAdapter;
  /** Optional plugins for AI suggestions, TM, etc. */
  plugins?: I18nPlugin[];
  /** WebSocket port for multi-tab sync (dev server only) */
  wsPort?: number;
  /** Whether the inspector starts in active state (default: true in dev) */
  activeByDefault?: boolean;
  /** API endpoint path for the dev server (default: /__localive-update) */
  endpoint?: string;
}

// ─── Adapter Interface ──────────────────────────────────

export interface I18nAdapter {
  /** Unique name for this adapter */
  name: string;
  /** Returns the currently active locale */
  getLocale(): Locale;
  /** Returns the full translation dictionary for the given locale */
  getTranslations(locale: Locale): TranslationDictionary;
  /** Subscribe to locale changes. Returns an unsubscribe function */
  onLocaleChange(callback: (locale: Locale) => void): () => void;
  /**
   * Optional: try to recover the i18n key from a DOM element.
   * Used by auto-tagging to inject invisible markers.
   */
  getKeyFromElement?(element: HTMLElement): string | null;
  /**
   * Optional: push a translation value back into the i18n library.
   * Called after a successful save so the UI reflects the edit without reload.
   */
  setTranslation?(key: string, value: string, locale: Locale): void;
  /** Clean up any listeners or observers */
  destroy?(): void;
}

// ─── Plugin Interface ─────────────────────────────────────

export interface I18nPlugin {
  /** Unique name for this plugin */
  name: string;
  /** Called before a translation is saved. Return false to prevent save, or a modified entry. */
  beforeSave?(entry: TranslationEntry): TranslationEntry | false;
  /** Called after a translation is successfully saved */
  afterSave?(entry: TranslationEntry, result: SaveResult): void;
  /** Called when a missing translation key is encountered */
  onMissingKey?(key: string, locale: Locale): void;
  /**
   * Called when a translation suggestion is requested (e.g. AI).
   * Return the translated string, or null if no suggestion available.
   */
  suggestTranslation?(
    key: string,
    sourceText: string,
    sourceLocale: Locale,
    targetLocale: Locale
  ): Promise<string | null>;
}

// ─── Save Result ─────────────────────────────────────────

export interface SaveResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

// ─── Instance ────────────────────────────────────────────

export interface I18nLiveInstance {
  /** The reactive store holding all translation state */
  store: I18nLiveStore;
  /** Activate the inspector overlay */
  activate(): void;
  /** Deactivate the inspector overlay */
  deactivate(): void;
  /** Check if the inspector is active */
  isActive(): boolean;
  /** Resolve an i18n key from a DOM element */
  resolveKey(element: HTMLElement): string | null;
  /** Get a single translation value */
  getTranslation(key: string, locale: Locale): string | undefined;
  /** Get the full translation dictionary for a locale */
  getTranslations(locale: Locale): TranslationDictionary;
  /** Save a translation entry (sends to dev server) */
  saveTranslation(entry: TranslationEntry): Promise<SaveResult>;
  /** Register a plugin */
  use(plugin: I18nPlugin): I18nLiveInstance;
  /** Clean up all listeners, observers, and DOM elements */
  destroy(): void;
}

// ─── Store ───────────────────────────────────────────────

export interface I18nLiveStore {
  /** The currently active locale */
  locale: Locale;
  /** All translation dictionaries, keyed by locale */
  dictionaries: Map<Locale, TranslationDictionary>;
  /** Whether the inspector is currently active */
  active: boolean;
  /** Subscribe to store changes */
  subscribe(callback: (state: I18nLiveStoreState) => void): () => void;
}

export interface I18nLiveStoreState {
  locale: Locale;
  active: boolean;
  dictionaries: Map<Locale, TranslationDictionary>;
}

// ─── Auto-Tagger ─────────────────────────────────────────

export interface AutoTaggerOptions {
  /** Attribute name used to store the key on elements */
  keyAttribute?: string;
  /** CSS class applied to tagged elements */
  tagClass?: string;
  /** Whether to observe DOM mutations */
  observeMutations?: boolean;
}

// ─── Overlay ─────────────────────────────────────────────

export interface OverlayOptions {
  /** CSS class for the overlay container */
  containerClass?: string;
  /** CSS class for highlighted elements */
  highlightClass?: string;
  /** CSS class for the editor panel */
  editorClass?: string;
  /** Delay before highlighting on hover (ms) */
  hoverDelay?: number;
  /** Whether to show the AI suggestion button */
  showAiSuggestion?: boolean;
}

// ─── Dev Server Config ──────────────────────────────────

export interface DevServerConfig {
  /** Root directory for translation files */
  translationsPath: string;
  /** Additional directories to scan for feature-split translation files */
  searchRoots?: string[];
  /** Supported locales */
  locales: Locale[];
  /** Default locale */
  defaultLocale?: Locale;
  /** API endpoint path (default: /__localive-update) */
  endpoint?: string;
  /** Whether to enable WebSocket for multi-tab sync */
  ws?: boolean;
  /** WebSocket port (default: auto-detect) */
  wsPort?: number;
}

// ─── Security ───────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ─── File Scanner ────────────────────────────────────────

export interface ScannedFile {
  locale: Locale;
  path: string;
  namespace?: string;
}

// ─── File Writer ─────────────────────────────────────────

export interface WriteOptions {
  /** Preserve existing indentation style */
  preserveFormatting?: boolean;
  /** Create nested key structure if it doesn't exist */
  createNested?: boolean;
  /** Create the file if it doesn't exist */
  createIfMissing?: boolean;
}