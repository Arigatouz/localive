import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLocalivePlugin } from './LocalivePlugin';
import type { I18nAdapter, I18nPlugin, Locale, TranslationDictionary, TranslationEntry } from '@localive/core';
import type { App, ComponentPublicInstance } from 'vue';

function createTestAdapter(): I18nAdapter {
  const translations: Record<Locale, TranslationDictionary> = {
    en: { 'common.greeting': 'Hello' },
    fr: { 'common.greeting': 'Bonjour' },
  };

  let currentLocale: Locale = 'en';
  const callbacks: Array<(locale: Locale) => void> = [];

  return {
    name: 'test-adapter',
    getLocale: () => currentLocale,
    getTranslations: (locale: Locale) => translations[locale] ?? {},
    onLocaleChange: (cb: (locale: Locale) => void) => {
      callbacks.push(cb);
      return () => {
        const idx = callbacks.indexOf(cb);
        if (idx > -1) callbacks.splice(idx, 1);
      };
    },
    destroy: () => {},
  };
}

function createMockApp(): App {
  return {
    provide: vi.fn(),
    config: {
      globalProperties: {} as Record<string, unknown>,
    },
  } as unknown as App;
}

describe('createLocalivePlugin', () => {
  it('creates a Vue plugin with install method', () => {
    const plugin = createLocalivePlugin({
      adapter: createTestAdapter(),
      locales: ['en', 'fr'],
      defaultLocale: 'en',
    });

    expect(plugin).toBeDefined();
    expect(typeof plugin.install).toBe('function');
  });

  it('provides global properties after install', () => {
    const plugin = createLocalivePlugin({
      adapter: createTestAdapter(),
      locales: ['en', 'fr'],
      defaultLocale: 'en',
    });

    const mockApp = createMockApp();

    plugin.install(mockApp);

    expect(mockApp.provide).toHaveBeenCalled();
  });

  it('passes activeByDefault option', () => {
    const plugin = createLocalivePlugin({
      adapter: createTestAdapter(),
      locales: ['en', 'fr'],
      defaultLocale: 'en',
      activeByDefault: true,
    });

    const mockApp = createMockApp();

    plugin.install(mockApp);

    expect(mockApp.provide).toHaveBeenCalled();
  });

  it('passes plugins option', () => {
    const mockPlugin: I18nPlugin = {
      name: 'test-plugin',
      beforeSave: vi.fn((entry: TranslationEntry) => entry),
    };

    const plugin = createLocalivePlugin({
      adapter: createTestAdapter(),
      locales: ['en', 'fr'],
      defaultLocale: 'en',
      plugins: [mockPlugin],
    });

    const mockApp = createMockApp();

    plugin.install(mockApp);
    expect(mockApp.provide).toHaveBeenCalled();
  });

  it('sets $localive on global properties after install', () => {
    const plugin = createLocalivePlugin({
      adapter: createTestAdapter(),
      locales: ['en', 'fr'],
      defaultLocale: 'en',
    });

    const mockApp = createMockApp();

    plugin.install(mockApp);

    expect(mockApp.config.globalProperties.$localive).toBeDefined();
  });
});
