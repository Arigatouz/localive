<script lang="ts">
  import type { I18nLiveInstance, Locale, MessageReference } from '@localive/core';
  import { onMount } from 'svelte';
  import {
    findMarkedElement,
    HoverHighlight,
    MessageList,
    MessagePanel,
    recallOpenMessage,
    rememberOpenMessage,
  } from './overlay/index.js';
  import { getLocaliveContext } from './useLocaliveEditor.svelte.js';

  let { instance = getLocaliveContext(), locales }: { instance?: I18nLiveInstance; locales?: Locale[] } = $props();

  let isActive = $state(false);
  let hovered = $state<Element | null>(null);
  let openMessage = $state<MessageReference | null>(null);
  let choices = $state<MessageReference[] | null>(null);
  let pageMessages = $state<MessageReference[] | null>(null);
  let toggleButton: HTMLButtonElement;
  let focusBeforeOpening: HTMLElement | null = null;

  const editableLocales = $derived(locales ?? [...instance.store.dictionaries.keys()]);

  $effect.pre(() => {
    isActive = instance.isActive();
    return instance.store.subscribe((state) => (isActive = state.active));
  });

  onMount(() => {
    const remembered = recallOpenMessage();
    if (remembered && instance.isActive()) openMessage = remembered;
  });

  $effect(() => {
    if (!isActive) return;
    window.addEventListener('pointerover', handlePointerOver, true);
    window.addEventListener('click', handleClick, true);
    return () => {
      window.removeEventListener('pointerover', handlePointerOver, true);
      window.removeEventListener('click', handleClick, true);
      hovered = null;
    };
  });

  function resolve(element: HTMLElement): MessageReference[] {
    return instance.resolveMessages(element);
  }

  function handlePointerOver(event: PointerEvent) {
    hovered = findMarkedElement(event.target, resolve)?.element ?? null;
  }

  // Alt+click reaches the page, so links and buttons stay usable in edit mode.
  function handleClick(event: MouseEvent) {
    if (event.altKey) return;
    const marked = findMarkedElement(event.target, resolve);
    if (!marked) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    focusBeforeOpening = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (marked.messages.length === 1) open(marked.messages[0]);
    else choices = marked.messages;
  }

  function open(message: MessageReference) {
    choices = null;
    pageMessages = null;
    openMessage = message;
    rememberOpenMessage(message);
  }

  function close() {
    const wasOpen = openMessage || choices || pageMessages;
    openMessage = null;
    choices = null;
    pageMessages = null;
    instance.previewTranslation(null);
    rememberOpenMessage(null);
    if (wasOpen) (focusBeforeOpening?.isConnected && focusBeforeOpening !== document.body ? focusBeforeOpening : toggleButton).focus();
  }

  function togglePageMessages() {
    if (pageMessages) return close();
    focusBeforeOpening = toggleButton;
    const unique = new Map(resolve(document.documentElement).map((message) => [`${message.locale}\0${message.key}`, message]));
    openMessage = null;
    choices = null;
    pageMessages = [...unique.values()];
  }

  function toggleEditMode() {
    if (!isActive) return instance.activate();
    close();
    instance.deactivate();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && (openMessage || choices || pageMessages)) close();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="localive" data-localive-ui>
  {#if isActive && hovered}
    <HoverHighlight element={hovered} />
  {/if}

  <div class="localive-dock">
    {#if openMessage}
      {#key `${openMessage.locale}\0${openMessage.key}`}
        <MessagePanel
          {instance}
          messageKey={openMessage.key}
          firstLocale={openMessage.locale}
          locales={editableLocales}
          onClose={close}
        />
      {/key}
    {:else if choices}
      <MessageList title="Several messages are here" messages={choices} onPick={open} />
    {:else if pageMessages}
      <MessageList title="Messages on this page" messages={pageMessages} onPick={open} />
    {/if}

    <div class="localive-toolbar">
      {#if isActive}
        <button type="button" class="localive-button" aria-pressed={pageMessages !== null} onclick={togglePageMessages}>
          Messages on this page
        </button>
      {/if}
      <button
        type="button"
        class="localive-button localive-toggle"
        aria-pressed={isActive}
        bind:this={toggleButton}
        onclick={toggleEditMode}
      >
        {isActive ? 'Done editing' : 'Edit translations'}
      </button>
    </div>
  </div>
</div>

<style>
  .localive {
    --localive-accent: #4f46e5;
    --localive-accent-wash: rgb(79 70 229 / 0.12);
    --localive-surface: #ffffff;
    --localive-input: #ffffff;
    --localive-text: #111827;
    --localive-muted: #6b7280;
    --localive-border: #d1d5db;
    --localive-danger: #b91c1c;
    --localive-warning: #b45309;

    color: var(--localive-text);
    font: 14px/1.4 system-ui, -apple-system, 'Segoe UI', sans-serif;
    letter-spacing: normal;
    text-align: left;
  }

  @media (prefers-color-scheme: dark) {
    .localive {
      --localive-accent: #818cf8;
      --localive-accent-wash: rgb(129 140 248 / 0.18);
      --localive-surface: #1f2937;
      --localive-input: #111827;
      --localive-text: #f9fafb;
      --localive-muted: #9ca3af;
      --localive-border: #374151;
      --localive-danger: #fca5a5;
      --localive-warning: #fcd34d;
    }
  }

  .localive-dock {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 2147483646;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }

  .localive-toolbar {
    display: flex;
    gap: 8px;
  }

  .localive-button {
    padding: 8px 14px;
    border: 1px solid var(--localive-border);
    border-radius: 999px;
    background: var(--localive-surface);
    color: inherit;
    font: inherit;
    cursor: pointer;
    box-shadow: 0 4px 12px rgb(0 0 0 / 0.15);
  }

  .localive-toggle[aria-pressed='true'] {
    border-color: var(--localive-accent);
    background: var(--localive-accent);
    color: #fff;
  }

  .localive-button:focus-visible {
    outline: 2px solid var(--localive-accent);
    outline-offset: 2px;
  }
</style>
