import { builtinModules } from 'node:module';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const nodeBuiltins = builtinModules.flatMap((name) => [name, `node:${name}`]);

export default defineConfig({
  build: {
    lib: {
      entry: { index: 'src/index.ts', runtime: 'src/runtime/index.ts', vite: 'src/vite/index.ts' },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rolldownOptions: {
      external: (id) =>
        nodeBuiltins.includes(id) || ['jsonc-parser', 'magic-string', 'svelte', '@localive/core'].includes(id) || id.startsWith('svelte/'),
    },
    sourcemap: true,
    minify: 'oxc',
  },
  // The workspace maps @localive/* to sources, which must not leak into published declarations.
  plugins: [dts({ exclude: ['src/**/*.spec.ts'], aliasesExclude: [/^@localive\//] })],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts'],
    },
  },
});
