<script lang="ts">
  import { LiveEditorOverlay } from '@localive/svelte';
  import { switchLocale } from './main';
  import type { SvelteLocaliveState } from '@localive/svelte';

  let { localiveState }: { localiveState: SvelteLocaliveState } = $props();

  let currentLocale = $state('en');
  let isActive = $state(false);

  (() => localiveState.isActive).call(null).subscribe((v: boolean) => {
    isActive = v;
  });

  (() => localiveState.currentLocale).call(null).subscribe((v: string) => {
    currentLocale = v;
  });

  const translations = $derived(
    (() => localiveState.instance).call(null).getTranslations(currentLocale) as Record<string, string>
  );

  function t(key: string): string {
    return translations[key] ?? key;
  }

  function handleSwitchLocale(locale: string) {
    switchLocale(locale);
  }

  function handleToggle() {
    if (isActive) {
      (() => localiveState.instance).call(null).deactivate();
    } else {
      (() => localiveState.instance).call(null).activate();
    }
  }
</script>

<div>
  <header style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
    <h1 data-i18n-key="app.title">{t('app.title')}</h1>
    <button
      onclick={handleToggle}
      style="margin-left: 8px; background-color: {isActive ? '#ef4444' : '#22c55e'}; color: white; border: none; border-radius: 4px; padding: 8px 16px; cursor: pointer;"
    >
      {isActive ? '✕ Close Editor' : '✎ Open Editor'}
    </button>
  </header>

  <p style="color: #64748b; margin-bottom: 16px;">
    <span data-i18n-key="app.subtitle">{t('app.subtitle')}</span>
  </p>

  <nav>
    <button class:active={currentLocale === 'en'} onclick={() => handleSwitchLocale('en')}>English</button>
    <button class:active={currentLocale === 'fr'} onclick={() => handleSwitchLocale('fr')}>Français</button>
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
