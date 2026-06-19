import { hasContext, getContext, setContext } from 'svelte';
import type { I18nLiveInstance, Locale } from '@localive/core';

const LOCALIVE_KEY = Symbol('localive');

export function setLocaliveContext(instance: I18nLiveInstance): I18nLiveInstance {
  setContext(LOCALIVE_KEY, instance);
  return instance;
}

export function getLocaliveContext(): I18nLiveInstance {
  if (!hasContext(LOCALIVE_KEY)) {
    throw new Error('Localive context not found. Did you wrap your app with initLocalive()?');
  }
  return getContext<I18nLiveInstance>(LOCALIVE_KEY);
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