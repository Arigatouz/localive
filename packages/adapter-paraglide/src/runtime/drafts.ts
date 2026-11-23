/** Matches Svelte's `createSubscriber` from `svelte/reactivity`, which makes draft reads reactive. */
export type SubscriberFactory = (start: (update: () => void) => () => void) => () => void;

interface DraftStore {
  drafts: Map<string, string>;
  updates: Set<() => void>;
  track: () => void;
}

const DRAFT_STORE = Symbol.for('localive.paraglide.drafts');

// Held globally so that a bundler loading this module twice still shares one set of drafts.
const store: DraftStore = ((globalThis as { [DRAFT_STORE]?: DraftStore })[DRAFT_STORE] ??= {
  drafts: new Map(),
  updates: new Set(),
  track: () => {},
});

export function useSubscriber(createSubscriber: SubscriberFactory): void {
  store.track = createSubscriber((update) => {
    store.updates.add(update);
    return () => store.updates.delete(update);
  });
}

export function setDraft(locale: string, key: string, value: string | null): void {
  if (value === null) store.drafts.delete(draftId(locale, key));
  else store.drafts.set(draftId(locale, key), value);
  notify();
}

export function clearDrafts(): void {
  store.drafts.clear();
  notify();
}

/** Returns the draft with its `{name}` placeholders filled from the inputs, or undefined without one. */
export function readDraft(locale: string, key: string, inputs: unknown): string | undefined {
  store.track();
  const draft = store.drafts.get(draftId(locale, key));
  if (draft === undefined) return undefined;

  const values = (inputs ?? {}) as Record<string, unknown>;
  return draft.replace(/\\([{}\\])|\{([^{}]+)\}/g, (match, escaped: string | undefined, placeholder?: string) => {
    if (escaped) return escaped;
    const name = placeholder!.split(':')[0].trim();
    return Object.hasOwn(values, name) ? String(values[name]) : match;
  });
}

function draftId(locale: string, key: string): string {
  return `${locale}\0${key}`;
}

function notify(): void {
  for (const update of store.updates) update();
}
