const T_FUNCTION_PATTERN = /\bt\(\s*['"`]([^'"`]+)['"`]\s*\)/gu;
const DATA_I18N_KEY_PATTERN = /data-i18n-key\s*=\s*['"]([^'"]+)['"]/gu;
const ANGULAR_ATTR_PATTERN = /\[attr\.data-i18n-key\]\s*=\s*["']'([^"']+)'["']/gu;
const VUE_LOCALIVE_TAG_PATTERN = /v-localive-tag\s*=\s*["']'([^"']+)'["']/gu;

export interface KeyMatch {
  key: string;
  start: number;
  end: number;
}

export function getKeyAtPosition(
  document: { getText(): string; offsetAt(position: { line: number; character: number }): number },
  position: { line: number; character: number },
): KeyMatch | null {
  const offset = document.offsetAt(position);
  const text = document.getText();
  return findKeyAtOffset(text, offset);
}

export function findKeyAtOffset(text: string, offset: number): KeyMatch | null {
  const patterns = [
    T_FUNCTION_PATTERN,
    DATA_I18N_KEY_PATTERN,
    ANGULAR_ATTR_PATTERN,
    VUE_LOCALIVE_TAG_PATTERN,
  ];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    for (const match of matchAllSafe(pattern, text)) {
      if (match.index !== undefined && match[1] !== undefined) {
        const fullMatchStart = match.index;
        const fullMatchEnd = match.index + match[0].length;
        if (offset >= fullMatchStart && offset <= fullMatchEnd) {
          const keyStart = match.index + match[0].indexOf(match[1]);
          const keyEnd = keyStart + match[1].length;
          return {
            key: match[1],
            start: keyStart,
            end: keyEnd,
          };
        }
      }
    }
  }

  return null;
}

export function findAllKeys(text: string): KeyMatch[] {
  const results: KeyMatch[] = [];
  const patterns = [
    T_FUNCTION_PATTERN,
    DATA_I18N_KEY_PATTERN,
    ANGULAR_ATTR_PATTERN,
    VUE_LOCALIVE_TAG_PATTERN,
  ];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    for (const match of matchAllSafe(pattern, text)) {
      if (match.index !== undefined && match[1] !== undefined) {
        const keyStart = match.index + match[0].indexOf(match[1]);
        results.push({
          key: match[1],
          start: keyStart,
          end: keyStart + match[1].length,
        });
      }
    }
  }

  return results;
}

function matchAllSafe(pattern: RegExp, text: string): RegExpMatchArray[] {
  const results: RegExpMatchArray[] = [];
  const cloned = new RegExp(pattern.source, pattern.flags);
  let match: RegExpExecArray | null;
  while ((match = cloned.exec(text)) !== null) {
    results.push(match);
  }
  return results;
}