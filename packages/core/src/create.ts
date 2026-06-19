import { I18nLiveStore } from './store';
import type {
  I18nLiveConfig,
  I18nLiveInstance,
  I18nAdapter,
  I18nPlugin,
  Locale,
  TranslationEntry,
  SaveResult,
  TranslationDictionary,
} from './types';

export function createLocalive(config: I18nLiveConfig): I18nLiveInstance {
  validateConfig(config);

  const adapter: I18nAdapter = config.adapter;
  const plugins: I18nPlugin[] = config.plugins ? [...config.plugins] : [];

  const initialLocale = adapter.getLocale();
  const initialTranslations = adapter.getTranslations(initialLocale);

  const dictionaries = new Map<Locale, TranslationDictionary>([
    [initialLocale, initialTranslations],
  ]);

  if (config.locales) {
    for (const locale of config.locales) {
      if (locale !== initialLocale) {
        const dict = adapter.getTranslations(locale);
        if (dict && Object.keys(dict).length > 0) {
          dictionaries.set(locale, dict);
        }
      }
    }
  }

  const store = new I18nLiveStore({
    locale: initialLocale,
    dictionaries,
    active: config.activeByDefault ?? false,
  });

  let destroyed = false;

  adapter.onLocaleChange((newLocale: Locale) => {
    if (destroyed) return;
    const dict = adapter.getTranslations(newLocale);
    if (dict) {
      store.dictionaries.set(newLocale, dict);
    }
    store.locale = newLocale;
  });

  function validateConfig(cfg: I18nLiveConfig): void {
    // translationsPath is optional on the browser side (only needed by dev server plugin)
    if (!cfg.locales || cfg.locales.length === 0) {
      throw new Error('localive: locales must contain at least one locale');
    }
    if (cfg.defaultLocale && !cfg.locales.includes(cfg.defaultLocale)) {
      throw new Error(
        `localive: defaultLocale "${cfg.defaultLocale}" must be one of the specified locales`
      );
    }
  }

  const instance: I18nLiveInstance = {
    store,

    activate(): void {
      if (destroyed) return;
      store.active = true;
    },

    deactivate(): void {
      if (destroyed) return;
      store.active = false;
    },

    isActive(): boolean {
      return store.active;
    },

    resolveKey(element: HTMLElement): string | null {
      const keyAttr = element.getAttribute('data-i18n-key');
      if (keyAttr) return keyAttr;
      if (adapter.getKeyFromElement) {
        return adapter.getKeyFromElement(element);
      }
      return reverseLookup(element, store);
    },

    getTranslation(key: string, locale: Locale): string | undefined {
      return store.getTranslation(key, locale);
    },

    getTranslations(locale: Locale): TranslationDictionary {
      return store.dictionaries.get(locale) ?? {};
    },

    async saveTranslation(entry: TranslationEntry): Promise<SaveResult> {
      if (destroyed) {
        return { success: false, error: 'localive: instance destroyed' };
      }

      let processedEntry = entry;
      for (const plugin of plugins) {
        if (plugin.beforeSave) {
          const result = plugin.beforeSave(processedEntry);
          if (result === false) {
            return { success: false, error: `localive: blocked by plugin "${plugin.name}"` };
          }
          if (result !== undefined) {
            processedEntry = result;
          }
        }
      }

      try {
        const response = await fetch('/__localive-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: processedEntry.key,
            value: processedEntry.value,
            locale: processedEntry.locale,
            namespace: processedEntry.namespace,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          return { success: false, error: errorText };
        }

        const result = await response.json();
        const saveResult: SaveResult = { success: true, filePath: result.filePath };

        for (const plugin of plugins) {
          if (plugin.afterSave) {
            plugin.afterSave(processedEntry, saveResult);
          }
        }

        const dict = store.dictionaries.get(processedEntry.locale);
        if (dict) {
          dict[processedEntry.key] = processedEntry.value;
        }

        return saveResult;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },

    use(plugin: I18nPlugin): I18nLiveInstance {
      plugins.push(plugin);
      return instance;
    },

    destroy(): void {
      destroyed = true;
      store.active = false;
      if (adapter.destroy) {
        adapter.destroy();
      }
    },
  };

  return instance;
}

function reverseLookup(
  element: HTMLElement,
  store: I18nLiveStore
): string | null {
  const text = element.textContent?.trim();
  if (!text) return null;

  const dict = store.dictionaries.get(store.locale);
  if (!dict) return null;

  for (const [key, value] of Object.entries(dict)) {
    if (typeof value === 'string') {
      const pattern = value.replace(/\{\{[^}]+\}\}/g, '(.+?)');
      if (pattern === text) return key;
      const regex: RegExp = new RegExp(`^${pattern}$`);
      if (regex.test(text)) return key;
      if (value === text) return key;
    }
  }

  return null;
}