import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanupDir, createTempDir } from '../../../tools/testing';
import { extractKeys } from './extract';
import { syncLocaleFiles } from './sync';
import { generateTypes } from './types';
import { validateKeys } from './validate';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../');

describe('cli integration with playground apps', () => {
  let tempDir = '';

  afterEach(() => {
    if (tempDir) {
      cleanupDir(tempDir);
      tempDir = '';
    }
  });

  it('extracts keys from the real React playground', () => {
    const result = extractKeys({ cwd: join(workspaceRoot, 'apps/playground-react') });

    expect(result.keys).toEqual(expect.arrayContaining([
      'app.title',
      'app.subtitle',
      'card.welcome',
      'card.description',
      'footer.rights',
    ]));
  });

  it('extracts keys from the real Vue playground', () => {
    const result = extractKeys({ cwd: join(workspaceRoot, 'apps/playground-vue') });

    expect(result.keys).toEqual(expect.arrayContaining([
      'app.title',
      'app.subtitle',
      'card.welcome',
      'card.description',
      'footer.rights',
    ]));
  });

  it('extracts keys from the real Angular playground', () => {
    const result = extractKeys({ cwd: join(workspaceRoot, 'apps/playground-angular') });

    expect(result.keys).toEqual(expect.arrayContaining([
      'app.title',
      'app.subtitle',
      'card.welcome',
      'card.description',
      'footer.rights',
    ]));
  });

  it('extracts keys from the real Svelte playground', () => {
    const result = extractKeys({ cwd: join(workspaceRoot, 'apps/playground-svelte') });

    expect(result.keys).toEqual(expect.arrayContaining([
      'app.title',
      'app.subtitle',
      'card.welcome',
      'card.description',
      'footer.rights',
    ]));
  });

  it('reports current unused locale keys in the React playground', () => {
    const result = validateKeys({ cwd: join(workspaceRoot, 'apps/playground-react') });

    expect(result.ok).toBe(false);
    expect(result.localeResults).toHaveLength(2);
    for (const localeResult of result.localeResults) {
      expect(localeResult.missingKeys).toEqual([]);
      expect(localeResult.unusedKeys).toEqual(expect.arrayContaining([
        'card.switch',
        'nav.about',
        'nav.contact',
        'nav.home',
      ]));
    }
  });

  it('syncs a copied playground locale set without adding extra keys when none are missing', () => {
    tempDir = createTempDir('localive-cli-playground-sync-');
    const appDir = join(workspaceRoot, 'apps/playground-svelte');
    copyDirectory(appDir, tempDir);

    const result = syncLocaleFiles({ cwd: tempDir });

    expect(result.syncResults.every((entry) => entry.addedKeys.length === 0)).toBe(true);
  });

  it('generates types from a real playground locale directory', () => {
    tempDir = createTempDir('localive-cli-playground-types-');
    const appDir = join(workspaceRoot, 'apps/playground-vue');
    copyDirectory(appDir, tempDir);

    const result = generateTypes({ cwd: tempDir, outFile: 'generated/localive.d.ts' });
    const output = readFileSync(result.outFile, 'utf-8');

    expect(result.keys).toEqual(expect.arrayContaining(['app.title', 'card.description', 'footer.rights']));
    expect(output).toContain("'app.title'");
  });
});

function copyDirectory(fromDir: string, toDir: string): void {
  const cpSync = require('node:fs').cpSync as typeof import('node:fs').cpSync;
  cpSync(fromDir, toDir, { recursive: true });
}
