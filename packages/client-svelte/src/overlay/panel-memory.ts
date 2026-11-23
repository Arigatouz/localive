import type { MessageReference } from '@localive/core';

const STORAGE_KEY = 'localive:open-message';

/** Keeps the open message across the page reload that follows a save. */
export function rememberOpenMessage(message: MessageReference | null): void {
  try {
    if (message) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(message));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable, for example in private windows; the panel then simply stays closed.
  }
}

export function recallOpenMessage(): MessageReference | null {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
    const isMessage =
      typeof stored === 'object' &&
      stored !== null &&
      typeof (stored as MessageReference).key === 'string' &&
      typeof (stored as MessageReference).locale === 'string';
    return isMessage ? (stored as MessageReference) : null;
  } catch {
    return null;
  }
}
