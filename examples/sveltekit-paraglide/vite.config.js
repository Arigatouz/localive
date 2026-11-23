import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { paraglideIntegration } from '@localive/adapter-paraglide/vite';
import { localiveVite } from '@localive/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// The e2e tests point this at a temporary copy, so saving never changes the committed messages.
const project = process.env.LOCALIVE_PLAYGROUND_PROJECT ?? './project.inlang';

export default defineConfig({
  plugins: [
    paraglideVitePlugin({ project, outdir: './src/lib/paraglide', strategy: ['cookie', 'baseLocale'] }),
    localiveVite({ integration: paraglideIntegration({ project }) }),
    sveltekit(),
  ],
});
