import { Injectable, Inject } from '@angular/core';
import type { OnDestroy } from '@angular/core';
import type { I18nLiveInstance, Locale, TranslationDictionary } from '@localive/core';
import { LOCALIVE_INSTANCE } from './provide-localive';

@Injectable()
export class LocaliveInspectorService implements OnDestroy {
  private instance: I18nLiveInstance;

  constructor(@Inject(LOCALIVE_INSTANCE) instance: I18nLiveInstance) {
    this.instance = instance;
  }

  /** Activate the inspector overlay */
  activate(): void {
    this.instance.activate();
  }

  /** Deactivate the inspector overlay */
  deactivate(): void {
    this.instance.deactivate();
  }

  /** Check if the inspector is currently active */
  isActive(): boolean {
    return this.instance.isActive();
  }

  /** Resolve an i18n key from a DOM element */
  resolveKey(element: HTMLElement): string | null {
    return this.instance.resolveKey(element);
  }

  /** Get a single translation value */
  getTranslation(key: string, locale: Locale): string | undefined {
    return this.instance.getTranslation(key, locale);
  }

  /** Get the full translation dictionary for a locale */
  getTranslations(locale: Locale): TranslationDictionary {
    return this.instance.getTranslations(locale);
  }

  /** Save a translation entry (sends to dev server) */
  async saveTranslation(key: string, value: string, locale: Locale): Promise<boolean> {
    const result = await this.instance.saveTranslation({ key, value, locale });
    return result.success;
  }

  /** Get the underlying localive instance for advanced usage */
  getInstance(): I18nLiveInstance {
    return this.instance;
  }

  ngOnDestroy(): void {
    this.instance.destroy();
  }
}
