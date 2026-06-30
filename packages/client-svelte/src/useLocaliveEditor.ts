import { hasContext, getContext, setContext } from 'svelte';
import { writable } from 'svelte/store';
import type { I18nLiveInstance, Locale } from '@localive/core';
import type { SvelteLocaliveState } from './createLocalive';
import { localiveSymbol } from './symbols';

export function setLocaliveContext(instance: I18nLiveInstance): I18nLiveInstance {
  const isActive = writable(instance.isActive());
  const currentLocale = writable<Locale>(instance.store.locale);
  instance.store.subscribe((state) => {
    isActive.set(state.active);
    currentLocale.set(state.locale);
  });
  const state: SvelteLocaliveState = { instance, isActive, currentLocale };
  setContext(localiveSymbol, state);
  return instance;
}

export function getLocaliveContext(): I18nLiveInstance {
  if (!hasContext(localiveSymbol)) {
    throw new Error('Localive context not found. Did you wrap your app with initLocalive()?');
  }
  return getContext<SvelteLocaliveState>(localiveSymbol).instance;
}

export function useLocaliveEditor(instance: I18nLiveInstance) {
  let isActive = $state(instance.isActive());
  let currentLocale = $state<string>(instance.store.locale);

  instance.store.subscribe((state) => {
    isActive = state.active;
    currentLocale = state.locale;
  });

  return {
    get isActive() { return isActive; },
    get currentLocale() { return currentLocale as Locale; },
    activate: () => instance.activate(),
    deactivate: () => instance.deactivate(),
    toggle: () => {
      if (instance.isActive()) {
        instance.deactivate();
      } else {
        instance.activate();
      }
    },
    getTranslation: (key: string, locale: Locale) => instance.getTranslation(key, locale),
    getTranslations: (locale: Locale) => instance.getTranslations(locale),
    resolveKey: (element: HTMLElement) => instance.resolveKey(element),
    saveTranslation: (key: string, value: string, locale: Locale) =>
      instance.saveTranslation({ key, value, locale }),
  };
}