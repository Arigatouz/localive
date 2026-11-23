<script lang="ts">
  import { createLocalive, type I18nAdapter, type I18nLiveInstance, type Locale } from '@localive/core';
  import { onMount } from 'svelte';
  import LiveEditorOverlay from './LiveEditorOverlay.svelte';

  let {
    createAdapter,
    locales,
    defaultLocale = locales[0],
    endpoint,
  }: {
    /** Runs in the browser after mounting, so adapters may load data such as a message catalog. */
    createAdapter: () => I18nAdapter | Promise<I18nAdapter>;
    locales: Locale[];
    defaultLocale?: Locale;
    endpoint?: string;
  } = $props();

  let instance = $state.raw<I18nLiveInstance | null>(null);
  let error = $state<string | null>(null);

  onMount(() => {
    let isUnmounted = false;
    let created: I18nLiveInstance | undefined;

    Promise.resolve()
      .then(createAdapter)
      .then((adapter) => {
        if (isUnmounted) return adapter.destroy?.();
        created = createLocalive({ translationsPath: '', adapter, locales, defaultLocale, endpoint });
        instance = created;
      })
      .catch((reason: unknown) => {
        error = reason instanceof Error ? reason.message : String(reason);
      });

    return () => {
      isUnmounted = true;
      created?.destroy();
    };
  });
</script>

{#if instance}
  <LiveEditorOverlay {instance} {locales} />
{:else if error}
  <p class="localive-unavailable" role="alert" data-localive-ui>Localive is unavailable: {error}</p>
{/if}

<style>
  .localive-unavailable {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 2147483646;
    max-width: min(420px, calc(100vw - 32px));
    margin: 0;
    padding: 8px 12px;
    border-radius: 8px;
    background: #7f1d1d;
    color: #fff;
    font: 13px/1.4 system-ui, sans-serif;
  }
</style>
