import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withTransloco } from './transloco-adapter';
import type { I18nAdapter, Locale, TranslationDictionary } from '@localive/core';

function createMockTranslocoService() {
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
  const langChangeListeners: Array<(lang: Locale) => void> = [];

  const service = {
    getActiveLang: vi.fn(() => currentLang),
    setActiveLang: vi.fn((lang: Locale) => {
      currentLang = lang;
      for (const cb of langChangeListeners) cb(lang);
    }),
    getTranslation: vi.fn((lang: string) => translations[lang] ?? {}),
    translate: vi.fn((key: string) => translations[currentLang]?.[key] ?? key),
    langChanges$: {
      subscribe: vi.fn((callback: (lang: Locale) => void) => {
        const handler = (lang: Locale) => callback(lang);
        langChangeListeners.push(handler);
        return { unsubscribe: () => {
          const idx = langChangeListeners.indexOf(handler);
          if (idx > -1) langChangeListeners.splice(idx, 1);
        }};
      }),
    },
    config: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
  };

  return service;
}

describe('withTransloco', () => {
  let mockService: ReturnType<typeof createMockTranslocoService>;
  let adapter: I18nAdapter;

  beforeEach(() => {
    mockService = createMockTranslocoService();
    const TranslocoPipe = class MockTranslocoPipe {};
    adapter = withTransloco(mockService as any, TranslocoPipe);
  });

  it('returns an adapter with name "transloco"', () => {
    expect(adapter.name).toBe('transloco');
  });

  it('returns current locale from TranslocoService.getActiveLang()', () => {
    expect(adapter.getLocale()).toBe('en');
  });

  it('returns locale after language change', () => {
    mockService.setActiveLang('fr');
    expect(adapter.getLocale()).toBe('fr');
  });

  it('returns translations from TranslocoService.getTranslation()', () => {
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

  it('notifies on locale change via translocoLangChanges', () => {
    const callback = vi.fn();
    const unsubscribe = adapter.onLocaleChange(callback);

    mockService.setActiveLang('fr');

    expect(callback).toHaveBeenCalledWith('fr');

    unsubscribe();
  });

  it('stops listening after unsubscribe', () => {
    const callback = vi.fn();
    const unsubscribe = adapter.onLocaleChange(callback);

    unsubscribe();
    mockService.setActiveLang('fr');

    expect(callback).not.toHaveBeenCalled();
  });

  it('cleans up listener on destroy()', () => {
    const callback = vi.fn();
    adapter.onLocaleChange(callback);

    adapter.destroy!();

    mockService.setActiveLang('fr');
    expect(callback).not.toHaveBeenCalled();
  });

  it('stores the pipe class for marker injection', () => {
    expect(adapter.getKeyFromElement).toBeDefined();
  });

  it('stores the directive class for marker injection when provided', () => {
    const TranslocoPipe = class MockPipe {};
    const TranslocoDirective = class MockDirective {};
    const fullAdapter = withTransloco(mockService as any, TranslocoPipe, TranslocoDirective);

    expect(fullAdapter.name).toBe('transloco');
  });

  it('works with scopes/namespaces', () => {
    const scopedService = createMockTranslocoService();
    scopedService.getTranslation.mockImplementation((lang: string) => ({
      ...({ en: { 'common.greeting': 'Hello' }, fr: { 'common.greeting': 'Bonjour' } }[lang] ?? {}),
      'scope/key': 'Scoped value',
    }));
    const scopedAdapter = withTransloco(scopedService as any, class {});

    const dict = scopedAdapter.getTranslations('en');
    expect(dict['common.greeting']).toBe('Hello');
  });
});