import { expect, describe, it, vi, beforeEach } from 'vitest';
import { createLocalive } from '@localive/core';
import { createMockAdapter, createMockPlugin } from '../../../tools/testing';
import type { I18nLiveInstance } from '@localive/core';

describe('createLocalive (Svelte)', () => {
  let instance: I18nLiveInstance;

  beforeEach(() => {
    instance = createLocalive({
      translationsPath: '',
      adapter: createMockAdapter(),
      locales: ['en', 'fr'],
      defaultLocale: 'en',
    });
  });

  it('creates an instance with the correct default locale', () => {
    expect(instance.store.locale).toBe('en');
  });

  it('creates an instance with active state defaulting to false', () => {
    expect(instance.store.active).toBe(false);
  });

  it('activates the inspector', () => {
    instance.activate();
    expect(instance.isActive()).toBe(true);
  });

  it('deactivates the inspector', () => {
    instance.activate();
    instance.deactivate();
    expect(instance.isActive()).toBe(false);
  });

  it('returns translations for a locale', () => {
    const translations = instance.getTranslations('en');
    expect(translations).toBeDefined();
  });

  it('returns a specific translation', () => {
    const value = instance.getTranslation('app.title', 'en');
    expect(typeof value === 'string' || value === undefined).toBe(true);
  });

  it('resolves a key from an element with data-i18n-key', () => {
    const el = document.createElement('span');
    el.setAttribute('data-i18n-key', 'app.title');
    expect(instance.resolveKey(el)).toBe('app.title');
  });

  it('returns null for elements without data-i18n-key', () => {
    const el = document.createElement('span');
    expect(instance.resolveKey(el)).toBeNull();
  });

  it('notifies subscribers on state change', () => {
    const callback = vi.fn();
    instance.store.subscribe(callback);
    instance.activate();
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({ active: true })
    );
  });

  it('destroys cleanly', () => {
    instance.destroy();
    expect(instance.isActive()).toBe(false);
  });

  it('can be activated by default', () => {
    const activeByDefault = createLocalive({
      translationsPath: '',
      adapter: createMockAdapter(),
      locales: ['en'],
      defaultLocale: 'en',
      activeByDefault: true,
    });
    expect(activeByDefault.isActive()).toBe(true);
  });
});