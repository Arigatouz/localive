import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nLiveStore } from './store';
import type { Locale, TranslationDictionary } from './types';

describe('I18nLiveStore', () => {
  let store: I18nLiveStore;

  const enDict: TranslationDictionary = {
    'common.greeting': 'Hello',
    'common.farewell': 'Goodbye',
    'home.title': 'Welcome Home',
    'home.subtitle': 'Nice to see you, {{name}}!',
  };

  const frDict: TranslationDictionary = {
    'common.greeting': 'Bonjour',
    'common.farewell': 'Au revoir',
    'home.title': 'Bienvenue',
    'home.subtitle': 'Content de vous voir, {{name}} !',
  };

  beforeEach(() => {
    store = new I18nLiveStore({
      locale: 'en',
      dictionaries: new Map([
        ['en', enDict],
        ['fr', frDict],
      ]),
    });
  });

  describe('locale', () => {
    it('returns the current locale', () => {
      expect(store.locale).toBe('en');
    });

    it('sets a new locale', () => {
      store.locale = 'fr';
      expect(store.locale).toBe('fr');
    });

    it('notifies subscribers when locale changes', () => {
      const callback = vi.fn();
      store.subscribe(callback);
      store.locale = 'fr';
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0].locale).toBe('fr');
    });
  });

  describe('dictionaries', () => {
    it('returns the dictionaries map', () => {
      expect(store.dictionaries).toBeInstanceOf(Map);
      expect(store.dictionaries.get('en')).toEqual(enDict);
      expect(store.dictionaries.get('fr')).toEqual(frDict);
    });

    it('allows updating a dictionary', () => {
      const updated = { ...enDict, 'common.greeting': 'Hi' };
      store.dictionaries.set('en', updated);
      expect(store.dictionaries.get('en')!['common.greeting']).toBe('Hi');
    });
  });

  describe('active', () => {
    it('defaults to false', () => {
      expect(store.active).toBe(false);
    });

    it('can be set to true', () => {
      store.active = true;
      expect(store.active).toBe(true);
    });

    it('notifies subscribers when active state changes', () => {
      const callback = vi.fn();
      store.subscribe(callback);
      store.active = true;
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0].active).toBe(true);
    });
  });

  describe('subscribe', () => {
    it('returns an unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = store.subscribe(callback);
      expect(typeof unsubscribe).toBe('function');
    });

    it('stops receiving updates after unsubscribing', () => {
      const callback = vi.fn();
      const unsubscribe = store.subscribe(callback);
      unsubscribe();
      store.locale = 'fr';
      expect(callback).not.toHaveBeenCalled();
    });

    it('supports multiple subscribers', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      store.subscribe(cb1);
      store.subscribe(cb2);
      store.active = true;
      expect(cb1).toHaveBeenCalled();
      expect(cb2).toHaveBeenCalled();
    });

    it('does not notify on the same value', () => {
      const callback = vi.fn();
      store.subscribe(callback);
      store.locale = 'en'; // same as current
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('getTranslation', () => {
    it('returns the translation for an existing key', () => {
      expect(store.getTranslation('common.greeting', 'en')).toBe('Hello');
      expect(store.getTranslation('common.greeting', 'fr')).toBe('Bonjour');
    });

    it('returns undefined for a missing key', () => {
      expect(store.getTranslation('nonexistent.key', 'en')).toBeUndefined();
    });

    it('returns undefined for a missing locale', () => {
      expect(store.getTranslation('common.greeting', 'de')).toBeUndefined();
    });
  });
});