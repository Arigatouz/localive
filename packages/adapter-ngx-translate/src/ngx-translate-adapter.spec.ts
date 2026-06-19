import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withNgxTranslate } from './ngx-translate-adapter';
import type { I18nAdapter, Locale, TranslationDictionary } from '@localive/core';

function createMockTranslateService() {
  const translations: Record<string, TranslationDictionary> = {
    en: {
      'common.greeting': 'Hello',
      'common.farewell': 'Goodbye',
      'home.title': 'Welcome Home',
      'home.subtitle': 'Nice to see you, {{name}}!',
    },
    fr: {
      'common.greeting': 'Bonjour',
      'common.farewell': 'Au revoir',
      'home.title': 'Bienvenue',
      'home.subtitle': 'Content de vous voir, {{name}} !',
    },
  };

  let currentLang: Locale = 'en';
  const langChangeListeners: Array<(event: { lang: string }) => void> = [];

  const service = {
    currentLang: 'en' as Locale,
    onLangChange: {
      subscribe: vi.fn((callback: (event: { lang: string }) => void) => {
        langChangeListeners.push(callback);
        return { unsubscribe: () => {
          const idx = langChangeListeners.indexOf(callback);
          if (idx > -1) langChangeListeners.splice(idx, 1);
        }};
      }),
    },
    getTranslation: vi.fn((lang: string) => translations[lang] ?? {}),
    set: vi.fn((key: string, value: string, lang?: string) => {
      const targetLang = lang ?? currentLang;
      if (!translations[targetLang]) translations[targetLang] = {};
      translations[targetLang][key] = value;
    }),
    use: vi.fn((lang: Locale) => {
      currentLang = lang;
      service.currentLang = lang;
      for (const cb of langChangeListeners) {
        cb({ lang });
      }
      return Promise.resolve(translations[lang] ?? {});
    }),
    instant: vi.fn((key: string) => translations[currentLang]?.[key] ?? key),
    getDefaultLang: vi.fn(() => 'en'),
  };

  return service;
}

describe('withNgxTranslate', () => {
  let mockService: ReturnType<typeof createMockTranslateService>;
  let adapter: I18nAdapter;

  beforeEach(() => {
    mockService = createMockTranslateService();
    const TranslatePipe = class MockTranslatePipe {};
    adapter = withNgxTranslate(mockService as any, TranslatePipe);
  });

  it('returns an adapter with name "ngx-translate"', () => {
    expect(adapter.name).toBe('ngx-translate');
  });

  it('returns current locale from TranslateService.currentLang', () => {
    expect(adapter.getLocale()).toBe('en');
  });

  it('returns locale after language change', () => {
    mockService.use('fr');
    expect(adapter.getLocale()).toBe('fr');
    expect(mockService.currentLang).toBe('fr');
  });

  it('returns translations from TranslateService.getTranslation()', () => {
    const dict = adapter.getTranslations('en');
    expect(dict['common.greeting']).toBe('Hello');
    expect(dict['home.title']).toBe('Welcome Home');
  });

  it('returns translations for a different locale', () => {
    const dict = adapter.getTranslations('fr');
    expect(dict['common.greeting']).toBe('Bonjour');
  });

  it('handles missing locale gracefully', () => {
    const dict = adapter.getTranslations('de');
    expect(dict).toEqual({});
  });

  it('notifies on locale change via onLangChange', () => {
    const callback = vi.fn();
    const unsubscribe = adapter.onLocaleChange(callback);

    mockService.use('fr');

    expect(callback).toHaveBeenCalledWith('fr');

    unsubscribe();
  });

  it('stops listening after unsubscribe', () => {
    const callback = vi.fn();
    const unsubscribe = adapter.onLocaleChange(callback);

    unsubscribe();
    mockService.use('fr');

    expect(callback).not.toHaveBeenCalled();
  });

  it('cleans up listener on destroy()', () => {
    const callback = vi.fn();
    adapter.onLocaleChange(callback);

    adapter.destroy!();

    mockService.use('fr');
    expect(callback).not.toHaveBeenCalled();
  });

  it('stores the pipe class for marker injection', () => {
    expect(adapter.getKeyFromElement).toBeDefined();
  });

  it('works with multi-module setups (lazy loaded)', () => {
    const lazyService = createMockTranslateService();
    const lazyTranslations: Record<string, TranslationDictionary> = {
      en: { 'lazy.feature': 'Lazy Feature', 'common.greeting': 'Hello' },
      fr: { 'lazy.feature': 'Fonctionnalité différée', 'common.greeting': 'Bonjour' },
    };
    lazyService.getTranslation.mockImplementation((lang: string) => lazyTranslations[lang] ?? {});
    const lazyAdapter = withNgxTranslate(lazyService as any, class {});

    const dict = lazyAdapter.getTranslations('en');
    expect(dict['lazy.feature']).toBe('Lazy Feature');
    expect(dict['common.greeting']).toBe('Hello');
  });
});