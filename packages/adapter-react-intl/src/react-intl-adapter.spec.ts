import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withReactIntl } from './react-intl-adapter';
import type { I18nAdapter, Locale } from '@localive/core';

function createMockReactIntl(overrides?: Record<string, unknown>) {
  const messages: Record<string, Record<string, string>> = {
    en: {
      'app.greeting': 'Hello',
      'app.farewell': 'Goodbye',
      'home.title': 'Welcome Home',
    },
    fr: {
      'app.greeting': 'Bonjour',
      'app.farewell': 'Au revoir',
      'home.title': 'Bienvenue',
    },
  };

  const listeners: Array<(locale: string) => void> = [];

  const intl = {
    locale: 'en',
    defaultLocale: 'en',
    messages,
    onLocaleChange: vi.fn((callback: (locale: string) => void) => {
      listeners.push(callback);
      return () => {
        const idx = listeners.indexOf(callback);
        if (idx > -1) listeners.splice(idx, 1);
      };
    }),
    setLocale: vi.fn((locale: string) => {
      intl.locale = locale;
      for (const cb of listeners) cb(locale);
      return Promise.resolve();
    }),
    ...overrides,
  };

  return intl;
}

describe('withReactIntl', () => {
  let mockIntl: ReturnType<typeof createMockReactIntl>;
  let adapter: I18nAdapter;

  beforeEach(() => {
    mockIntl = createMockReactIntl();
    adapter = withReactIntl(mockIntl);
  });

  it('returns an adapter with name "react-intl"', () => {
    expect(adapter.name).toBe('react-intl');
  });

  it('returns current locale from intl.locale', () => {
    expect(adapter.getLocale()).toBe('en');
  });

  it('returns locale after language change', () => {
    mockIntl.setLocale('fr');
    expect(adapter.getLocale()).toBe('fr');
  });

  it('returns translations from intl.messages', () => {
    const dict = adapter.getTranslations('en');
    expect(dict['app.greeting']).toBe('Hello');
    expect(dict['home.title']).toBe('Welcome Home');
  });

  it('returns translations for a different locale', () => {
    const dict = adapter.getTranslations('fr');
    expect(dict['app.greeting']).toBe('Bonjour');
  });

  it('returns empty object for missing locale', () => {
    const dict = adapter.getTranslations('de');
    expect(dict).toEqual({});
  });

  it('notifies on locale change via onLocaleChange callback', () => {
    const callback = vi.fn();
    const unsubscribe = adapter.onLocaleChange(callback);

    mockIntl.setLocale('fr');

    expect(callback).toHaveBeenCalledWith('fr');

    unsubscribe();
  });

  it('stops listening after unsubscribe', () => {
    const callback = vi.fn();
    const unsubscribe = adapter.onLocaleChange(callback);

    unsubscribe();
    mockIntl.setLocale('fr');

    expect(callback).not.toHaveBeenCalled();
  });

  it('cleans up listener on destroy()', () => {
    const callback = vi.fn();
    adapter.onLocaleChange(callback);

    adapter.destroy!();

    mockIntl.setLocale('fr');
    expect(callback).not.toHaveBeenCalled();
  });

  it('falls back to defaultLocale when locale is empty', () => {
    const fallbackIntl = createMockReactIntl({ locale: '', defaultLocale: 'de' });
    const fallbackAdapter = withReactIntl(fallbackIntl);
    expect(fallbackAdapter.getLocale()).toBe('de');
  });

  it('falls back to "en" when both locale and defaultLocale are empty', () => {
    const emptyIntl = createMockReactIntl({ locale: '', defaultLocale: undefined });
    const emptyAdapter = withReactIntl(emptyIntl);
    expect(emptyAdapter.getLocale()).toBe('en');
  });

  it('works without onLocaleChange callback', () => {
    const noCallbackIntl = {
      locale: 'en',
      messages: { en: { 'app.greeting': 'Hello' } },
    };
    const noCallbackAdapter = withReactIntl(noCallbackIntl as any);
    expect(noCallbackAdapter.name).toBe('react-intl');
    expect(noCallbackAdapter.getLocale()).toBe('en');
  });

  it('does not return getKeyFromElement (no marker injection)', () => {
    expect(adapter.getKeyFromElement).toBeUndefined();
  });
});