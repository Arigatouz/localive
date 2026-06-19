import type { App, Plugin } from 'vue';
import { createLocalive } from '@localive/core';
import type { I18nAdapter, I18nPlugin, Locale, I18nLiveInstance } from '@localive/core';
import { localiveSymbol } from './symbols';

export interface LocalivePluginOptions {
  adapter: I18nAdapter;
  locales: Locale[];
  defaultLocale: Locale;
  plugins?: I18nPlugin[];
  activeByDefault?: boolean;
}

export function createLocalivePlugin(options: LocalivePluginOptions): Plugin {
  const instance = createLocalive({
    translationsPath: '',
    adapter: options.adapter,
    locales: options.locales,
    defaultLocale: options.defaultLocale,
    plugins: options.plugins,
    activeByDefault: options.activeByDefault ?? false,
  });

  return {
    install(app: App) {
      app.provide(localiveSymbol, instance);
      app.config.globalProperties.$localive = instance;
    },
  };
}

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $localive: I18nLiveInstance;
  }
}