import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanupDir, createTempDir } from '../../../tools/testing';
import { runCli } from './index';

describe('runCli', () => {
  let tempDir = '';

  afterEach(() => {
    if (tempDir) {
      cleanupDir(tempDir);
      tempDir = '';
    }
  });

  it('runs extract and prints json output', async () => {
    tempDir = createTempDir('localive-cli-run-');
    const srcDir = join(tempDir, 'src');
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, 'App.tsx'), `export const App = () => t('app.title');`, 'utf-8');

    const log = vi.fn();
    const error = vi.fn();
    const exitCode = await runCli(['extract', '--json'], { cwd: tempDir, stdout: { log, error } });

    expect(exitCode).toBe(0);
    expect(JSON.parse(log.mock.calls[0][0] as string)).toMatchObject({ keys: ['app.title'] });
    expect(error).not.toHaveBeenCalled();
  });

  it('runs types and writes the declaration file', async () => {
    tempDir = createTempDir('localive-cli-run-types-');
    const localesDir = join(tempDir, 'src/locales');
    mkdirSync(localesDir, { recursive: true });
    writeFileSync(join(localesDir, 'en.json'), JSON.stringify({ en: { 'app.title': 'Title' } }, null, 2), 'utf-8');

    const log = vi.fn();
    const error = vi.fn();
    const exitCode = await runCli(['types', '--out', 'localive.d.ts'], { cwd: tempDir, stdout: { log, error } });

    expect(exitCode).toBe(0);
    expect(readFileSync(join(tempDir, 'localive.d.ts'), 'utf-8')).toContain("'app.title'");
    expect(log).toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});
