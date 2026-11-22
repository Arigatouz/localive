import { readDraft } from './drafts';
import { isEditing } from './edit-mode';
import { appendMarker, markerFor } from './message-marker';

interface MessageOptions {
  locale?: string;
}

interface MessagePart {
  type: string;
  value?: string;
}

type MessageFunction = ((inputs?: never, options?: MessageOptions) => string) & {
  parts?: (inputs?: never, options?: MessageOptions) => MessagePart[];
};

/** Wraps a compiled Paraglide message so that, in edit mode, its output names the message it came from. */
export function tag<Message extends MessageFunction>(key: string, message: Message, getLocale: () => string): Message {
  const tagged = ((inputs?: never, options?: MessageOptions) => {
    if (!isEditing()) return message(inputs, options);

    const locale = options?.locale ?? getLocale();
    const text = readDraft(locale, key, inputs) ?? message(inputs, options);
    return appendMarker(text, markerFor(locale, key));
  }) as Message;
  Object.assign(tagged, message);

  const { parts } = message;
  if (parts) {
    tagged.parts = (inputs?: never, options?: MessageOptions) => {
      if (!isEditing()) return parts(inputs, options);

      const marker = markerFor(options?.locale ?? getLocale(), key);
      return parts(inputs, options).map((part) =>
        part.type === 'text' && part.value ? { ...part, value: appendMarker(part.value, marker) } : part,
      );
    };
  }

  return tagged;
}
