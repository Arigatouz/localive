import { describe, it, expect, vi } from 'vitest';
import { createLocaliveBuilder } from './builders';
import type { LocaliveBuilderOptions } from './schema';

function createMockContext() {
  return {
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      createChild: () => ({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      }),
    },
  } as any;
}

describe('createLocaliveBuilder', () => {
  it('returns a builder function', () => {
    const builder = createLocaliveBuilder();
    expect(typeof builder).toBe('function');
  });

  it('fails when translationsPath is missing', async () => {
    const builder = createLocaliveBuilder();
    const options: LocaliveBuilderOptions = {
      localive: {
        translationsPath: '',
        locales: ['en'],
      },
    };

    const result = await builder(options, createMockContext());
    expect(result.success).toBe(false);
  });

  it('succeeds with valid translationsPath', async () => {
    const builder = createLocaliveBuilder();
    const options: LocaliveBuilderOptions = {
      localive: {
        translationsPath: '/path/to/translations',
        locales: ['en', 'fr'],
        defaultLocale: 'en',
      },
    };

    const result = await builder(options, createMockContext());
    expect(result.success).toBe(true);
  });

  it('uses default apiBase when not specified', async () => {
    const builder = createLocaliveBuilder();
    const options: LocaliveBuilderOptions = {
      localive: {
        translationsPath: '/path/to/translations',
        locales: ['en', 'fr'],
      },
    };

    const result = await builder(options, createMockContext());
    expect(result.success).toBe(true);
    expect((result as any).localiveConfig.apiBase).toBe('/__localive__');
  });

  it('passes custom apiBase through', async () => {
    const builder = createLocaliveBuilder();
    const options: LocaliveBuilderOptions = {
      localive: {
        translationsPath: '/path/to/translations',
        locales: ['en', 'fr'],
        apiBase: '/custom-api',
      },
    };

    const result = await builder(options, createMockContext());
    expect((result as any).localiveConfig.apiBase).toBe('/custom-api');
  });

  it('uses defaultLocale from config', async () => {
    const builder = createLocaliveBuilder();
    const options: LocaliveBuilderOptions = {
      localive: {
        translationsPath: '/path/to/translations',
        locales: ['en', 'fr', 'de'],
        defaultLocale: 'fr',
      },
    };

    const result = await builder(options, createMockContext());
    expect((result as any).localiveConfig.defaultLocale).toBe('fr');
  });

  it('falls back to first locale when defaultLocale is not specified', async () => {
    const builder = createLocaliveBuilder();
    const options: LocaliveBuilderOptions = {
      localive: {
        translationsPath: '/path/to/translations',
        locales: ['de', 'en', 'fr'],
      },
    };

    const result = await builder(options, createMockContext());
    expect((result as any).localiveConfig.defaultLocale).toBe('de');
  });

  it('defaults activeByDefault to false', async () => {
    const builder = createLocaliveBuilder();
    const options: LocaliveBuilderOptions = {
      localive: {
        translationsPath: '/path/to/translations',
        locales: ['en'],
      },
    };

    const result = await builder(options, createMockContext());
    expect((result as any).localiveConfig.activeByDefault).toBe(false);
  });
});