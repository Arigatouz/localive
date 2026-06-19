import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLocalive } from '@localive/core';
import type { I18nAdapter, Locale, TranslationDictionary } from '@localive/core';
import { LocaliveInspectorService } from './localive-inspector.service';

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

describe('LocaliveInspectorService', () => {
  let service: LocaliveInspectorService;

  beforeEach(() => {
    document.body.innerHTML = '';
    const adapter = createTestAdapter();
    service = new LocaliveInspectorService(
      createLocalive({
        translationsPath: '',
        adapter,
        locales: ['en', 'fr'],
        defaultLocale: 'en',
      })
    );
  });

  afterEach(() => {
    service.ngOnDestroy();
    document.body.innerHTML = '';
  });

  it('auto-tags elements with data-i18n-key after activation', () => {
    service.activate();

    const el = document.createElement('span');
    el.textContent = 'Hello';
    el.setAttribute('data-i18n-key', 'common.greeting');
    document.body.appendChild(el);

    const key = service.resolveKey(el);
    expect(key).toBe('common.greeting');
  });

  it('resolves keys via data-i18n-key attribute', () => {
    service.activate();

    const el = document.createElement('span');
    el.setAttribute('data-i18n-key', 'home.title');
    el.textContent = 'Welcome Home';

    expect(service.resolveKey(el)).toBe('home.title');
  });

  it('resolves keys via reverse-lookup when no attribute', () => {
    service.activate();

    const el = document.createElement('span');
    el.textContent = 'Hello';

    expect(service.resolveKey(el)).toBe('common.greeting');
  });

  it('returns null for elements with no translation match', () => {
    service.activate();

    const el = document.createElement('span');
    el.textContent = 'This text does not exist in translations';

    expect(service.resolveKey(el)).toBeNull();
  });

  it('returns null for empty elements', () => {
    service.activate();

    const el = document.createElement('span');

    expect(service.resolveKey(el)).toBeNull();
  });

  it('starts inactive by default', () => {
    expect(service.isActive()).toBe(false);
  });

  it('activates with activate()', () => {
    service.activate();
    expect(service.isActive()).toBe(true);
  });

  it('deactivates with deactivate()', () => {
    service.activate();
    service.deactivate();
    expect(service.isActive()).toBe(false);
  });

  it('cleans up on destroy', () => {
    service.activate();
    service.ngOnDestroy();
    expect(service.isActive()).toBe(false);
  });

  it('getTranslation returns value for existing key', () => {
    expect(service.getTranslation('common.greeting', 'en')).toBe('Hello');
    expect(service.getTranslation('common.greeting', 'fr')).toBe('Bonjour');
  });

  it('getTranslation returns undefined for missing key', () => {
    expect(service.getTranslation('nonexistent.key', 'en')).toBeUndefined();
  });

  it('getTranslations returns dictionary for locale', () => {
    const dict = service.getTranslations('en');
    expect(dict['common.greeting']).toBe('Hello');
  });
});