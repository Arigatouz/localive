import type { MessageReference } from '@localive/core';

export interface MarkedElement {
  element: Element;
  messages: MessageReference[];
}

type Resolve = (element: HTMLElement) => MessageReference[];

/**
 * The element under the pointer with its messages, or the closest ancestor whose own text or
 * attributes render one, such as a button around a clicked icon. Messages of sibling branches
 * never count, and neither does Localive's own interface.
 */
export function findMarkedElement(target: EventTarget | null, resolve: Resolve): MarkedElement | null {
  if (!(target instanceof Element) || target.closest('[data-localive-ui]')) return null;

  const targetMessages = resolve(target as HTMLElement);
  if (targetMessages.length > 0) return { element: target, messages: targetMessages };

  let child = target;
  for (let element = target.parentElement; element && element !== document.body; element = element.parentElement) {
    const messages = resolve(element);
    if (messages.length > 0) {
      const ownMessages = withoutMessagesOfOtherChildren(messages, element, child, resolve);
      return ownMessages.length > 0 ? { element, messages: ownMessages } : null;
    }
    child = element;
  }
  return null;
}

function withoutMessagesOfOtherChildren(messages: MessageReference[], element: Element, pathChild: Element, resolve: Resolve) {
  const otherChildren = [...element.children].filter((child) => child !== pathChild);
  const ofOtherChildren = new Set(otherChildren.flatMap((child) => resolve(child as HTMLElement)).map(messageId));
  return messages.filter((message) => !ofOtherChildren.has(messageId(message)));
}

function messageId({ locale, key }: MessageReference): string {
  return `${locale}\0${key}`;
}
