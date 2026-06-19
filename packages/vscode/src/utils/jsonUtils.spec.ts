import { describe, it, expect } from 'vitest';
import { setNestedValue, getNestedValue, deleteNestedValue } from './jsonUtils';

describe('jsonUtils', () => {
  describe('setNestedValue', () => {
    it('sets a simple top-level key', () => {
      const obj: Record<string, unknown> = {};
      setNestedValue(obj, 'hello', 'Hello');
      expect(obj).toEqual({ hello: 'Hello' });
    });

    it('sets a nested dot-delimited key', () => {
      const obj: Record<string, unknown> = {};
      setNestedValue(obj, 'nav.home', 'Home');
      expect(obj).toEqual({ nav: { home: 'Home' } });
    });

    it('sets deeply nested keys', () => {
      const obj: Record<string, unknown> = {};
      setNestedValue(obj, 'app.dashboard.title', 'Dashboard');
      expect(obj).toEqual({ app: { dashboard: { title: 'Dashboard' } } });
    });

    it('overwrites existing values', () => {
      const obj: Record<string, unknown> = { hello: 'Old' };
      setNestedValue(obj, 'hello', 'New');
      expect(obj).toEqual({ hello: 'New' });
    });

    it('preserves sibling keys when setting nested values', () => {
      const obj: Record<string, unknown> = { nav: { about: 'About' } };
      setNestedValue(obj, 'nav.home', 'Home');
      expect(obj).toEqual({ nav: { about: 'About', home: 'Home' } });
    });
  });

  describe('getNestedValue', () => {
    it('gets a top-level value', () => {
      expect(getNestedValue({ hello: 'Hello' }, 'hello')).toBe('Hello');
    });

    it('gets a nested value', () => {
      expect(getNestedValue({ nav: { home: 'Home' } }, 'nav.home')).toBe('Home');
    });

    it('returns undefined for missing keys', () => {
      expect(getNestedValue({ hello: 'Hello' }, 'missing')).toBeUndefined();
    });

    it('returns undefined when traversing into non-objects', () => {
      expect(getNestedValue({ nav: 'string' }, 'nav.home')).toBeUndefined();
    });
  });

  describe('deleteNestedValue', () => {
    it('deletes a top-level key', () => {
      const obj: Record<string, unknown> = { hello: 'Hello', world: 'World' };
      deleteNestedValue(obj, 'hello');
      expect(obj).toEqual({ world: 'World' });
    });

    it('deletes a nested key without removing the parent', () => {
      const obj: Record<string, unknown> = { nav: { home: 'Home', about: 'About' } };
      deleteNestedValue(obj, 'nav.home');
      expect(obj).toEqual({ nav: { about: 'About' } });
    });

    it('does nothing for missing keys', () => {
      const obj: Record<string, unknown> = { hello: 'Hello' };
      deleteNestedValue(obj, 'missing');
      expect(obj).toEqual({ hello: 'Hello' });
    });
  });
});