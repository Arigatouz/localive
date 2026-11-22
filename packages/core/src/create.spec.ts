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

  it.each([
    ['<h1>Not found</h1>', 'HTTP 404: <h1>Not found</h1>'],
    ['{"error":"No such key"}', 'HTTP 404: No such key'],
    ['{"unexpected":true}', 'HTTP 404: {"unexpected":true}'],
    ['null', 'HTTP 404: null'],
  ])('reports the error response %s', async (body, error) => {
    vi.stubGlobal('fetch', async () => new Response(body, { status: 404 }));
    const instance = createLocalive(validConfig);

    expect(await instance.saveTranslation({ key: 'title', value: 'Hello', locale: 'en' })).toEqual({
      success: false,
      error,
    });

    instance.destroy();
    vi.unstubAllGlobals();
  });

  it.each([
    [{ cta: 'Click (here', greeting: 'Hello {name}' }, 'Hello Anna', 'greeting'],
    [{ price: 'Costs $5 (approx.)' }, 'Costs $5 (approx.)', 'price'],
    [{ dots: 'v1.2' }, 'v1x2', null],
    [{ greeting: 'Hello {name}', world: 'Hello World' }, 'Hello World', 'world'],
    [{ count: '{count}' }, 'Unrelated text', null],
  ])('resolves %j from the text "%s"', (dictionary, text, key) => {
    const instance = createLocalive({
      ...validConfig,
      adapter: createMockAdapter({ getTranslations: () => dictionary, getKeyFromElement: undefined }),
    });
    const element = document.createElement('span');
    element.textContent = text;

    expect(instance.resolveKey(element)).toBe(key);

    instance.destroy();
  });

  describe('saving a variant or a checked edit', () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
      fetchMock.mockReset().mockImplementation(async () => new Response('{"ok":true}'));
      vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it.each([
      [{ variant: 'plural=one', expected: '1 item' }],
      [{ expected: null }],
    ])('sends %j to the dev server', async (fields) => {
      const entry = { key: 'count', value: 'One item', locale: 'en', ...fields };
      await createLocalive(validConfig).saveTranslation(entry);

      expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(entry);
    });

    it('keeps the other variants in the store', async () => {
      const instance = createLocalive({
        ...validConfig,
        adapter: createMockAdapter({
          getTranslations: () => ({ count: { 'plural=one': '1 item', 'plural=other': 'items' } }),
        }),
      });

      await instance.saveTranslation({ key: 'count', value: 'One item', locale: 'en', variant: 'plural=one' });

      expect(instance.getTranslations('en').count).toEqual({ 'plural=one': 'One item', 'plural=other': 'items' });
    });

    it('starts a variant record for an untranslated key', async () => {
      const instance = createLocalive({ ...validConfig, adapter: createMockAdapter() });

      await instance.saveTranslation({ key: 'count', value: 'One item', locale: 'en', variant: 'plural=one' });

      expect(instance.getTranslations('en').count).toEqual({ 'plural=one': 'One item' });
    });

    it('does not push a variant into the library as the whole message', async () => {
      const setTranslation = vi.fn();
      const instance = createLocalive({ ...validConfig, adapter: createMockAdapter({ setTranslation }) });

      await instance.saveTranslation({ key: 'count', value: 'One item', locale: 'en', variant: 'plural=one' });

      expect(setTranslation).not.toHaveBeenCalled();
    });
  });

  it('destroy cleans up observers and DOM elements', () => {
    const instance = createLocalive(validConfig);
    instance.activate();
    instance.destroy();
    expect(instance.isActive()).toBe(false);
  });
});