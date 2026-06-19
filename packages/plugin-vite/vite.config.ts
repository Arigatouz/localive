import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { builtinModules } from 'node:module';

export default defineConfig({
  build: {
    lib: {
      entry: ['src/index.ts'],
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: [
        'vite',
        ...builtinModules.flatMap((m) => [m, `node:${m}`]),
      ],
    },
    sourcemap: true,
    minify: 'esbuild',
  },
  plugins: [dts({ rollupTypes: true })],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/types.ts'],
    },
  },
});