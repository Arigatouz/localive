import type { MessageReference } from '@localive/core';

const MARKER_START = '͏';
const FIRST_DIGIT = 0xfe00;
const MARKER_PATTERN = /͏[︀-️]{8}/g;

/** Nine invisible characters naming a message: a grapheme extender, then a 32-bit hash in variation selectors. */
export function markerFor(locale: string, key: string): string {
  const hash = hashText(`${locale}\0${key}`);
  let marker = MARKER_START;
  for (let shift = 28; shift >= 0; shift -= 4) {
    marker += String.fromCharCode(FIRST_DIGIT + ((hash >>> shift) & 15));
  }
  return marker;
}

/** Puts the marker after the last visible character, so trailing whitespace keeps collapsing. */
export function appendMarker(text: string, marker: string): string {
  const visibleText = text.trimEnd();
  return visibleText ? visibleText + marker + text.slice(visibleText.length) : text;
}

export function untag(text: string): string {
  return text.replace(MARKER_PATTERN, '');
}

export function indexMarkers(messages: Iterable<MessageReference>): Map<string, MessageReference> {
  const index = new Map<string, MessageReference>();
  for (const message of messages) index.set(markerFor(message.locale, message.key), message);
  return index;
}

export function findMarkedMessages(text: string, index: ReadonlyMap<string, MessageReference>): MessageReference[] {
  const found: MessageReference[] = [];
  for (const [marker] of text.matchAll(MARKER_PATTERN)) {
    const message = index.get(marker);
    if (message) found.push(message);
  }
  return found;
}

function hashText(text: string): number {
  let hash = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(text)) hash = Math.imul(hash ^ byte, 0x01000193) >>> 0;
  return hash;
}
