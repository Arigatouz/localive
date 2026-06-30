import { describe, it, expect, vi, beforeEach } from 'vitest';

const ctx = new Map<symbol, unknown>();

vi.mock('svelte', async () => {
  const actual = await vi.importActual<typeof import('svelte')>('svelte');
  return {
    ...actual,
    setContext: (key: symbol, value: unknown) => { ctx.set(key, value); },
    getContext: <T>(key: symbol): T => ctx.get(key) as T,
    hasContext: (key: symbol): boolean => ctx.has(key),
  };
});

import { createLocalive } from '@localive/core';
import { createMockAdapter } from '../../../tools/testing';
import { initLocalive, getLocaliveState } from './createLocalive';
import { setLocaliveContext, getLocaliveContext, useLocaliveEditor } from './useLocaliveEditor';

describe('Svelte context unification', () => {
  beforeEach(() => {
    ctx.clear();
  });

  it('initLocalive context is readable by getLocaliveContext', () => {
    initLocalive(createMockAdapter(), { locales: ['en', 'fr'], defaultLocale: 'en' });
    const instance = getLocaliveContext();
    expect(instance).toBeDefined();
    expect(typeof instance.isActive).toBe('function');
    expect(instance.isActive()).toBe(false);
  });

  it('initLocalive context is readable by getLocaliveState', () => {
    initLocalive(createMockAdapter(), { locales: ['en'] });
    const state = getLocaliveState();
    expect(state).toBeDefined();
    expect(state.instance).toBeDefined();
    expect(typeof state.isActive.subscribe).toBe('function');
    expect(typeof state.currentLocale.subscribe).toBe('function');
  });

  it('setLocaliveContext context is readable by getLocaliveState', () => {
    const instance = createLocalive({
      translationsPath: '',
      adapter: createMockAdapter(),
      locales: ['en'],
      defaultLocale: 'en',
    });
    setLocaliveContext(instance);
    const state = getLocaliveState();
    expect(state.instance).toBe(instance);
  });

  it('setLocaliveContext context is readable by getLocaliveContext', () => {
    const instance = createLocalive({
      translationsPath: '',
      adapter: createMockAdapter(),
      locales: ['en'],
      defaultLocale: 'en',
    });
    setLocaliveContext(instance);
    const retrieved = getLocaliveContext();
    expect(retrieved).toBe(instance);
  });

  it('instance from initLocalive context is usable for editor operations', () => {
    initLocalive(createMockAdapter(), { locales: ['en'] });
    const instance = getLocaliveContext();
    expect(instance.isActive()).toBe(false);
    instance.activate();
    expect(instance.isActive()).toBe(true);
    instance.deactivate();
    expect(instance.isActive()).toBe(false);
  });
});