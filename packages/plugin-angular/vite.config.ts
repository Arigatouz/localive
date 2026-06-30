import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@localive/core': resolve(__dirname, '../core/src/index.ts'),
      '@localive/vite': resolve(__dirname, '../plugin-vite/src/index.ts'),
    },
  },
  build: {
    lib: {
      entry: ['src/index.ts', 'src/builders.ts'],
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        /^@angular-devkit\/build-angular/,
        /^@angular-devkit\/architect/,
        /^@angular-devkit\/core/,
        /^@localive\/core/,
        /^@localive\/vite/,
        /^rxjs/,
      ],
    },
    sourcemap: true,
    minify: 'esbuild',
  },
  plugins: [dts({ rollupTypes: true })],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts'],
    },
  },
});