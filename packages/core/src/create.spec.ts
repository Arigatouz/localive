import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLocalive } from './create';
import { createMockAdapter, createMockPlugin } from '../../../tools/testing';
import type { Locale } from './types';

describe('createLocalive', () => {
  const mockAdapter = createMockAdapter();
  const validConfig = {
    translationsPath: '/fake/path/i18n',
    searchRoots: ['/fake/path/i18n'],
    locales: ['en', 'fr'] as Locale[],
    defaultLocale: 'en' as Locale,
    adapter: mockAdapter,
  };

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('creates an instance with default config', () => {
    const instance = createLocalive(validConfig);
    expect(instance).toBeDefined();
    expect(instance.store).toBeDefined();
    expect(instance.store.locale).toBe('en');
    instance.destroy();
  });

  it('creates an instance with minimal config', () => {
    const instance = createLocalive({
      ...validConfig,
    });
    expect(instance).toBeDefined();
    expect(instance.store).toBeDefined();
    expect(instance.store.locale).toBe('en');
    instance.destroy();
  });

  it('throws if locales is empty', () => {
    expect(() =>
      createLocalive({
        ...validConfig,
        locales: [],
      })
    ).toThrow(/locales/);
  });

  it('throws if defaultLocale is not in locales', () => {
    expect(() =>
      createLocalive({
        ...validConfig,
        defaultLocale: 'de' as Locale,
        locales: ['en', 'fr'] as Locale[],
      })
    ).toThrow(/defaultLocale/);
  });

  it('registers plugins via use()', () => {
    const plugin = createMockPlugin({ name: 'test-plugin' });
    const instance = createLocalive(validConfig);
    const result = instance.use(plugin);
    expect(result).toBe(instance); // chainable
    instance.destroy();
  });

  it('registers adapter and connects locale/dictionary', () => {
    const instance = createLocalive(validConfig);
    expect(instance.store.locale).toBe(mockAdapter.getLocale());
    instance.destroy();
  });

  it('activate/deactivate toggles inspector state', () => {
    const instance = createLocalive(validConfig);
    expect(instance.isActive()).toBe(false);
    instance.activate();
    expect(instance.isActive()).toBe(true);
    instance.deactivate();
    expect(instance.isActive()).toBe(false);
    instance.destroy();
  });

  it('getTranslation returns value for existing key', () => {
    const instance = createLocalive(validConfig);
    expect(instance.getTranslation('common.greeting', 'en')).toBe('Hello');
    instance.destroy();
  });

  it('getTranslation returns undefined for missing key', () => {
    const instance = createLocalive(validConfig);
    expect(instance.getTranslation('nonexistent.key', 'en')).toBeUndefined();
    instance.destroy();
  });

  it('destroy cleans up observers and DOM elements', () => {
    const instance = createLocalive(validConfig);
    instance.activate();
    instance.destroy();
    expect(instance.isActive()).toBe(false);
  });
});