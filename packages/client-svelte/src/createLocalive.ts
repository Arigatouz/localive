import { createLocalive as createCoreInstance } from '@localive/core';
import type { I18nLiveInstance, I18nAdapter, Locale, TranslationDictionary } from '@localive/core';
import { setContext, getContext, hasContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';
import { localiveSymbol } from './symbols';

export interface SvelteLocaliveState {
  instance: I18nLiveInstance;
  isActive: Writable<boolean>;
  currentLocale: Writable<Locale>;
}

export function initLocalive(
  adapter: I18nAdapter,
  options?: {
    locales?: Locale[];
    defaultLocale?: Locale;
    activeByDefault?: boolean;
  }
): SvelteLocaliveState {
  const locales = options?.locales ?? ['en'];
  const defaultLocale = options?.defaultLocale ?? 'en';
  const activeByDefault = options?.activeByDefault ?? false;

  const instance = createCoreInstance({
    translationsPath: '',
    adapter,
    locales,
    defaultLocale,
    activeByDefault,
  });

  const isActive = writable(instance.isActive());
  const currentLocale = writable<Locale>(instance.store.locale);

  instance.store.subscribe((state) => {
    isActive.set(state.active);
    currentLocale.set(state.locale);
  });

  const state: SvelteLocaliveState = { instance, isActive, currentLocale };
  setContext(localiveSymbol, state);
  return state;
}

export function getLocaliveState(): SvelteLocaliveState {
  if (!hasContext(localiveSymbol)) {
    throw new Error('Localive state not found. Did you call initLocalive()?');
  }
  return getContext<SvelteLocaliveState>(localiveSymbol);
}

export { createCoreInstance, type I18nLiveInstance, type I18nAdapter, type Locale, type TranslationDictionary };