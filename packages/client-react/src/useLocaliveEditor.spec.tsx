import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocaliveEditor } from './useLocaliveEditor';
import { LocaliveProvider } from './LocaliveProvider';
import type { I18nAdapter, Locale, TranslationDictionary } from '@localive/core';
import React from 'react';

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

function createWrapper({ children }: { children: React.ReactNode }) {
  return (
    <LocaliveProvider
      adapter={createTestAdapter()}
      locales={['en', 'fr']}
      defaultLocale="en"
    >
      {children}
    </LocaliveProvider>
  );
}

describe('useLocaliveEditor', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns isActive as false by default', () => {
    const { result } = renderHook(() => useLocaliveEditor(), { wrapper: createWrapper });
    expect(result.current.isActive).toBe(false);
  });

  it('returns activate and deactivate functions', () => {
    const { result } = renderHook(() => useLocaliveEditor(), { wrapper: createWrapper });
    expect(typeof result.current.activate).toBe('function');
    expect(typeof result.current.deactivate).toBe('function');
  });

  it('activates inspector when calling activate()', () => {
    const { result } = renderHook(() => useLocaliveEditor(), { wrapper: createWrapper });

    act(() => {
      result.current.activate();
    });

    expect(result.current.isActive).toBe(true);
  });

  it('deactivates inspector when calling deactivate()', () => {
    const { result } = renderHook(() => useLocaliveEditor(), { wrapper: createWrapper });

    act(() => {
      result.current.activate();
    });
    expect(result.current.isActive).toBe(true);

    act(() => {
      result.current.deactivate();
    });
    expect(result.current.isActive).toBe(false);
  });

  it('returns getTranslation function', () => {
    const { result } = renderHook(() => useLocaliveEditor(), { wrapper: createWrapper });

    expect(typeof result.current.getTranslation).toBe('function');
    expect(result.current.getTranslation('common.greeting', 'en')).toBe('Hello');
    expect(result.current.getTranslation('common.greeting', 'fr')).toBe('Bonjour');
  });

  it('returns undefined for missing keys', () => {
    const { result } = renderHook(() => useLocaliveEditor(), { wrapper: createWrapper });

    expect(result.current.getTranslation('nonexistent.key', 'en')).toBeUndefined();
  });

  it('throws when used outside of provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useLocaliveEditor());
    }).toThrow();

    consoleError.mockRestore();
  });
});