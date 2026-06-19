import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { localiveVite } from '@localive/vite';

export default defineConfig({
  plugins: [
    svelte(),
    localiveVite({
      translationsPath: './src/locales',
      locales: ['en', 'fr'],
      defaultLocale: 'en',
    }),
  ],
  server: {
    port: 5175,
  },
});