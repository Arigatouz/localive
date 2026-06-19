import { describe, expect, it } from 'vitest';
import { localeFromPath, sortedKeys } from './locale-utils';

describe('localeFromPath', () => {
  it('extracts locale from a simple JSON filename', () => {
    expect(localeFromPath('/project/src/locales/en.json')).toBe('en');
  });

  it('extracts locale from a Windows-style path', () => {
    expect(localeFromPath('C:\\project\\src\\locales\\fr.json')).toBe('fr');
  });

  it('extracts locale from a filename without a directory', () => {
    expect(localeFromPath('de.json')).toBe('de');
  });

  it('handles locale names with hyphens', () => {
    expect(localeFromPath('/locales/pt-BR.json')).toBe('pt-BR');
  });

  it('handles locale names with regions', () => {
    expect(localeFromPath('/locales/zh-Hans.json')).toBe('zh-Hans');
  });

  it('does not strip non-JSON extensions', () => {
    expect(localeFromPath('/locales/en.txt')).toBe('en.txt');
  });
});

describe('sortedKeys', () => {
  it('returns sorted unique keys', () => {
    expect(sortedKeys(['z', 'a', 'm', 'a'])).toEqual(['a', 'm', 'z']);
  });

  it('returns sorted keys from a Set', () => {
    const set = new Set(['z', 'a', 'm']);
    expect(sortedKeys(set)).toEqual(['a', 'm', 'z']);
  });

  it('returns an empty array for empty input', () => {
    expect(sortedKeys([])).toEqual([]);
  });

  it('returns a single key unchanged', () => {
    expect(sortedKeys(['only'])).toEqual(['only']);
  });
});