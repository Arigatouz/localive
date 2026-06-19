import { vi } from 'vitest';

export function createMockElement(overrides?: Partial<HTMLElement>): HTMLElement {
  const el = document.createElement('div');
  if (overrides) {
    Object.assign(el, overrides);
  }
  return el;
}

export function createMockElementWithTranslation(key: string, text: string): HTMLElement {
  const el = document.createElement('span');
  el.textContent = text;
  el.setAttribute('data-i18n-key', key);
  return el;
}

export function createMockComment(text: string): Comment {
  return document.createComment(text);
}

export function attachToBody(element: HTMLElement | Comment): void {
  document.body.appendChild(element);
}

export function removeFromDOM(element: HTMLElement | Comment): void {
  if (element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

export function waitFor(fn: () => void, timeout = 1000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      try {
        fn();
        clearInterval(interval);
        resolve();
      } catch {
        if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject(new Error('waitFor timeout'));
        }
      }
    }, 50);
  });
}