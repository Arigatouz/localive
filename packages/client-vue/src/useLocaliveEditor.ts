import { ref, type Ref } from 'vue';
import type { I18nLiveInstance, Locale } from '@localive/core';

export interface UseLocaliveEditorResult {
  isActive: Ref<boolean>;
  activate: () => void;
  deactivate: () => void;
  toggle: () => void;
  getTranslation: (key: string, locale: Locale) => string | undefined;
}

export function useLocaliveEditor(instance: I18nLiveInstance): UseLocaliveEditorResult {
  const isActive = ref(instance.isActive());

  // Subscribe to state changes
  instance.store.subscribe((state) => {
    isActive.value = state.active;
  });

  const activate = () => {
    instance.activate();
    isActive.value = true;
  };

  const deactivate = () => {
    instance.deactivate();
    isActive.value = false;
  };

  const toggle = () => {
    if (instance.isActive()) {
      instance.deactivate();
      isActive.value = false;
    } else {
      instance.activate();
      isActive.value = true;
    }
  };

  const getTranslation = (key: string, locale: Locale) => {
    return instance.getTranslation(key, locale);
  };

  return {
    isActive,
    activate,
    deactivate,
    toggle,
    getTranslation,
  };
}