import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { scanTranslationFiles } from './file-scanner';
import type { ScannedFile } from './types';

describe('scanTranslationFiles', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `localive-test-scanner-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('finds all locale files in translationsPath', () => {
    mkdirSync(join(testDir, 'i18n'), { recursive: true });
    writeFileSync(join(testDir, 'i18n', 'en.json'), '{}');
    writeFileSync(join(testDir, 'i18n', 'fr.json'), '{}');
    writeFileSync(join(testDir, 'i18n', 'de.json'), '{}');

    const files = scanTranslationFiles({
      translationsPath: join(testDir, 'i18n'),
      locales: ['en', 'fr', 'de'],
    });

    expect(files).toHaveLength(3);
    expect(files.map((f: ScannedFile) => f.locale).sort()).toEqual(['de', 'en', 'fr']);
  });

  it('finds locale files across multiple searchRoots', () => {
    const root1 = join(testDir, 'i18n');
    const root2 = join(testDir, 'features', 'auth', 'i18n');
    mkdirSync(root1, { recursive: true });
    mkdirSync(root2, { recursive: true });

    writeFileSync(join(root1, 'en.json'), '{}');
    writeFileSync(join(root1, 'fr.json'), '{}');
    writeFileSync(join(root2, 'en.json'), '{}');
    writeFileSync(join(root2, 'fr.json'), '{}');

    const files = scanTranslationFiles({
      translationsPath: join(testDir, 'i18n'),
      searchRoots: [join(testDir, 'i18n'), join(testDir, 'features')],
      locales: ['en', 'fr'],
    });

    expect(files.length).toBeGreaterThanOrEqual(2);
    const enFiles = files.filter((f: ScannedFile) => f.locale === 'en');
    expect(enFiles.length).toBeGreaterThanOrEqual(2);
  });

  it('ignores non-JSON files', () => {
    mkdirSync(join(testDir, 'i18n'), { recursive: true });
    writeFileSync(join(testDir, 'i18n', 'en.json'), '{}');
    writeFileSync(join(testDir, 'i18n', 'readme.txt'), 'ignore me');
    writeFileSync(join(testDir, 'i18n', 'data.csv'), 'ignore me too');

    const files = scanTranslationFiles({
      translationsPath: join(testDir, 'i18n'),
      locales: ['en'],
    });

    expect(files).toHaveLength(1);
    expect(files[0].locale).toBe('en');
  });

  it('builds locale-to-filepath map', () => {
    mkdirSync(join(testDir, 'i18n'), { recursive: true });
    writeFileSync(join(testDir, 'i18n', 'en.json'), '{}');
    writeFileSync(join(testDir, 'i18n', 'fr.json'), '{}');

    const files = scanTranslationFiles({
      translationsPath: join(testDir, 'i18n'),
      locales: ['en', 'fr'],
    });

    expect(files[0].path).toContain('en.json');
    expect(files[1].path).toContain('fr.json');
  });

  it('handles missing directories gracefully', () => {
    const files = scanTranslationFiles({
      translationsPath: join(testDir, 'nonexistent'),
      locales: ['en'],
    });

    expect(files).toEqual([]);
  });

  it('only finds files for specified locales', () => {
    mkdirSync(join(testDir, 'i18n'), { recursive: true });
    writeFileSync(join(testDir, 'i18n', 'en.json'), '{}');
    writeFileSync(join(testDir, 'i18n', 'fr.json'), '{}');
    writeFileSync(join(testDir, 'i18n', 'de.json'), '{}');
    writeFileSync(join(testDir, 'i18n', 'ja.json'), '{}');

    const files = scanTranslationFiles({
      translationsPath: join(testDir, 'i18n'),
      locales: ['en', 'fr'],
    });

    expect(files).toHaveLength(2);
    expect(files.every((f: ScannedFile) => ['en', 'fr'].includes(f.locale))).toBe(true);
  });
});