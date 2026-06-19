import { mount } from 'svelte';
import { initLocalive } from '@localive/svelte';
import App from './App.svelte';
import en from './locales/en.json';
import fr from './locales/fr.json';

const translations = { en, fr };

const adapter = {
  name: 'svelte-playground',
  getLocale() { return currentLocale; },
  getTranslations(locale: string) { return translations[locale as keyof typeof translations] ?? {}; },
  onLocaleChange(callback: (locale: string) => void) {
    localeCallbacks.push(callback);
    return () => {
      const idx = localeCallbacks.indexOf(callback);
      if (idx > -1) localeCallbacks.splice(idx, 1);
    };
  },
  destroy() { localeCallbacks.length = 0; },
};

let currentLocale = 'en';
const localeCallbacks: Array<(locale: string) => void> = [];

export function switchLocale(locale: string) {
  currentLocale = locale;
  for (const cb of localeCallbacks) cb(locale);
}

const localiveState = initLocalive(adapter, {
  locales: ['en', 'fr'],
  defaultLocale: 'en',
  activeByDefault: true,
});

const app = mount(App, {
  target: document.getElementById('app')!,
  props: { localiveState },
});

export default app;
