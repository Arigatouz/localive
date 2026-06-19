import { I18nLiveStore } from './store';
import type { I18nAdapter } from './types';

export class KeyResolver {
  private store: I18nLiveStore;
  private adapter: I18nAdapter;

  constructor(store: I18nLiveStore, adapter: I18nAdapter) {
    this.store = store;
    this.adapter = adapter;
  }

  resolveKey(element: HTMLElement): string | null {
    // Priority 1: data-i18n-key attribute (invisible marker via pipe/directive)
    const keyAttr = element.getAttribute('data-i18n-key');
    if (keyAttr) return keyAttr;

    // Priority 2: adapter's custom key resolution
    if (this.adapter.getKeyFromElement) {
      const key = this.adapter.getKeyFromElement(element);
      if (key) return key;
    }

    // Priority 3: reverse-lookup by text content
    return this.reverseLookup(element);
  }

  private reverseLookup(element: HTMLElement): string | null {
    const text = element.textContent?.trim();
    if (!text) return null;

    const dict = this.store.dictionaries.get(this.store.locale);
    if (!dict) return null;

    for (const [key, value] of Object.entries(dict)) {
      if (typeof value !== 'string') continue;

      // Exact match
      if (value === text) return key;

      // Pattern match: replace interpolation placeholders with wildcard regex
      const hasInterpolation = value.includes('{{') || value.includes('{');
      if (hasInterpolation) {
        // Step 1: Replace interpolation placeholders with a unique placeholder
        let pattern: string = value
          .replace(/\{\{[^}]+\}\}/g, '___INTERP___')   // {{name}} style
          .replace(/\{[^}]+\}/g, '___INTERP___');        // {name} style (ICU/FormatJS)

        // Step 2: Escape all regex special characters
        pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Step 3: Replace our unique placeholder with a capture group
        pattern = pattern.replace(/___INTERP___/g, '(.+?)');

        try {
          const regex: RegExp = new RegExp(`^${pattern}$`);
          if (regex.test(text)) return key;
        } catch {
          continue;
        }
      }
    }

    return null;
  }
}