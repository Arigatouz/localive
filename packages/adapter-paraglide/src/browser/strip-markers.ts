import { untag } from '../runtime/index.js';

/** Keeps markers out of the clipboard and out of submitted forms while edit mode is on. */
export function stripMarkersFromCopiesAndForms(): () => void {
  document.addEventListener('copy', copyWithoutMarkers, true);
  document.addEventListener('formdata', submitWithoutMarkers, true);
  return () => {
    document.removeEventListener('copy', copyWithoutMarkers, true);
    document.removeEventListener('formdata', submitWithoutMarkers, true);
  };
}

function copyWithoutMarkers(event: Event): void {
  const selected = selectedText(event.target);
  const clipboard = (event as ClipboardEvent).clipboardData;
  if (!selected || !clipboard || untag(selected) === selected) return;

  clipboard.setData('text/plain', untag(selected));
  event.preventDefault();
}

function selectedText(target: EventTarget | null): string {
  const isField = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
  if (isField && target.selectionStart !== null && target.selectionEnd !== null) {
    return target.value.slice(target.selectionStart, target.selectionEnd);
  }
  return document.getSelection()?.toString() ?? '';
}

function submitWithoutMarkers(event: Event): void {
  const { formData } = event as FormDataEvent;
  const entries = [...formData];
  if (!entries.some(([, value]) => typeof value === 'string' && untag(value) !== value)) return;

  for (const name of new Set(entries.map(([entryName]) => entryName))) formData.delete(name);
  for (const [name, value] of entries) formData.append(name, typeof value === 'string' ? untag(value) : value);
}
