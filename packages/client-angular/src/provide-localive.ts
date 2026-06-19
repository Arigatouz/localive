import { InjectionToken, makeEnvironmentProviders } from '@angular/core';
import type { EnvironmentProviders } from '@angular/core';
import { createLocalive } from '@localive/core';
import type { I18nAdapter, I18nLiveInstance } from '@localive/core';
import { LocaliveInspectorService } from './localive-inspector.service';

export const LOCALIVE_ADAPTER = new InjectionToken<I18nAdapter>('LOCALIVE_ADAPTER');
export const LOCALIVE_INSTANCE = new InjectionToken<I18nLiveInstance>('LOCALIVE_INSTANCE');

/**
 * Provide Localive inspector for your Angular application.
 *
 * Usage with ngx-translate:
 * ```typescript
 * provideLiveTranslations(() => withNgxTranslate(inject(TranslateService), TranslatePipe))
 * ```
 *
 * Usage with Transloco:
 * ```typescript
 * provideLiveTranslations(() => withTransloco(inject(TranslocoService), TranslocoPipe, TranslocoDirective))
 * ```
 */
export function provideLocalive(
  adapterFactory: () => I18nAdapter,
  options?: {
    locales?: string[];
    defaultLocale?: string;
    activeByDefault?: boolean;
  }
): EnvironmentProviders {
  const locales = options?.locales ?? ['en'];
  const defaultLocale = options?.defaultLocale ?? 'en';
  const activeByDefault = options?.activeByDefault ?? false;

  return makeEnvironmentProviders([
    {
      provide: LOCALIVE_ADAPTER,
      useFactory: adapterFactory,
    },
    {
      provide: LOCALIVE_INSTANCE,
      useFactory: (adapter: I18nAdapter) =>
        createLocalive({
          translationsPath: '',
          adapter,
          locales,
          defaultLocale,
          activeByDefault,
        }),
      deps: [LOCALIVE_ADAPTER],
    },
    {
      provide: LocaliveInspectorService,
      useClass: LocaliveInspectorService,
      deps: [LOCALIVE_INSTANCE],
    },
  ]);
}
