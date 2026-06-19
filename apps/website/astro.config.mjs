// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://localive.dev',
  integrations: [
    sitemap(),
    starlight({
      title: 'Localive',
      logo: {
        dark: '/src/assets/logo-dark.svg',
        light: '/src/assets/logo-light.svg',
        replacesTitle: false,
      },
      components: {
        SiteTitle: './src/components/SiteTitle.astro',
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/localive/localive' },
      ],
      head: [
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' } },
        { tag: 'link', attrs: { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Orbitron:wght@400;500;700;900&family=Share+Tech+Mono&display=swap' } },
        { tag: 'meta', attrs: { property: 'og:title', content: 'Localive - Live i18n editing' } },
        { tag: 'meta', attrs: { property: 'og:description', content: 'Edit translations live in your browser. Click any text, change the translation, see updates instantly.' } },
        { tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
        { tag: 'meta', attrs: { property: 'og:url', content: 'https://localive.dev' } },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
        { tag: 'meta', attrs: { name: 'twitter:title', content: 'Localive - Live i18n editing' } },
        { tag: 'meta', attrs: { name: 'twitter:description', content: 'Edit translations live in your browser. Click any text, change the translation, see updates instantly.' } },
      ],
      sidebar: [
        { label: 'Getting Started', slug: 'get-started' },
        {
          label: 'Framework Guides',
          items: [
            { label: 'React', slug: 'guides/react' },
            { label: 'Vue', slug: 'guides/vue' },
            { label: 'Angular', slug: 'guides/angular' },
            { label: 'Svelte', slug: 'guides/svelte' },
          ],
        },
        {
          label: 'Dev Server Plugins',
          items: [
            { label: 'Vite Plugin', slug: 'plugins/vite' },
            { label: 'Webpack Plugin', slug: 'plugins/webpack' },
            { label: 'Angular Builder', slug: 'plugins/angular' },
          ],
        },
        {
          label: 'Core Concepts',
          items: [
            { label: 'Adapters', slug: 'concepts/adapters' },
            { label: 'Auto-Tagging', slug: 'concepts/auto-tagging' },
            { label: 'Key Resolution', slug: 'concepts/key-resolution' },
            { label: 'Plugin System', slug: 'concepts/plugin-system' },
            { label: 'Security', slug: 'concepts/security' },
          ],
        },
        {
          label: 'CLI',
          items: [
            { label: 'Overview', slug: 'cli/overview' },
            { label: 'extract', slug: 'cli/extract' },
            { label: 'validate', slug: 'cli/validate' },
            { label: 'sync', slug: 'cli/sync' },
            { label: 'types', slug: 'cli/types' },
          ],
        },
        { label: 'VS Code Extension', slug: 'vscode' },
        {
          label: 'API Reference',
          items: [
            { label: 'Core API', slug: 'api/core' },
            { label: 'Adapter Interface', slug: 'api/adapter' },
            { label: 'Plugin Interface', slug: 'api/plugin' },
          ],
        },
        
      ],
      customCss: ['/src/styles/custom.css'],
    }),
  ],
});