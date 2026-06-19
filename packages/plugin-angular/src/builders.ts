import type { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import type { LocaliveDevServerOptions, LocaliveBuilderOptions } from './schema';

export function createLocaliveBuilder() {
  return async function localiveBuilder(
    options: LocaliveBuilderOptions,
    context: BuilderContext
  ): Promise<BuilderOutput> {
    const localiveConfig: LocaliveDevServerOptions = options.localive ?? {
      translationsPath: '',
      locales: ['en'],
    };

    const {
      translationsPath,
      locales,
      defaultLocale = locales[0] ?? 'en',
      apiBase = '/__localive__',
      authToken,
      activeByDefault = false,
    } = localiveConfig;

    if (!translationsPath) {
      context.logger.error('Localive: translationsPath is required in the builder configuration.');
      return { success: false, error: 'Missing translationsPath' };
    }

    context.logger.info(`Localive: Live i18n editing enabled at ${apiBase}`);

    return {
      success: true,
      localiveConfig: {
        translationsPath,
        locales,
        defaultLocale,
        apiBase,
        authToken,
        activeByDefault,
      },
    } as BuilderOutput;
  };
}

export const localiveBuilder = createLocaliveBuilder();