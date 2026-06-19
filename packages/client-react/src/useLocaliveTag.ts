import { useCallback } from 'react';
import { useLocaliveContext } from './LocaliveProvider';

export interface UseLocaliveTagResult {
  /** Get props to spread onto an element for auto-tagging */
  getTagProps: (key: string) => { 'data-i18n-key': string };
  /** Manually resolve a key from a DOM element */
  resolveKey: (element: HTMLElement) => string | null;
}

export function useLocaliveTag(): UseLocaliveTagResult {
  const instance = useLocaliveContext();

  const getTagProps = useCallback(
    (key: string) => ({
      'data-i18n-key': key,
    }),
    [],
  );

  const resolveKey = useCallback(
    (element: HTMLElement) => {
      return instance.resolveKey(element);
    },
    [instance],
  );

  return { getTagProps, resolveKey };
}