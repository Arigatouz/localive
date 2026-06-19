import type { Compiler, Configuration } from 'webpack';
import { createMiddleware } from '@localive/vite';
import type { DevServerConfig } from './types';
import type {
  WebpackDevServer,
  WebpackDevServerConfig,
  WebpackMiddleware,
  NextFunction,
} from './types';
import type { IncomingMessage, ServerResponse } from 'node:http';

export interface LocaliveWebpackOptions extends DevServerConfig {}

export class LocaliveWebpackPlugin {
  private options: LocaliveWebpackOptions;

  constructor(options: LocaliveWebpackOptions) {
    this.options = options;
  }

  apply(compiler: Compiler) {
    const options = this.options;

    compiler.hooks.afterPlugins.tap('LocaliveWebpackPlugin', () => {
      const devServer = (compiler.options as unknown as Configuration & { devServer?: WebpackDevServerConfig }).devServer;

      if (!devServer) {
        console.warn('[localive] No devServer configuration found. Plugin will not function.');
        return;
      }

      const middleware = createMiddleware({
        translationsPath: options.translationsPath,
        searchRoots: options.searchRoots,
        locales: options.locales,
        defaultLocale: options.defaultLocale,
        endpoint: options.endpoint,
        ws: options.ws,
        wsPort: options.wsPort,
      });

      const originalSetupMiddlewares = devServer.setupMiddlewares;
      devServer.setupMiddlewares = (middlewares: WebpackMiddleware[], devServerInstance: WebpackDevServer) => {
        const localiveMiddleware: WebpackMiddleware = (req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
          middleware(req, res).then(() => {
            if (!res.headersSent) {
              next();
            }
          }).catch((err: Error) => {
            console.error('[localive] Middleware error:', err);
            next();
          });
        };

        const result = originalSetupMiddlewares
          ? originalSetupMiddlewares(middlewares, devServerInstance)
          : middlewares;

        if (Array.isArray(result)) {
          result.unshift(localiveMiddleware);
          return result;
        }

        devServerInstance.app?.use?.(localiveMiddleware);
        return result;
      };

      const originalOnBeforeSetupMiddleware = devServer.onBeforeSetupMiddleware;
      devServer.onBeforeSetupMiddleware = (devServerInstance: WebpackDevServer) => {
        if (originalOnBeforeSetupMiddleware) {
          originalOnBeforeSetupMiddleware(devServerInstance);
        }

        const localiveMiddleware: WebpackMiddleware = (req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
          middleware(req, res).then(() => {
            if (!res.headersSent) {
              next();
            }
          }).catch((err: Error) => {
            console.error('[localive] Middleware error:', err);
            next();
          });
        };

        devServerInstance.app?.use?.(localiveMiddleware);
      };
    });
  }
}
