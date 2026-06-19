import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { createLocalive } from '@localive/core';
import type { I18nAdapter, I18nPlugin, Locale, I18nLiveInstance } from '@localive/core';

export interface LocaliveProviderProps {
  adapter: I18nAdapter;
  locales: Locale[];
  defaultLocale: Locale;
  plugins?: I18nPlugin[];
  activeByDefault?: boolean;
  children: ReactNode;
}

export const LocaliveContext = createContext<I18nLiveInstance | null>(null);

export function LocaliveProvider({
  adapter,
  locales,
  defaultLocale,
  plugins,
  activeByDefault = false,
  children,
}: LocaliveProviderProps) {
  const instanceRef = useRef<I18nLiveInstance | null>(null);

  if (!instanceRef.current) {
    instanceRef.current = createLocalive({
      translationsPath: '',
      adapter,
      locales,
      defaultLocale,
      plugins,
      activeByDefault,
    });
  }

  useEffect(() => {
    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, []);

  const instance = instanceRef.current;

  return (
    <LocaliveContext.Provider value={instance}>
      {children}
    </LocaliveContext.Provider>
  );
}

export function useLocaliveContext(): I18nLiveInstance {
  const ctx = useContext(LocaliveContext);
  if (!ctx) {
    throw new Error(
      'useLocaliveContext must be used within a <LocaliveProvider>. ' +
      'Make sure you wrap your app with <LocaliveProvider>.'
    );
  }
  return ctx;
}