<script lang="ts">
  import type { I18nLiveInstance, Locale } from '@localive/core';
  import { buildMessageFields, type MessageField } from './message-fields.js';

  interface FieldStatus {
    isSaving?: boolean;
    isSaved?: boolean;
    error?: string;
  }

  let {
    instance,
    messageKey,
    firstLocale,
    locales,
    onClose,
  }: { instance: I18nLiveInstance; messageKey: string; firstLocale: Locale; locales: Locale[]; onClose: () => void } = $props();

  const fields = $derived(buildMessageFields(messageKey, locales, firstLocale, (locale) => instance.getTranslations(locale)));
  const values = $state<Record<string, string>>({});
  const statuses = $state<Record<string, FieldStatus>>({});
  // Saved text becomes the expected value of the next save, as the store is not reactive.
  const savedTexts: Record<string, string> = {};

  function focusOnMount(textarea: HTMLTextAreaElement, shouldFocus: boolean) {
    if (shouldFocus) textarea.focus();
  }

  function valueOf(field: MessageField): string {
    return values[field.id] ?? field.original ?? '';
  }

  function edit(field: MessageField, value: string) {
    values[field.id] = value;
    statuses[field.id] = {};
    if (field.variant === undefined) instance.previewTranslation({ key: messageKey, value, locale: field.locale });
  }

  async function save(field: MessageField) {
    statuses[field.id] = { isSaving: true };
    const value = valueOf(field);
    const result = await instance.saveTranslation({
      key: messageKey,
      value,
      locale: field.locale,
      variant: field.variant,
      expected: savedTexts[field.id] ?? field.original,
    });
    if (result.success) savedTexts[field.id] = value;
    statuses[field.id] = result.success ? { isSaved: true } : { error: result.error ?? 'Save failed' };
  }

  function handleKeydown(event: KeyboardEvent, field: MessageField) {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    save(field);
  }
</script>

<div class="localive-card" role="dialog" aria-label="Edit {messageKey}">
  <div class="localive-header">
    <h2 class="localive-key">{messageKey}</h2>
    <button type="button" class="localive-close" aria-label="Close" onclick={onClose}>×</button>
  </div>

  {#each fields as field, index (field.id)}
    {@const status = statuses[field.id] ?? {}}
    <div class="localive-field">
      <label for="localive-field-{index}">
        <span class="localive-locale">{field.locale}</span>
        {#if field.variant}<span class="localive-variant">{field.variant}</span>{/if}
        {#if field.original === null && !status.isSaved}<span class="localive-missing">missing</span>{/if}
      </label>
      <textarea
        id="localive-field-{index}"
        rows="2"
        value={valueOf(field)}
        oninput={(event) => edit(field, event.currentTarget.value)}
        onkeydown={(event) => handleKeydown(event, field)}
        use:focusOnMount={index === 0}
      ></textarea>
      <div class="localive-actions">
        <span class="localive-status" role="status" aria-live="polite">
          {#if status.error}<span class="localive-error">{status.error}</span>{:else if status.isSaved}Saved{/if}
        </span>
        <button type="button" class="localive-save" disabled={status.isSaving} onclick={() => save(field)}>
          {status.isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  {/each}
  <p class="localive-hint">Enter saves, Shift+Enter adds a line, Esc closes.</p>
</div>

<style>
  .localive-card {
    width: min(420px, calc(100vw - 32px));
    max-height: 70vh;
    overflow: auto;
    padding: 12px;
    border: 1px solid var(--localive-border);
    border-radius: 10px;
    background: var(--localive-surface);
    box-shadow: 0 12px 32px rgb(0 0 0 / 0.25);
  }

  .localive-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }

  .localive-key {
    margin: 0;
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    font-size: 13px;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .localive-close {
    padding: 0 6px;
    border: 0;
    background: none;
    color: var(--localive-muted);
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
  }

  .localive-field {
    margin-top: 10px;
  }

  label {
    display: flex;
    gap: 6px;
    margin-bottom: 4px;
    font-size: 12px;
  }

  .localive-locale {
    font-weight: 600;
  }

  .localive-variant {
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    color: var(--localive-muted);
  }

  .localive-missing {
    color: var(--localive-warning);
  }

  textarea {
    box-sizing: border-box;
    width: 100%;
    min-height: 44px;
    padding: 6px 8px;
    border: 1px solid var(--localive-border);
    border-radius: 6px;
    background: var(--localive-input);
    color: inherit;
    font: inherit;
    resize: vertical;
  }

  textarea:focus {
    border-color: var(--localive-accent);
    outline: 2px solid var(--localive-accent-wash);
  }

  .localive-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 4px;
  }

  .localive-status {
    font-size: 12px;
    color: var(--localive-muted);
  }

  .localive-error {
    color: var(--localive-danger);
  }

  .localive-save {
    padding: 4px 12px;
    border: 0;
    border-radius: 6px;
    background: var(--localive-accent);
    color: #fff;
    font: inherit;
    cursor: pointer;
  }

  .localive-save:disabled {
    opacity: 0.6;
    cursor: progress;
  }

  .localive-hint {
    margin: 10px 0 0;
    font-size: 11px;
    color: var(--localive-muted);
  }
</style>
