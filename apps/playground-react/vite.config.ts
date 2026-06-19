import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { localiveVite } from '@localive/vite';

export default defineConfig({
  plugins: [
    react(),
    localiveVite({
      translationsPath: './src/locales',
      locales: ['en', 'fr'],
      defaultLocale: 'en',
    }),
  ],
});