// Starts the dev server on a temporary copy of the inlang project, so saving from tests leaves the committed messages untouched.
import { spawn } from 'node:child_process';
import { copyFileSync, cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = fileURLToPath(new URL('..', import.meta.url));
// Recreated on every start, as the test runner may kill the server before it can clean up.
const copyRoot = join(appRoot, '.e2e-messages');
rmSync(copyRoot, { recursive: true, force: true });
const project = join(copyRoot, 'project.inlang');

cpSync(join(appRoot, 'project.inlang'), project, { recursive: true });
cpSync(join(appRoot, 'messages'), join(copyRoot, 'messages'), { recursive: true });
copyFileSync(createRequire(import.meta.url).resolve('@inlang/plugin-message-format'), join(copyRoot, 'message-format.js'));

const settingsFile = join(project, 'settings.json');
const settings = JSON.parse(readFileSync(settingsFile, 'utf8'));
writeFileSync(settingsFile, JSON.stringify({ ...settings, modules: ['./message-format.js'] }, null, 2));

const viteBin = join(dirname(createRequire(import.meta.url).resolve('vite/package.json')), 'bin/vite.js');
const vite = spawn(process.execPath, [viteBin, 'dev', ...process.argv.slice(2)], {
  cwd: appRoot,
  stdio: 'inherit',
  env: { ...process.env, LOCALIVE_PLAYGROUND_PROJECT: project },
});

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => vite.kill(signal));
vite.on('exit', (code) => process.exit(code ?? 0));
