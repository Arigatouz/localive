export interface LocaliveDevServerOptions {
  translationsPath: string;
  searchRoots?: string[];
  locales: string[];
  defaultLocale?: string;
  endpoint?: string;
  ws?: boolean;
  wsPort?: number;
}

export interface LocaliveBuilderOptions extends Record<string, unknown> {
  buildTarget: string;
  localive?: LocaliveDevServerOptions;
}