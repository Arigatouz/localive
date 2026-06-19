import { createLocalive as createCoreInstance } from '@localive/core';
import type { I18nLiveInstance, I18nAdapter, Locale, TranslationDictionary } from '@localive/core';
import { setContext, getContext, hasContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';

const LOCALIVE_KEY = Symbol('localive');

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
  setContext(LOCALIVE_KEY, state);
  return state;
}

export function getLocaliveState(): SvelteLocaliveState {
  if (!hasContext(LOCALIVE_KEY)) {
    throw new Error('Localive state not found. Did you call initLocalive()?');
  }
  return getContext<SvelteLocaliveState>(LOCALIVE_KEY);
}

export { createCoreInstance, type I18nLiveInstance, type I18nAdapter, type Locale, type TranslationDictionary };