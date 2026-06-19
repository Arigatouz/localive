import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLocalive } from '@localive/core';
import type { I18nAdapter, Locale, TranslationDictionary } from '@localive/core';
import { LiveEditorOverlayComponent } from './live-editor-overlay.component';
import { LOCALIVE_INSTANCE } from './provide-localive';
import { signal } from '@angular/core';
import type { ChangeDetectorRef } from '@angular/core';

function createTestAdapter(): I18nAdapter {
  const translations: Record<Locale, TranslationDictionary> = {
    en: {
      'common.greeting': 'Hello',
      'common.farewell': 'Goodbye',
      'home.title': 'Welcome Home',
    },
    fr: {
      'common.greeting': 'Bonjour',
      'common.farewell': 'Au revoir',
      'home.title': 'Bienvenue',
    },
  };

  let currentLocale: Locale = 'en';
  const callbacks: Array<(locale: Locale) => void> = [];

  return {
    name: 'test-adapter',
    getLocale: () => currentLocale,
    getTranslations: (locale: Locale) => translations[locale] ?? {},
    onLocaleChange: (cb: (locale: Locale) => void) => {
      callbacks.push(cb);
      return () => {
        const idx = callbacks.indexOf(cb);
        if (idx > -1) callbacks.splice(idx, 1);
      };
    },
    destroy: () => {},
  };
}

function createMockChangeDetectorRef(): ChangeDetectorRef {
  return {
    markForCheck: vi.fn(),
    detectChanges: vi.fn(),
    checkNoChanges: vi.fn(),
    detach: vi.fn(),
    reattach: vi.fn(),
  } as unknown as ChangeDetectorRef;
}

describe('LiveEditorOverlayComponent', () => {
  let instance: ReturnType<typeof createLocalive>;

  beforeEach(() => {
    document.body.innerHTML = '';
    instance = createLocalive({
      translationsPath: '',
      adapter: createTestAdapter(),
      locales: ['en', 'fr'],
      defaultLocale: 'en',
    });
  });

  afterEach(() => {
    instance.destroy();
    document.body.innerHTML = '';
  });

  it('can be constructed with a localive instance', () => {
    const mockCdr = createMockChangeDetectorRef();
    const component = new LiveEditorOverlayComponent(instance, mockCdr);
    expect(component).toBeDefined();
    expect(component.active()).toBe(false);
  });

  it('has deactivate method that calls instance.deactivate', () => {
    const mockCdr = createMockChangeDetectorRef();
    const component = new LiveEditorOverlayComponent(instance, mockCdr);
    const deactivateSpy = vi.spyOn(instance, 'deactivate');
    component.deactivate();
    expect(deactivateSpy).toHaveBeenCalled();
  });

  it('initializes with inactive state', () => {
    const mockCdr = createMockChangeDetectorRef();
    const component = new LiveEditorOverlayComponent(instance, mockCdr);
    expect(component.active()).toBe(false);
    expect(component.currentKey()).toBeNull();
  });

  it('closeEditor clears currentKey and editValue', () => {
    const mockCdr = createMockChangeDetectorRef();
    const component = new LiveEditorOverlayComponent(instance, mockCdr);
    component.currentKey.set('common.greeting');
    component.editValue.set('Bonjour');
    component.closeEditor();
    expect(component.currentKey()).toBeNull();
    expect(component.editValue()).toBe('');
  });

  it('onEditorInput updates editValue from textarea event', () => {
    const mockCdr = createMockChangeDetectorRef();
    const component = new LiveEditorOverlayComponent(instance, mockCdr);
    const textarea = document.createElement('textarea');
    textarea.value = 'New translation text';
    const mockEvent = { target: textarea } as unknown as Event;
    component.onEditorInput(mockEvent);
    expect(component.editValue()).toBe('New translation text');
  });

  it('cleanupFns are called on destroy via ngOnInit + ngOnDestroy', () => {
    const mockCdr = createMockChangeDetectorRef();
    const component = new LiveEditorOverlayComponent(instance, mockCdr);
    component.ngOnInit();

    const unsubscribeSpy = vi.spyOn(instance.store, 'subscribe');
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    component.ngOnDestroy();

    expect(removeEventListenerSpy).toHaveBeenCalled();
    unsubscribeSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});
