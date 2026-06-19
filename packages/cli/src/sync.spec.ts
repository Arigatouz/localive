import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanupDir, createTempDir } from '../../../tools/testing';
import { syncLocaleFiles } from './sync';

describe('syncLocaleFiles', () => {
  let tempDir = '';

  afterEach(() => {
    if (tempDir) {
      cleanupDir(tempDir);
      tempDir = '';
    }
  });

  it('adds missing keys and can copy values from a source locale', () => {
    tempDir = createTempDir('localive-cli-sync-');
    const srcDir = join(tempDir, 'src');
    const localesDir = join(srcDir, 'locales');
    mkdirSync(localesDir, { recursive: true });

    writeFileSync(join(srcDir, 'App.tsx'), `
      export function App() {
        return <div>{t('app.title')}{t('app.subtitle')}</div>;
      }
    `, 'utf-8');

    writeFileSync(join(localesDir, 'en.json'), JSON.stringify({
      en: {
        'app.title': 'Title',
        'app.subtitle': 'Subtitle',
      },
    }, null, 2), 'utf-8');

    writeFileSync(join(localesDir, 'fr.json'), JSON.stringify({
      fr: {
        'app.title': 'Titre',
      },
    }, null, 2), 'utf-8');

    const result = syncLocaleFiles({
      cwd: tempDir,
      sourceLocale: 'en',
      missingValue: 'source',
    });

    expect(result.syncResults.find((entry) => entry.locale === 'fr')?.addedKeys).toEqual(['app.subtitle']);
    expect(result.ok).toBe(true);

    const frJson = JSON.parse(readFileSync(join(localesDir, 'fr.json'), 'utf-8')) as Record<string, Record<string, string>>;
    expect(frJson.fr['app.subtitle']).toBe('Subtitle');
  });
});
