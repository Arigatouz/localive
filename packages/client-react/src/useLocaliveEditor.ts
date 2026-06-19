import { useCallback, useSyncExternalStore } from 'react';
import { useLocaliveContext } from './LocaliveProvider';
import type { Locale } from '@localive/core';

export interface UseLocaliveEditorResult {
  /** Whether the inspector overlay is currently active */
  isActive: boolean;
  /** Activate the inspector overlay */
  activate: () => void;
  /** Deactivate the inspector overlay */
  deactivate: () => void;
  /** Toggle the inspector overlay */
  toggle: () => void;
  /** Get a translation value by key and locale */
  getTranslation: (key: string, locale: Locale) => string | undefined;
}

export function useLocaliveEditor(): UseLocaliveEditorResult {
  const instance = useLocaliveContext();

  const isActive = useSyncExternalStore(
    (callback) => instance.store.subscribe(callback),
    () => instance.store.active,
    () => false,
  );

  const activate = useCallback(() => {
    instance.activate();
  }, [instance]);

  const deactivate = useCallback(() => {
    instance.deactivate();
  }, [instance]);

  const toggle = useCallback(() => {
    if (instance.isActive()) {
      instance.deactivate();
    } else {
      instance.activate();
    }
  }, [instance]);

  const getTranslation = useCallback(
    (key: string, locale: Locale) => {
      return instance.getTranslation(key, locale);
    },
    [instance],
  );

  return {
    isActive,
    activate,
    deactivate,
    toggle,
    getTranslation,
  };
}