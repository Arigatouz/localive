import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanupDir, createTempDir } from '../../../tools/testing';
import { generateTypes } from './types';

describe('generateTypes', () => {
  let tempDir = '';

  afterEach(() => {
    if (tempDir) {
      cleanupDir(tempDir);
      tempDir = '';
    }
  });

  it('writes a TranslationKey declaration file from locale json', () => {
    tempDir = createTempDir('localive-cli-types-');
    const localesDir = join(tempDir, 'src/locales');
    mkdirSync(localesDir, { recursive: true });

    writeFileSync(join(localesDir, 'en.json'), JSON.stringify({
      en: {
        'app.title': 'Title',
        'app.subtitle': 'Subtitle',
      },
    }, null, 2), 'utf-8');

    const result = generateTypes({ cwd: tempDir, outFile: 'generated/localive.d.ts' });
    const output = readFileSync(result.outFile, 'utf-8');

    expect(result.keys).toEqual(['app.subtitle', 'app.title']);
    expect(output).toContain("export type TranslationKey =");
    expect(output).toContain("| 'app.subtitle'");
    expect(output).toContain("| 'app.title'");
  });
});
