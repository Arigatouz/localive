// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const vitePackage = createRequire(import.meta.url).resolve('vite/package.json');
const BUILD_TIMEOUT_MS = 120_000;

// Vitest injects `import.meta.env`, so the bundle is only realistic when built and imported by separate Node processes.
describe('published bundle', () => {
  let outDir: string;

  beforeAll(() => {
    outDir = mkdtempSync(join(tmpdir(), 'localive-core-build-'));
    execFileSync(
      process.execPath,
      [resolve(dirname(vitePackage), 'bin/vite.js'), 'build', '--outDir', outDir, '--logLevel', 'silent'],
      { cwd: packageRoot, env: { ...process.env, NODE_ENV: 'production' }, stdio: 'pipe' },
    );
    writeFileSync(join(outDir, 'package.json'), '{"type":"module"}');
  }, BUILD_TIMEOUT_MS);

  afterAll(() => {
    rmSync(outDir, { recursive: true, force: true });
  });

  it.each(['index.js', 'index.cjs'])('%s sends saves to the dev server', (fileName) => {
    const script = `
      const { createLocalive } = await import(${JSON.stringify(pathToFileURL(join(outDir, fileName)).href)});
      globalThis.fetch = async () => new Response(JSON.stringify({ ok: true }));
      const adapter = { name: 'test', getLocale: () => 'en', getTranslations: () => ({}), onLocaleChange: () => () => {} };
      const instance = createLocalive({ locales: ['en'], adapter });
      console.log(JSON.stringify(await instance.saveTranslation({ key: 'title', value: 'Hello', locale: 'en' })));
    `;
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8' });

    expect(JSON.parse(output)).toEqual({ success: true });
  });
});
