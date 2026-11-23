// Fails the build when editing code, markers or the dev endpoint reach the browser bundle.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const clientOutput = fileURLToPath(new URL('../.svelte-kit/output/client', import.meta.url));
const FORBIDDEN = [
  ['the save endpoint', '__localive-update'],
  ['the edit-mode cookie', 'localive_edit'],
  ['the editor', 'data-localive-ui'],
  ['the editor state', 'localive:open-message'],
  ['a marker character', '͏'],
];

const files = readdirSync(clientOutput, { recursive: true, encoding: 'utf8' }).filter((file) => /\.(js|css|html)$/.test(file));
const leaks = files.flatMap((file) => {
  const content = readFileSync(join(clientOutput, file), 'utf8');
  return FORBIDDEN.filter(([, text]) => content.includes(text)).map(([description]) => `${file} contains ${description}`);
});

if (files.length === 0) {
  console.error('No client output found to check.');
  process.exit(1);
}
if (leaks.length > 0) {
  console.error(`Localive leaked into the production build:\n${leaks.join('\n')}`);
  process.exit(1);
}
console.log(`Checked ${files.length} client files: no Localive code in the production build.`);
