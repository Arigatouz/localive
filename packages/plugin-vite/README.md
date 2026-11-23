# @localive/vite

> Vite dev-server plugin that writes your Localive edits back to the locale files on disk.

Part of [Localive](https://github.com/Arigatouz/localive) — live in-context i18n editing for React, Vue, Angular, and Svelte.

## Install

```sh
npm install -D @localive/vite
```

Requires the peer dependency `vite` (>=5). The plugin runs only in the dev server.

## Usage with JSON locale files

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

Saves change only the edited key and keep the file's indentation and line endings. A file that is not valid JSON, or a key holding a group or variants, is never overwritten.

## Usage with an integration

Message formats that plain JSON writes cannot express, such as compiled Paraglide messages, plug in through `integration`. `translationsPath` and `locales` are then not needed:

```ts
import { paraglideIntegration } from '@localive/adapter-paraglide/vite';

localiveVite({ integration: paraglideIntegration({ project: './project.inlang' }) });
```

An integration can transform modules, scope each request, write saves and serve a catalog at `GET <endpoint>/catalog`. See `LocaliveIntegration` in the type declarations.

## Options

| Option | Type | Required | Default | Description |
|--------|------|:---:|---------|-------------|
| `translationsPath` | `string` | ✅ without `integration` | — | Root directory holding your locale JSON files. |
| `locales` | `string[]` | ✅ without `integration` | — | Supported locale codes, e.g. `['en', 'fr', 'de']`. |
| `integration` | `LocaliveIntegration` | ❌ | — | Reads and writes a message format other than plain JSON. |
| `defaultLocale` | `string` | ❌ | first in `locales` | Source / fallback locale. |
| `endpoint` | `string` | ❌ | `/__localive-update` | Path the overlay POSTs save requests to. |
| `searchRoots` | `string[]` | ❌ | `[]` | Additional directories scanned for locale files. |
| `ws` | `boolean` | ❌ | `false` | Enable WebSocket transport for multi-tab sync. |
| `wsPort` | `number` | ❌ | auto | WebSocket port used for multi-tab sync. |

## The save endpoint

`POST <endpoint>` takes `{ key, value, locale, variant?, expected? }` as JSON:

- `variant` names a plural or select branch, such as `plural=one`. Only integrations accept it.
- `expected` is the value the edit started from, or `null` for a missing translation. If the stored value differs, the save fails with HTTP 409.

To keep other websites and DNS rebinding from writing your files, requests must:

- come from the dev server's own origin (the browser's `Sec-Fetch-Site` or `Origin` header),
- use a host Vite allows: localhost, an IP address, or one listed in `server.allowedHosts`,
- send `Content-Type: application/json`, with a body under 1 MB.

A custom dev domain therefore needs to be in `server.allowedHosts`, as Vite already requires for its pages.

See the full documentation at **https://localive.vercel.app/plugins/vite/**.

## License

MIT © Localive, see [LICENSE](./LICENSE).
