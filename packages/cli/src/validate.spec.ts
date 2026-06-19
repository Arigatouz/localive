import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanupDir, createTempDir } from '../../../tools/testing';
import { validateKeys } from './validate';

describe('validateKeys', () => {
  let tempDir = '';

  afterEach(() => {
    if (tempDir) {
      cleanupDir(tempDir);
      tempDir = '';
    }
  });

  it('reports missing and unused keys per locale file', () => {
    tempDir = createTempDir('localive-cli-validate-');
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
        'unused.key': 'Unused',
      },
    }, null, 2), 'utf-8');

    const result = validateKeys({ cwd: tempDir });

    expect(result.ok).toBe(false);
    expect(result.localeResults).toHaveLength(1);
    expect(result.localeResults[0]).toMatchObject({
      locale: 'en',
      missingKeys: ['app.subtitle'],
      unusedKeys: ['unused.key'],
    });
  });
});
