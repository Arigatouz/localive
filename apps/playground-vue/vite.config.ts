import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { localiveVite } from '@localive/vite';

export default defineConfig({
  plugins: [
    vue(),
    localiveVite({
      translationsPath: './src/locales',
      locales: ['en', 'fr'],
      defaultLocale: 'en',
    }),
  ],
});