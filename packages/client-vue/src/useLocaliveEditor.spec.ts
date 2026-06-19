import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLocaliveEditor } from './useLocaliveEditor';
import { createLocalive } from '@localive/core';
import type { I18nAdapter, Locale, TranslationDictionary } from '@localive/core';

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

describe('useLocaliveEditor', () => {
  let instance: ReturnType<typeof createLocalive>;

  beforeEach(() => {
    instance = createLocalive({
      translationsPath: '',
      adapter: createTestAdapter(),
      locales: ['en', 'fr'],
      defaultLocale: 'en',
    });
  });

  it('returns reactive object with isActive, activate, deactivate', () => {
    const result = useLocaliveEditor(instance);

    expect(typeof result.isActive.value).toBe('boolean');
    expect(typeof result.activate).toBe('function');
    expect(typeof result.deactivate).toBe('function');
    expect(typeof result.toggle).toBe('function');
  });

  it('returns isActive as false by default', () => {
    const { isActive } = useLocaliveEditor(instance);
    expect(isActive.value).toBe(false);
  });

  it('activates inspector when calling activate()', () => {
    const { isActive, activate } = useLocaliveEditor(instance);

    activate();
    expect(isActive.value).toBe(true);
  });

  it('deactivates inspector when calling deactivate()', () => {
    const { isActive, activate, deactivate } = useLocaliveEditor(instance);

    activate();
    expect(isActive.value).toBe(true);

    deactivate();
    expect(isActive.value).toBe(false);
  });

  it('toggles inspector state', () => {
    const { isActive, toggle } = useLocaliveEditor(instance);

    toggle();
    expect(isActive.value).toBe(true);

    toggle();
    expect(isActive.value).toBe(false);
  });

  it('returns getTranslation function', () => {
    const { getTranslation } = useLocaliveEditor(instance);

    expect(getTranslation('common.greeting', 'en')).toBe('Hello');
    expect(getTranslation('common.greeting', 'fr')).toBe('Bonjour');
  });

  it('returns undefined for missing keys', () => {
    const { getTranslation } = useLocaliveEditor(instance);

    expect(getTranslation('nonexistent.key', 'en')).toBeUndefined();
  });
});