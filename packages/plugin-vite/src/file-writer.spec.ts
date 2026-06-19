import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { writeTranslationToFile } from './file-writer';
import type { TranslationEntry } from './types';

describe('writeTranslationToFile', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `localive-test-writer-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('writes to correct locale file in searchRoot', () => {
    mkdirSync(join(testDir, 'i18n'), { recursive: true });
    const enPath = join(testDir, 'i18n', 'en.json');
    writeFileSync(enPath, JSON.stringify({ 'common.greeting': 'Hello' }, null, 2) + '\n');

    const entry: TranslationEntry = { key: 'common.farewell', value: 'Goodbye', locale: 'en' };

    const result = writeTranslationToFile(entry, [join(testDir, 'i18n')], join(testDir, 'i18n'));

    expect(result.success).toBe(true);
    expect(result.filePath).toBe(enPath);

    const content = JSON.parse(readFileSync(enPath, 'utf-8'));
    expect(content['common.greeting']).toBe('Hello');
    expect(content['common.farewell']).toBe('Goodbye');
  });

  it('falls back to defaultPath when key is new and no file contains it', () => {
    mkdirSync(join(testDir, 'i18n'), { recursive: true });
    const enPath = join(testDir, 'i18n', 'en.json');
    writeFileSync(enPath, JSON.stringify({ 'common.greeting': 'Hello' }, null, 2) + '\n');

    const entry: TranslationEntry = { key: 'new.feature.title', value: 'New Feature', locale: 'en' };

    const result = writeTranslationToFile(entry, [join(testDir, 'i18n')], join(testDir, 'i18n'));

    expect(result.success).toBe(true);
    const content = JSON.parse(readFileSync(enPath, 'utf-8'));
    expect(content['new.feature.title']).toBe('New Feature');
  });

  it('handles feature-split translation folders', () => {
    const mainDir = join(testDir, 'i18n');
    const featureDir = join(testDir, 'features', 'auth', 'i18n');
    mkdirSync(mainDir, { recursive: true });
    mkdirSync(featureDir, { recursive: true });

    writeFileSync(join(mainDir, 'en.json'), '{}');
    writeFileSync(join(featureDir, 'en.json'), JSON.stringify({ 'auth.login': 'Log In' }, null, 2) + '\n');

    const entry: TranslationEntry = { key: 'auth.login', value: 'Sign In', locale: 'en' };

    const result = writeTranslationToFile(entry, [mainDir, join(testDir, 'features')], mainDir);

    expect(result.success).toBe(true);
    const content = JSON.parse(readFileSync(join(featureDir, 'en.json'), 'utf-8'));
    expect(content['auth.login']).toBe('Sign In');
  });

  it('preserves existing key order', () => {
    mkdirSync(join(testDir, 'i18n'), { recursive: true });
    const enPath = join(testDir, 'i18n', 'en.json');
    const original = {
      'a.first': 'First',
      'b.second': 'Second',
      'c.third': 'Third',
    };
    writeFileSync(enPath, JSON.stringify(original, null, 2) + '\n');

    const entry: TranslationEntry = { key: 'b.second', value: 'Updated Second', locale: 'en' };
    writeTranslationToFile(entry, [join(testDir, 'i18n')], join(testDir, 'i18n'));

    const content = JSON.parse(readFileSync(enPath, 'utf-8'));
    const keys = Object.keys(content);
    expect(keys).toEqual(['a.first', 'b.second', 'c.third']);
    expect(content['b.second']).toBe('Updated Second');
  });

  it('preserves 2-space indentation', () => {
    mkdirSync(join(testDir, 'i18n'), { recursive: true });
    const enPath = join(testDir, 'i18n', 'en.json');
    writeFileSync(enPath, '{\n  "hello": "World"\n}\n');

    const entry: TranslationEntry = { key: 'hello', value: 'Universe', locale: 'en' };
    writeTranslationToFile(entry, [join(testDir, 'i18n')], join(testDir, 'i18n'));

    const raw = readFileSync(enPath, 'utf-8');
    expect(raw).toContain('  "hello": "Universe"');
  });

  it('preserves 4-space indentation', () => {
    mkdirSync(join(testDir, 'i18n'), { recursive: true });
    const enPath = join(testDir, 'i18n', 'en.json');
    writeFileSync(enPath, '{\n    "hello": "World"\n}\n');

    const entry: TranslationEntry = { key: 'hello', value: 'Universe', locale: 'en' };
    writeTranslationToFile(entry, [join(testDir, 'i18n')], join(testDir, 'i18n'));

    const raw = readFileSync(enPath, 'utf-8');
    expect(raw).toContain('    "hello": "Universe"');
  });

  it('preserves trailing newline', () => {
    mkdirSync(join(testDir, 'i18n'), { recursive: true });
    const enPath = join(testDir, 'i18n', 'en.json');
    writeFileSync(enPath, '{\n  "hello": "World"\n}\n');

    const entry: TranslationEntry = { key: 'hello', value: 'Universe', locale: 'en' };
    writeTranslationToFile(entry, [join(testDir, 'i18n')], join(testDir, 'i18n'));

    const raw = readFileSync(enPath, 'utf-8');
    expect(raw.endsWith('\n')).toBe(true);
  });

  it('creates nested key structure (a.b.c)', () => {
    mkdirSync(join(testDir, 'i18n'), { recursive: true });
    const enPath = join(testDir, 'i18n', 'en.json');
    writeFileSync(enPath, '{}');

    const entry: TranslationEntry = { key: 'app.home.title', value: 'Welcome', locale: 'en' };
    writeTranslationToFile(entry, [join(testDir, 'i18n')], join(testDir, 'i18n'));

    const content = JSON.parse(readFileSync(enPath, 'utf-8'));
    expect(content['app.home.title']).toBe('Welcome');
  });

  it('replaces existing value without reordering keys', () => {
    mkdirSync(join(testDir, 'i18n'), { recursive: true });
    const enPath = join(testDir, 'i18n', 'en.json');
    writeFileSync(enPath, JSON.stringify({ a: '1', b: '2', c: '3' }, null, 2) + '\n');

    const entry: TranslationEntry = { key: 'b', value: 'updated', locale: 'en' };
    writeTranslationToFile(entry, [join(testDir, 'i18n')], join(testDir, 'i18n'));

    const content = JSON.parse(readFileSync(enPath, 'utf-8'));
    expect(Object.keys(content)).toEqual(['a', 'b', 'c']);
    expect(content.b).toBe('updated');
    expect(content.a).toBe('1');
    expect(content.c).toBe('3');
  });

  it('throws for path outside allowed roots', () => {
    mkdirSync(join(testDir, 'i18n'), { recursive: true });
    const enPath = join(testDir, 'i18n', 'en.json');
    writeFileSync(enPath, '{}');

    const entry: TranslationEntry = { key: 'hello', value: 'World', locale: 'en', filePath: '/etc/passwd' };

    const result = writeTranslationToFile(entry, [join(testDir, 'i18n')], join(testDir, 'i18n'));

    expect(result.success).toBe(false);
    expect(result.error).toContain('outside');
  });
});