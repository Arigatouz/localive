# @localive/vite

> Vite dev-server plugin that writes your Localive edits back to the locale files on disk.

Part of [Localive](https://github.com/Arigatouz/localive) — live in-context i18n editing for React, Vue, Angular, and Svelte.

## Install

```sh
npm install -D @localive/vite
```

Requires the peer dependency `vite` (>=5).

## Usage

Export `localiveVite` (not `localive`) and call it with `translationsPath`, `locales`, and `defaultLocale`:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { localiveVite } from '@localive/vite';

export default defineConfig({
  plugins: [
    localiveVite({
      translationsPath: 'src/locales',
      locales: ['en', 'fr', 'de'],
      defaultLocale: 'en',
    }),
  ],
});
```

## Options

| Option | Type | Required | Default | Description |
|--------|------|:---:|---------|-------------|
| `translationsPath` | `string` | ✅ | — | Root directory holding your locale JSON files. |
| `locales` | `string[]` | ✅ | — | Supported locale codes, e.g. `['en', 'fr', 'de']`. |
| `defaultLocale` | `string` | ❌ | first in `locales` | Source / fallback locale. |
| `endpoint` | `string` | ❌ | `/__localive-update` | Path the overlay POSTs save requests to. |
| `searchRoots` | `string[]` | ❌ | `[]` | Additional directories scanned for locale files. |
| `ws` | `boolean` | ❌ | `false` | Enable WebSocket transport for multi-tab sync. |
| `wsPort` | `number` | ❌ | auto | WebSocket port used for multi-tab sync. |

See the full documentation at **https://localive.vercel.app/plugins/vite/**.

## License

MIT © Localive, see [LICENSE](./LICENSE).