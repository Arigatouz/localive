// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const viteBin = resolve(dirname(createRequire(import.meta.url).resolve('vite/package.json')), 'bin/vite.js');
const BUILD_TIMEOUT_MS = 120_000;

describe('published type declarations', () => {
  let outDir: string;

  beforeAll(() => {
    outDir = mkdtempSync(join(tmpdir(), 'localive-paraglide-types-'));
    execFileSync(process.execPath, [viteBin, 'build', '--outDir', outDir, '--logLevel', 'silent'], { cwd: packageRoot, stdio: 'pipe' });
  }, BUILD_TIMEOUT_MS);

  afterAll(() => {
    rmSync(outDir, { recursive: true, force: true });
  });

  it('import only from inside the package or from package names', () => {
    const declarations = readdirSync(outDir, { recursive: true, encoding: 'utf8' }).filter((file) => file.endsWith('.d.ts'));
    const escaping = declarations.flatMap((file) =>
      [...readFileSync(join(outDir, file), 'utf8').matchAll(/from ['"](\.[^'"]*)['"]/g)]
        .map(([, specifier]) => specifier)
        .filter((specifier) => relative(outDir, resolve(outDir, dirname(file), specifier)).startsWith('..'))
        .map((specifier) => `${file}: ${specifier}`),
    );

    expect(declarations.length).toBeGreaterThan(0);
    expect(escaping).toEqual([]);
  });
});
