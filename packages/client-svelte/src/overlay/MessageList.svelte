<script lang="ts">
  import type { MessageReference } from '@localive/core';

  let {
    title,
    messages,
    onPick,
  }: { title: string; messages: MessageReference[]; onPick: (message: MessageReference) => void } = $props();

  function focusFirst(list: HTMLElement) {
    list.querySelector('button')?.focus();
  }
</script>

<div class="localive-card" role="dialog" aria-label={title}>
  <h2 class="localive-title">{title}</h2>
  {#if messages.length === 0}
    <p class="localive-note">No editable messages found.</p>
  {:else}
    <ul class="localive-list" use:focusFirst>
      {#each messages as message (`${message.locale}\0${message.key}`)}
        <li>
          <button type="button" class="localive-item" onclick={() => onPick(message)}>
            <span class="localive-key">{message.key}</span>
            <span class="localive-locale">{message.locale}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .localive-card {
    width: min(360px, calc(100vw - 32px));
    max-height: 60vh;
    overflow: auto;
    padding: 12px;
    border: 1px solid var(--localive-border);
    border-radius: 10px;
    background: var(--localive-surface);
    box-shadow: 0 12px 32px rgb(0 0 0 / 0.25);
  }

  .localive-title {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
  }

  .localive-note {
    margin: 0;
    color: var(--localive-muted);
  }

  .localive-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .localive-item {
    display: flex;
    width: 100%;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 8px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .localive-item:hover,
  .localive-item:focus-visible {
    background: var(--localive-accent-wash);
    outline: none;
  }

  .localive-key {
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    overflow-wrap: anywhere;
  }

  .localive-locale {
    color: var(--localive-muted);
  }
</style>
