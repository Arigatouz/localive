<script lang="ts">
  import { getLocaliveContext } from './useLocaliveEditor';
  import type { Locale } from '@localive/core';

  const instance = getLocaliveContext();

  let isActive = $state(false);
  let overlayVisible = $state(true);

  $effect(() => {
    const unsub = instance.store.subscribe((s) => { isActive = s.active; });
    return unsub;
  });

  function toggle() {
    if (instance.isActive()) instance.deactivate();
    else instance.activate();
  }
</script>

{#if isActive}
  <div class="localive-overlay">
    <button class="localive-toggle" onclick={toggle} title="Toggle Localive">✎</button>
  </div>
{/if}

<style>
  .localive-overlay { position: fixed; bottom: 16px; right: 16px; z-index: 999999; }
  .localive-toggle { width: 48px; height: 48px; border-radius: 50%; border: none; background: #6366f1; color: #fff; font-size: 20px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
</style>