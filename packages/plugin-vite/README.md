# @localive/vite

> Vite dev-server plugin that writes your Localive edits back to the locale files.

Part of [Localive](https://github.com/Arigatouz/localive), live in-context i18n editing for React, Vue, Angular, and Svelte.

## Install

```sh
npm install -D @localive/vite
```

Requires the peer dependency `vite` (>=5).

## Usage

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { localive } from '@localive/vite';

export default defineConfig({
  plugins: [localive({ localeDir: 'src/locales', defaultLocale: 'en' })],
});
```

See the full documentation at **https://localive.vercel.app/plugins/vite/**.

## License

MIT © Localive, see [LICENSE](./LICENSE).
