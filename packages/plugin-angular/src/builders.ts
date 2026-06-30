import type { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { Observable, of } from 'rxjs';
import { executeDevServer } from './dev-server-delegate';
import { createMiddleware } from '@localive/vite';
import type { DevServerConfig } from '@localive/vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { LocaliveBuilderOptions, LocaliveDevServerOptions } from './schema';

const DEFAULT_ENDPOINT = '/__localive-update';

export function createLocaliveBuilder() {
  return function localiveBuilder(
    options: LocaliveBuilderOptions,
    context: BuilderContext,
  ): Observable<BuilderOutput> {
    const { localive, ...devServerOptions } = options;

    if (!devServerOptions.buildTarget) {
      context.logger.error('Localive: buildTarget is required in the builder configuration.');
      return of<BuilderOutput>({ success: false, error: 'Missing buildTarget' });
    }

    const localiveConfig: LocaliveDevServerOptions = localive ?? {
      translationsPath: '',
      locales: ['en'],
    };

    if (!localiveConfig.translationsPath) {
      context.logger.error('Localive: localive.translationsPath is required in the builder configuration.');
      return of<BuilderOutput>({ success: false, error: 'Missing localive.translationsPath' });
    }

    const endpoint = localiveConfig.endpoint ?? DEFAULT_ENDPOINT;

    const middlewareConfig: DevServerConfig = {
      translationsPath: localiveConfig.translationsPath,
      searchRoots: localiveConfig.searchRoots,
      locales: localiveConfig.locales,
      defaultLocale: localiveConfig.defaultLocale ?? localiveConfig.locales[0] ?? 'en',
      endpoint,
    };

    context.logger.info(`Localive: Live i18n editing enabled at ${endpoint}`);

    const rawMiddleware = createMiddleware(middlewareConfig);
    const localiveMiddleware = (
      req: IncomingMessage,
      res: ServerResponse,
      next: (err?: unknown) => void,
    ): void => {
      rawMiddleware(req, res)
        .then(() => {
          if (!res.headersSent) {
            next();
          }
        })
        .catch(() => {
          if (!res.headersSent) {
            next();
          }
        });
    };

    const extensions = {
      middleware: [localiveMiddleware],
    };

    return executeDevServer(
      devServerOptions as any,
      context,
      undefined,
      extensions as any,
    ) as Observable<BuilderOutput>;
  };
}

export const localiveBuilder = createLocaliveBuilder();