import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Subject, firstValueFrom } from 'rxjs';
import type { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import type { LocaliveBuilderOptions } from './schema';

vi.mock('./dev-server-delegate', () => ({
  executeDevServer: vi.fn(),
}));

import { executeDevServer } from './dev-server-delegate';
import { localiveBuilder } from './builders';

function createMockContext(): BuilderContext {
  return {
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      createChild: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }),
    },
    target: { project: '', target: '', configuration: '' },
    builder: { builderName: '', description: '', optionSchema: false },
    id: 0,
    currentDirectory: process.cwd(),
    workspaceRoot: process.cwd(),
    analytics: undefined,
    scheduleTarget: vi.fn(),
    scheduleBuilder: vi.fn(),
    getBuilderNameForTarget: vi.fn(),
    getTargetOptions: vi.fn(),
    validateOptions: vi.fn(),
    reportStatus: vi.fn(),
    reportRunning: vi.fn(),
    getConfigurationName: vi.fn(),
    addTelemetry: vi.fn(),
    addError: vi.fn(),
  } as any as BuilderContext;
}

function createFakeObservable(): any {
  const subject = new Subject<BuilderOutput>();
  subject.next({ success: true } as BuilderOutput);
  subject.complete();
  return subject.asObservable();
}

describe('localiveBuilder', () => {
  beforeEach(() => {
    vi.mocked(executeDevServer).mockReset();
    vi.mocked(executeDevServer).mockReturnValue(createFakeObservable() as any);
  });

  it('delegates to the upstream dev-server builder', async () => {
    const options: LocaliveBuilderOptions = {
      buildTarget: 'my-app:build:development',
      localive: {
        translationsPath: 'src/locales',
        locales: ['en', 'fr'],
        defaultLocale: 'en',
      },
    };

    await localiveBuilder(options, createMockContext());

    expect(executeDevServer).toHaveBeenCalledTimes(1);
  });

  it('forwards dev-server options to the upstream builder (minus localive)', async () => {
    const options: LocaliveBuilderOptions = {
      buildTarget: 'my-app:build:development',
      port: 4500,
      host: '0.0.0.0',
      open: true,
      localive: {
        translationsPath: 'src/locales',
        locales: ['en', 'fr'],
      },
    };

    await localiveBuilder(options, createMockContext());

    const [forwardedOptions] = vi.mocked(executeDevServer).mock.calls[0];
    expect(forwardedOptions).toMatchObject({
      buildTarget: 'my-app:build:development',
      port: 4500,
      host: '0.0.0.0',
      open: true,
    });
    expect(forwardedOptions).not.toHaveProperty('localive');
  });

  it('injects Localive middleware via extensions.middleware', async () => {
    const options: LocaliveBuilderOptions = {
      buildTarget: 'my-app:build:development',
      localive: {
        translationsPath: 'src/locales',
        locales: ['en', 'fr'],
      },
    };

    await localiveBuilder(options, createMockContext());

    const callArgs = vi.mocked(executeDevServer).mock.calls[0];
    const extensions = callArgs?.[3];
    expect(extensions).toBeDefined();
    expect(Array.isArray(extensions?.middleware)).toBe(true);
    expect(extensions?.middleware?.length).toBeGreaterThanOrEqual(1);
    expect(typeof extensions?.middleware?.[0]).toBe('function');
  });

  it('returns the observable from the upstream builder', async () => {
    const options: LocaliveBuilderOptions = {
      buildTarget: 'my-app:build:development',
      localive: {
        translationsPath: 'src/locales',
        locales: ['en'],
      },
    };

    const result = localiveBuilder(options, createMockContext());
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(typeof (result as any).subscribe).toBe('function');
  });

  it('fails when buildTarget is missing', async () => {
    const options = {
      localive: {
        translationsPath: 'src/locales',
        locales: ['en'],
      },
    } as unknown as LocaliveBuilderOptions;

    const ctx = createMockContext();
    const result = await firstValueFrom(localiveBuilder(options, ctx));
    expect(result).toHaveProperty('success', false);
    expect(executeDevServer).not.toHaveBeenCalled();
  });

  it('fails when localive.translationsPath is missing', async () => {
    const options: LocaliveBuilderOptions = {
      buildTarget: 'my-app:build:development',
      localive: { translationsPath: '', locales: ['en'] },
    };

    const ctx = createMockContext();
    const result = await firstValueFrom(localiveBuilder(options, ctx));
    expect(result).toHaveProperty('success', false);
    expect(executeDevServer).not.toHaveBeenCalled();
  });

  it('fails when localive config is absent entirely', async () => {
    const options = { buildTarget: 'my-app:build:development' } as unknown as LocaliveBuilderOptions;

    const ctx = createMockContext();
    const result = await firstValueFrom(localiveBuilder(options, ctx));
    expect(result).toHaveProperty('success', false);
    expect(executeDevServer).not.toHaveBeenCalled();
  });

  it('logs a startup message with the endpoint', async () => {
    const options: LocaliveBuilderOptions = {
      buildTarget: 'my-app:build:development',
      localive: {
        translationsPath: 'src/locales',
        locales: ['en', 'fr'],
        endpoint: '/custom-update',
      },
    };

    const ctx = createMockContext();
    await localiveBuilder(options, ctx);
    expect(ctx.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('/custom-update'),
    );
  });
});