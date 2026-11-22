import type { I18nAdapter, Locale, MessageReference, TranslationDictionary, TranslationEntry } from '@localive/core';
import {
  clearDrafts,
  EDIT_COOKIE,
  findMarkedMessages,
  hasEditCookie,
  indexMarkers,
  setDraft,
} from '../runtime/index.js';
import { stripMarkersFromCopiesAndForms } from './strip-markers.js';

export interface ParaglideAdapterOptions {
  /** Paraglide's `getLocale` from the generated runtime. */
  getLocale: () => string;
  /** Endpoint of the Localive dev server plugin; its catalog is served at `<endpoint>/catalog`. */
  endpoint?: string;
  /** Called after edit mode changes; the page must reload so server rendering matches. */
  reloadPage?: () => void;
}

export interface ParaglideAdapter extends I18nAdapter {
  /** Whether the message has a shape Localive cannot edit. */
  isReadOnly(key: string): boolean;
}

interface Catalog {
  locales: Locale[];
  messages: Record<Locale, TranslationDictionary>;
  readOnly: string[];
}

const MARKED_ATTRIBUTES = ['title', 'alt', 'placeholder', 'aria-label', 'value'];

/** Loads the message catalog from the dev server and returns an adapter for `createLocalive`. */
export async function createParaglideAdapter({
  getLocale,
  endpoint = '/__localive-update',
  reloadPage = () => location.reload(),
}: ParaglideAdapterOptions): Promise<ParaglideAdapter> {
  const catalog = await loadCatalog(`${endpoint}/catalog`);
  const keys = new Set(catalog.locales.flatMap((locale) => Object.keys(catalog.messages[locale] ?? {})));
  const markerIndex = indexMarkers(catalog.locales.flatMap((locale) => [...keys].map((key) => ({ locale, key }))));
  const readOnly = new Set(catalog.readOnly);
  const stopStripping = hasEditCookie(document.cookie) ? stripMarkersFromCopiesAndForms() : undefined;

  return {
    name: 'paraglide',
    getLocale,
    getTranslations: (locale) => (catalog.messages[locale] ??= {}),
    // Paraglide reloads the page when the locale changes, which recreates the adapter.
    onLocaleChange: () => () => {},
    getMessagesFromElement: (element) => findMessagesIn(element, markerIndex),
    isEditMode: () => hasEditCookie(document.cookie),
    setEditMode(active) {
      document.cookie = active ? `${EDIT_COOKIE}=1; path=/; samesite=lax` : `${EDIT_COOKIE}=; path=/; max-age=0; samesite=lax`;
      reloadPage();
    },
    preview: showDraft,
    isReadOnly: (key) => readOnly.has(key),
    destroy() {
      clearDrafts();
      stopStripping?.();
    },
  };
}

async function loadCatalog(url: string): Promise<Catalog> {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Localive could not load the Paraglide catalog from ${url}: HTTP ${response.status} ${await response.text()}`);
  return response.json();
}

function findMessagesIn(element: Element, markerIndex: ReadonlyMap<string, MessageReference>): MessageReference[] {
  const texts = [element.textContent ?? ''];
  for (const node of [element, ...element.querySelectorAll('*')]) {
    for (const attribute of MARKED_ATTRIBUTES) texts.push(node.getAttribute(attribute) ?? '');
    if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) texts.push(node.value);
  }

  const found = new Map<string, MessageReference>();
  for (const message of findMarkedMessages(texts.join('\n'), markerIndex)) found.set(`${message.locale}\0${message.key}`, message);
  return [...found.values()];
}

/** Variant drafts are not shown, as the message picks its branch from inputs only it has. */
function showDraft(entry: TranslationEntry | null): void {
  if (!entry) clearDrafts();
  else if (entry.variant === undefined) setDraft(entry.locale, entry.key, entry.value);
}
