#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { gzipSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(__dirname, '../..');

const SIZE_LIMITS = {
  '@localive/core': { maxGzip: 3000 },
  '@localive/react': { maxGzip: 6000 },
  '@localive/vue': { maxGzip: 3000 },
  '@localive/svelte': { maxGzip: 2000 },
  '@localive/angular': { maxGzip: 4000 },
  '@localive/adapter-i18next': { maxGzip: 1000 },
  '@localive/adapter-vue-i18n': { maxGzip: 1000 },
  '@localive/adapter-ngx-translate': { maxGzip: 1000 },
  '@localive/adapter-transloco': { maxGzip: 1000 },
  '@localive/adapter-react-intl': { maxGzip: 1000 },
  '@localive/adapter-svelte-i18n': { maxGzip: 1000 },
  '@localive/vite': { maxGzip: 3000 },
  '@localive/webpack': { maxGzip: 3000 },
  '@localive/plugin-angular': { maxGzip: 1000 },
};

const DIST_FILES = {
  '@localive/core': 'packages/core/dist/index.js',
  '@localive/react': 'packages/client-react/dist/index.js',
  '@localive/vue': 'packages/client-vue/dist/index.js',
  '@localive/svelte': 'packages/client-svelte/dist/index.js',
  '@localive/angular': 'packages/client-angular/dist/fesm2022/localive-angular.mjs',
  '@localive/adapter-i18next': 'packages/adapter-i18next/dist/index.js',
  '@localive/adapter-vue-i18n': 'packages/adapter-vue-i18n/dist/index.js',
  '@localive/adapter-ngx-translate': 'packages/adapter-ngx-translate/dist/index.js',
  '@localive/adapter-transloco': 'packages/adapter-transloco/dist/index.js',
  '@localive/adapter-react-intl': 'packages/adapter-react-intl/dist/index.js',
  '@localive/adapter-svelte-i18n': 'packages/adapter-svelte-i18n/dist/index.js',
  '@localive/vite': 'packages/plugin-vite/dist/index.js',
  '@localive/webpack': 'packages/plugin-webpack/dist/index.js',
  '@localive/plugin-angular': 'packages/plugin-angular/dist/index.js',
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}b`;
  return `${(bytes / 1024).toFixed(1)}kb`;
}

let hasFailures = false;

console.log('\n📦 LocaLive Bundle Size Check\n');
console.log('Package'.padEnd(35) + 'Raw'.padStart(10) + 'Gzip'.padStart(10) + 'Limit'.padStart(10) + 'Status'.padStart(8));
console.log('-'.repeat(73));

for (const [pkg, distFile] of Object.entries(DIST_FILES)) {
  const filePath = resolve(workspaceRoot, distFile);
  const limit = SIZE_LIMITS[pkg];

  if (!existsSync(filePath)) {
    console.log(`${pkg.padEnd(35)}${'MISSING'.padStart(10)}${'-'.padStart(10)}${formatBytes(limit.maxGzip).padStart(10)}${'❌'.padStart(8)}`);
    hasFailures = true;
    continue;
  }

  const raw = readFileSync(filePath);
  const rawSize = raw.length;
  const gzipSize = gzipSync(raw).length;
  const passed = gzipSize <= limit.maxGzip;
  const status = passed ? '✅' : '❌';

  if (!passed) hasFailures = true;

  console.log(
    pkg.padEnd(35) +
    formatBytes(rawSize).padStart(10) +
    formatBytes(gzipSize).padStart(10) +
    formatBytes(limit.maxGzip).padStart(10) +
    status.padStart(8)
  );
}

console.log('');
if (hasFailures) {
  console.error('❌ Bundle size check FAILED — some packages exceed their limits.\n');
  process.exit(1);
} else {
  console.log('✅ All bundle sizes within limits.\n');
}
