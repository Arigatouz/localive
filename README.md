<div align="center">

# Localive

**Live, in-context i18n editing for React, Vue, Angular & Svelte.**

Click any text in your running app, edit the translation inline, and it saves straight back to your locale files.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![npm](https://img.shields.io/npm/v/@localive/core.svg)](https://www.npmjs.com/package/@localive/core)

[Documentation](https://localive.dev) · [Publishing guide](./RELEASE.md)

</div>

---

## Why Localive?

Translating an app usually means hunting for a key, switching to a JSON file, editing it, and reloading to see the result. Localive collapses that loop: it overlays your running app so you can **click the text you want to change, type the new translation, and have it written back to the correct locale file** — no context switching, no guessing which key maps to which string.

It works with the i18n library you already use, across the four major frameworks, and ships editor tooling (a CLI and a VS Code extension) for the rest of the workflow.

## Supported stacks

Pick your framework **client** + your i18n-library **adapter** + a build **plugin**:

| Framework | Client | i18n libraries (adapters) | Build plugin |
|---|---|---|---|
| React | `@localive/react` | i18next, react-intl | `@localive/vite` / `@localive/webpack` |
| Vue | `@localive/vue` | vue-i18n | `@localive/vite` / `@localive/webpack` |
| Angular | `@localive/angular` | Transloco, ngx-translate | `@localive/plugin-angular` |
| Svelte | `@localive/svelte` | svelte-i18n | `@localive/vite` / `@localive/webpack` |

## Quick start (React + i18next)

```sh
npm install @localive/react @localive/adapter-i18next @localive/vite
```

```ts
// vite.config.ts
import { localive } from '@localive/vite';
export default defineConfig({
  plugins: [react(), localive({ localeDir: 'src/locales', defaultLocale: 'en' })],
});
```

```tsx
// main.tsx
import { LocaliveProvider } from '@localive/react';
import { withI18next } from '@localive/adapter-i18next';
import i18n from './i18n';

<LocaliveProvider adapter={withI18next(i18n)} locales={['en', 'fr']} defaultLocale="en">
  <App />
</LocaliveProvider>
```

Run your dev server, open the app, and click any translated text to edit it live.
Full per-framework guides (Vue, Angular, Svelte) are at **[localive.dev](https://localive.dev)**.

## Packages

All published under the [`@localive`](https://www.npmjs.com/org/localive) scope.

**Core**
- [`@localive/core`](https://www.npmjs.com/package/@localive/core) — framework-agnostic engine (zero runtime deps)

**Clients** (framework overlay components)
- [`@localive/react`](https://www.npmjs.com/package/@localive/react) · [`@localive/vue`](https://www.npmjs.com/package/@localive/vue) · [`@localive/angular`](https://www.npmjs.com/package/@localive/angular) · [`@localive/svelte`](https://www.npmjs.com/package/@localive/svelte)

**Adapters** (bridge your i18n library)
- [`@localive/adapter-i18next`](https://www.npmjs.com/package/@localive/adapter-i18next) · [`@localive/adapter-react-intl`](https://www.npmjs.com/package/@localive/adapter-react-intl) · [`@localive/adapter-vue-i18n`](https://www.npmjs.com/package/@localive/adapter-vue-i18n) · [`@localive/adapter-transloco`](https://www.npmjs.com/package/@localive/adapter-transloco) · [`@localive/adapter-ngx-translate`](https://www.npmjs.com/package/@localive/adapter-ngx-translate) · [`@localive/adapter-svelte-i18n`](https://www.npmjs.com/package/@localive/adapter-svelte-i18n)

**Build plugins**
- [`@localive/vite`](https://www.npmjs.com/package/@localive/vite) · [`@localive/webpack`](https://www.npmjs.com/package/@localive/webpack) · [`@localive/plugin-angular`](https://www.npmjs.com/package/@localive/plugin-angular)

**Tooling**
- [`@localive/cli`](https://www.npmjs.com/package/@localive/cli) — `localive` binary
- **Localive for VS Code** — on the VS Code Marketplace

## CLI

```sh
npm install -g @localive/cli     # or: npx @localive/cli --help
```

| Command | What it does |
|---|---|
| `localive extract` | Scan source files and collect translation keys into a locale JSON |
| `localive validate` | Report missing / extra / empty translations (exit code 1 on issues — CI-friendly) |
| `localive sync` | Add missing keys from the default locale to all others |
| `localive types` | Generate a TypeScript union type of all keys |

## VS Code extension

Hover to preview translations, autocomplete keys, go-to-definition into locale JSON, find references, missing-key diagnostics, and create/rename keys across all locales. Search **"Localive"** in the Extensions panel.

## Repository layout

This is an [Nx](https://nx.dev) monorepo using npm workspaces:

- `packages/*` — the published libraries, CLI, and VS Code extension.
- `apps/*` — framework playgrounds, the end-to-end test app (`playground-e2e`), and the docs `website`. These are **demos and tests, not published** (`private: true`) — but they're part of the open-source repo.

## Development

```sh
npm install --legacy-peer-deps                       # required: Angular zone.js peer conflict
npx nx run-many -t build --outputStyle=static        # build all
npx nx run-many -t test --outputStyle=static         # test all
npx nx run-many -t typecheck --outputStyle=static    # typecheck all
npm run lint:all                                     # lint (use this, not `npm run lint`)
npx nx serve playground-react                        # run a demo app
npx nx e2e playground-e2e                            # end-to-end tests
```

## Releasing

See **[RELEASE.md](./RELEASE.md)** for the step-by-step publishing guide (npm + VS Code Marketplace), including how the MIT license, `private` flag, and npm scope access relate.

## License

[MIT](./LICENSE) © Localive
