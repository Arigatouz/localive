export interface LocaliveDevServerOptions {
  /** Path to the translations directory */
  translationsPath: string;

  /** Supported locale codes */
  locales: string[];

  /** Default locale */
  defaultLocale?: string;

  /** Base URL for the Localive API (defaults to /__localive__) */
  apiBase?: string;

  /** Auth token for the save endpoint */
  authToken?: string;

  /** Whether Localive is active by default */
  activeByDefault?: boolean;
}

export interface LocaliveBuilderOptions extends Record<string, unknown> {
  localive: LocaliveDevServerOptions;
}