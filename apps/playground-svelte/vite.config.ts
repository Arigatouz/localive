import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { localiveVite } from '@localive/vite';
import { nxReadySignal } from '@nx/vite/plugins/nx-ready-signal.plugin';

export default defineConfig({
  plugins: [
    svelte(),
    localiveVite({
      translationsPath: './src/locales',
      locales: ['en', 'fr'],
      defaultLocale: 'en',
    }),
    nxReadySignal(),
  ],
  server: {
    port: 5175,
  },
});
