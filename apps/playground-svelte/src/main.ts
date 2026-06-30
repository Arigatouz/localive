import { mount } from 'svelte';
import App from './App.svelte';
import localeData from './locales/en.json';

export const translations = localeData as Record<string, Record<string, string>>;

export let currentLocale = 'en';
const localeCallbacks: Array<(locale: string) => void> = [];

export function switchLocale(locale: string) {
  currentLocale = locale;
  for (const cb of localeCallbacks) cb(locale);
}

export function getLocaleCallbacks() {
  return localeCallbacks;
}

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;