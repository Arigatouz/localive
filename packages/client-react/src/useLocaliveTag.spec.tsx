import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLocaliveTag } from './useLocaliveTag';
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

describe('useLocaliveTag', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns getTagProps and resolveKey functions', () => {
    const { result } = renderHook(() => useLocaliveTag(), { wrapper: createWrapper });

    expect(typeof result.current.getTagProps).toBe('function');
    expect(typeof result.current.resolveKey).toBe('function');
  });

  it('getTagProps returns data-i18n-key attribute for a given key', () => {
    const { result } = renderHook(() => useLocaliveTag(), { wrapper: createWrapper });

    const props = result.current.getTagProps('common.greeting');
    expect(props).toEqual({ 'data-i18n-key': 'common.greeting' });
  });

  it('getTagProps returns different keys correctly', () => {
    const { result } = renderHook(() => useLocaliveTag(), { wrapper: createWrapper });

    expect(result.current.getTagProps('common.greeting')).toEqual({ 'data-i18n-key': 'common.greeting' });
    expect(result.current.getTagProps('home.title')).toEqual({ 'data-i18n-key': 'home.title' });
  });

  it('resolveKey returns the key from an element with data-i18n-key attribute', () => {
    const { result } = renderHook(() => useLocaliveTag(), { wrapper: createWrapper });

    const el = document.createElement('span');
    el.setAttribute('data-i18n-key', 'common.greeting');
    el.textContent = 'Hello';

    expect(result.current.resolveKey(el)).toBe('common.greeting');
  });

  it('resolveKey returns null for elements without data-i18n-key and no text match', () => {
    const { result } = renderHook(() => useLocaliveTag(), { wrapper: createWrapper });

    const el = document.createElement('span');
    el.textContent = 'nonexistent text';

    expect(result.current.resolveKey(el)).toBeNull();
  });

  it('resolveKey returns null for elements with empty text content', () => {
    const { result } = renderHook(() => useLocaliveTag(), { wrapper: createWrapper });

    const el = document.createElement('span');

    expect(result.current.resolveKey(el)).toBeNull();
  });

  it('resolveKey performs reverse lookup when no data-i18n-key attribute', () => {
    const { result } = renderHook(() => useLocaliveTag(), { wrapper: createWrapper });

    const el = document.createElement('span');
    el.textContent = 'Hello';

    expect(result.current.resolveKey(el)).toBe('common.greeting');
  });

  it('throws when used outside of LocaliveProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useLocaliveTag());
    }).toThrow();

    consoleError.mockRestore();
  });
});