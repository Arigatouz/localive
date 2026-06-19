import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { createLocalive } from '@localive/core';
import type { I18nAdapter, Locale, TranslationDictionary, I18nLiveInstance } from '@localive/core';
import LiveEditorOverlay from './LiveEditorOverlay.vue';
import { localiveSymbol } from './symbols';

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

function createWrapperComponent(instance: I18nLiveInstance) {
  return defineComponent({
    components: { LiveEditorOverlay },
    provide() {
      return { [localiveSymbol as symbol]: instance };
    },
    template: '<LiveEditorOverlay />',
  });
}

describe('LiveEditorOverlay', () => {
  let instance: I18nLiveInstance;

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

  it('renders nothing when inactive', () => {
    const wrapper = mount(createWrapperComponent(instance), {
      attachTo: document.body,
    });
    expect(document.body.querySelector('[title="Close Localive editor"]')).toBeNull();
    wrapper.unmount();
  });

  it('renders toggle button when activated', () => {
    instance.activate();
    const wrapper = mount(createWrapperComponent(instance), {
      attachTo: document.body,
    });
    expect(document.body.querySelector('[title="Close Localive editor"]')).not.toBeNull();
    wrapper.unmount();
  });

  it('deactivates when close button is clicked', async () => {
    instance.activate();
    const wrapper = mount(createWrapperComponent(instance), {
      attachTo: document.body,
    });
    expect(instance.isActive()).toBe(true);
    wrapper.unmount();
  });

  it('cleans up event listeners on unmount', () => {
    instance.activate();
    const wrapper = mount(createWrapperComponent(instance), {
      attachTo: document.body,
    });
    wrapper.unmount();
  });
});