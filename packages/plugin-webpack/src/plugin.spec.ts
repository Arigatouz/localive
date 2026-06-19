import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocaliveWebpackPlugin } from './plugin';
import type { Compiler, Configuration } from 'webpack';
import type { WebpackMiddleware, WebpackMiddlewareSetupHandler, WebpackDevServerConfig } from './types';

function createMockCompiler(devServer?: Partial<WebpackDevServerConfig>): Compiler {
  const compiler = {
    options: { devServer } as unknown as Configuration,
    hooks: {
      afterPlugins: {
        tap: vi.fn((name: string, fn: Function) => {
          fn(compiler);
        }),
      },
    },
  } as unknown as Compiler;
  return compiler;
}

describe('LocaliveWebpackPlugin', () => {
  it('creates an instance with options', () => {
    const plugin = new LocaliveWebpackPlugin({
      translationsPath: '/path/to/translations',
    });
    expect(plugin).toBeDefined();
  });

  it('applies to webpack compiler with devServer config', () => {
    const setupMiddlewares = vi.fn((middlewares: WebpackMiddleware[]) => middlewares) as WebpackMiddlewareSetupHandler;
    const compiler = createMockCompiler({
      setupMiddlewares,
    });

    const plugin = new LocaliveWebpackPlugin({
      translationsPath: '/path/to/translations',
    });

    plugin.apply(compiler);
  });

  it('warns when no devServer config is found', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const compiler = createMockCompiler(undefined);

    const plugin = new LocaliveWebpackPlugin({
      translationsPath: '/path/to/translations',
    });

    plugin.apply(compiler);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('No devServer')
    );

    warnSpy.mockRestore();
  });

  it('wraps existing setupMiddlewares', () => {
    const originalSetup = vi.fn((middlewares: WebpackMiddleware[]) => middlewares) as WebpackMiddlewareSetupHandler;
    const compiler = createMockCompiler({
      setupMiddlewares: originalSetup,
    });

    const plugin = new LocaliveWebpackPlugin({
      translationsPath: '/path/to/translations',
    });

    plugin.apply(compiler);

    expect(compiler.options.devServer!.setupMiddlewares).toBeDefined();
    expect(typeof compiler.options.devServer!.setupMiddlewares).toBe('function');
  });

  it('intercepts setupMiddlewares and injects localive middleware', () => {
    const originalSetup = vi.fn((middlewares: WebpackMiddleware[]) => middlewares) as WebpackMiddlewareSetupHandler;
    const compiler = createMockCompiler({
      setupMiddlewares: originalSetup,
    });

    const plugin = new LocaliveWebpackPlugin({
      translationsPath: '/path/to/translations',
    });

    plugin.apply(compiler);

    const wrappedSetup = compiler.options.devServer!.setupMiddlewares as WebpackMiddlewareSetupHandler;
    const result = wrappedSetup([], { app: { use: vi.fn() } });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
  });
});
