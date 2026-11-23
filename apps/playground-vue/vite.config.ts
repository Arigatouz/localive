import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { localiveVite } from '@localive/vite';
import { nxReadySignal } from '@nx/vite/plugins/nx-ready-signal.plugin';

export default defineConfig({
  plugins: [
    vue(),
    localiveVite({
      translationsPath: './src/locales',
      locales: ['en', 'fr'],
      defaultLocale: 'en',
    }),
    nxReadySignal(),
  ],
});
