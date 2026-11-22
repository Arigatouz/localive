export interface PatternParts {
  placeholders: Set<string>;
  /** Markup in order of appearance; standalone tags are omitted as they open nothing. */
  markup: { name: string; isClosing: boolean }[];
}

/** Lists the placeholders and markup of an inlang message pattern; an unclosed `{` is literal text, as in the plugin. */
export function readPattern(pattern: string): PatternParts {
  const parts: PatternParts = { placeholders: new Set(), markup: [] };

  for (let index = 0; index < pattern.length; index++) {
    if (pattern[index] === '\\') {
      index++;
      continue;
    }
    if (pattern[index] !== '{') continue;

    const end = findClosingBrace(pattern, index + 1);
    if (end === -1) break;
    recordPlaceholder(pattern.slice(index + 1, end).trim(), parts);
    index = end;
  }
  return parts;
}

/** Names a pattern may use: the inputs and local variables a message declares. */
export function declaredNames(declarations: string[]): string[] {
  return declarations.map((declaration) => declaration.replace(/^(input|local)\s+/, '').split(/[\s=]/)[0]);
}

/**
 * Explains why a new pattern would break the message, or returns undefined.
 * Only placeholders and markup already used by the message in some locale are allowed.
 */
export function findPatternProblem(pattern: string, allowedNames: Set<string>, allowedTags: Set<string>): string | undefined {
  const { placeholders, markup } = readPattern(pattern);

  const unknownName = [...placeholders].find((name) => !allowedNames.has(name));
  if (unknownName) return `{${unknownName}} is not an input of this message`;

  const openTags: string[] = [];
  for (const { name, isClosing } of markup) {
    if (!allowedTags.has(name)) return `{#${name}} is not markup this message uses`;
    if (!isClosing) openTags.push(name);
    else if (openTags.pop() !== name) return `{/${name}} does not close the markup opened before it`;
  }
  if (openTags.length > 0) return `{#${openTags[openTags.length - 1]}} is never closed`;
  return undefined;
}

function findClosingBrace(pattern: string, from: number): number {
  for (let index = from; index < pattern.length; index++) {
    if (pattern[index] === '\\') index++;
    else if (pattern[index] === '}') return index;
  }
  return -1;
}

function recordPlaceholder(content: string, parts: PatternParts): void {
  if (content.startsWith('|')) return;

  const markup = content.match(/^([#/])([^\s/}]+)/);
  if (!markup) {
    parts.placeholders.add(content.split(':')[0].trim());
    return;
  }

  const isStandalone = content.endsWith('/') && markup[1] === '#';
  if (!isStandalone) parts.markup.push({ name: markup[2], isClosing: markup[1] === '/' });
}
