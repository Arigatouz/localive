<script lang="ts">
  import { LiveEditorOverlay, initLocalive, getLocaliveState } from '@localive/svelte';
  import { translations, currentLocale, getLocaleCallbacks, switchLocale } from './main';
  import type { I18nAdapter } from '@localive/core';

  const adapter: I18nAdapter = {
    name: 'svelte-playground',
    getLocale() { return currentLocale; },
    getTranslations(locale: string) {
      return translations[locale] ?? {};
    },
    onLocaleChange(callback: (locale: string) => void) {
      getLocaleCallbacks().push(callback);
      return () => {
        const idx = getLocaleCallbacks().indexOf(callback);
        if (idx > -1) getLocaleCallbacks().splice(idx, 1);
      };
    },
    destroy() { getLocaleCallbacks().length = 0; },
  };

  initLocalive(adapter, {
    locales: ['en', 'fr'],
    defaultLocale: 'en',
    activeByDefault: true,
  });

  const { instance, isActive, currentLocale: localeStore } = getLocaliveState();

  let isActiveState = $state(instance.isActive());
  let currentLocaleState = $state(instance.store.locale);

  isActive.subscribe((v: boolean) => { isActiveState = v; });
  localeStore.subscribe((v: string) => { currentLocaleState = v; });

  const translations2 = $derived(instance.getTranslations(currentLocaleState) as Record<string, string>);

  function t(key: string): string {
    return translations2[key] ?? key;
  }

  function handleSwitchLocale(locale: string) {
    switchLocale(locale);
  }

  function handleToggle() {
    if (instance.isActive()) {
      instance.deactivate();
    } else {
      instance.activate();
    }
  }
</script>

<div>
  <header style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
    <h1 data-i18n-key="app.title">{t('app.title')}</h1>
    <button
      onclick={handleToggle}
      style="margin-left: 8px; background-color: {isActiveState ? '#ef4444' : '#22c55e'}; color: white; border: none; border-radius: 4px; padding: 8px 16px; cursor: pointer;"
    >
      {isActiveState ? '✕ Close Editor' : '✎ Open Editor'}
    </button>
  </header>

  <p style="color: #64748b; margin-bottom: 16px;">
    <span data-i18n-key="app.subtitle">{t('app.subtitle')}</span>
  </p>

  <nav>
    <button class:active={currentLocaleState === 'en'} onclick={() => handleSwitchLocale('en')}>English</button>
    <button class:active={currentLocaleState === 'fr'} onclick={() => handleSwitchLocale('fr')}>Français</button>
  </nav>

  <div class="card" style="margin-top: 16px;">
    <h2><span data-i18n-key="card.welcome">{t('card.welcome')}</span></h2>
    <p><span data-i18n-key="card.description">{t('card.description')}</span></p>
  </div>

  <footer style="margin-top: 24px; color: #94a3b8; font-size: 14px;">
    <span data-i18n-key="footer.rights">{t('footer.rights')}</span>
  </footer>

  <LiveEditorOverlay />
</div>