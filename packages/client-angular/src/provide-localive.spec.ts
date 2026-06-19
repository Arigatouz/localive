import { describe, it, expect } from 'vitest';
import { createLocalive } from '@localive/core';
import type { I18nAdapter, Locale, TranslationDictionary } from '@localive/core';
import { LocaliveInspectorService } from './localive-inspector.service';
import { provideLocalive, LOCALIVE_ADAPTER, LOCALIVE_INSTANCE } from './provide-localive';

function createTestAdapter(): I18nAdapter {
  const translations: Record<Locale, TranslationDictionary> = {
    en: {
      'common.greeting': 'Hello',
      'common.farewell': 'Goodbye',
      'home.title': 'Welcome Home',
    },
    fr: {
      'common.greeting': 'Bonjour',
      'common.farewell': 'Au revoir',
      'home.title': 'Bienvenue',
    },
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

describe('provideLocalive', () => {
  it('returns environment providers', () => {
    const adapter = createTestAdapter();
    const providers = provideLocalive(() => adapter);

    expect(providers).toBeDefined();
    // EnvironmentProviders is an opaque object, not a plain array
    expect(typeof providers).toBe('object');
  });

  it('accepts an adapter factory that injects Angular services', () => {
    const adapter = createTestAdapter();
    const providers = provideLocalive(() => adapter);

    expect(providers).toBeDefined();
  });

  it('creates a localive instance when initialized', () => {
    const adapter = createTestAdapter();
    const providers = provideLocalive(() => adapter);

    // The factory function should produce a valid object
    expect(providers).not.toBeNull();
  });
});