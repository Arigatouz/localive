<div align="center">

# Localive

**Edit your translations live, right inside the running app. Works with React, Vue, Angular, and Svelte.**

Click any text on the page, type the new translation, and Localive writes it straight back to your locale file. No more hunting for keys in JSON.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![npm](https://img.shields.io/npm/v/@localive/core.svg)](https://www.npmjs.com/package/@localive/core)

[Read the docs](https://localive.vercel.app/)

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&duration=2800&pause=600&color=22D3EE&center=true&vCenter=true&width=460&lines=Made+with+%E2%9D%A4+by+Ali.G;Translate+live.+Ship+faster.;Localive" alt="Made with love by Ali.G" />

</div>

---

## Why Localive

Translating an app is slow work. You spot a string in the UI, switch to your editor, dig through a JSON file for the right key, change it, reload, and check the result. Then you start over for the next string. The mapping between the text on screen and the key in the file lives only in your head, and it falls apart every time you switch files.

Localive removes those middle steps. It paints an overlay on top of your running app, so you click the text, type the new value, and it saves the change to the correct locale file for you. You never look up a key by hand again.

It hooks into whichever i18n library you already use, runs across all four major frameworks, and ships with a CLI and a VS Code extension for the parts the overlay does not cover.

## Supported stacks

Combine a framework **client** with an i18n-library **adapter** and a build **plugin**:

| Framework | Client | i18n libraries (adapters) | Build plugin |
|---|---|---|---|
| Angular | `@localive/angular` | Transloco, ngx-translate | `@localive/plugin-angular` |
| React | `@localive/react` | i18next, react-intl | `@localive/vite` or `@localive/webpack` |
| Vue | `@localive/vue` | vue-i18n | `@localive/vite` or `@localive/webpack` |
| Svelte | `@localive/svelte` | svelte-i18n | `@localive/vite` or `@localive/webpack` |

## Quick start

Pick the framework you work in. Each setup is three steps: install the packages, wire up the build plugin, and wrap your app with Localive.

### Angular (with Transloco)

```sh
npm install @localive/angular @localive/adapter-transloco @localive/core @localive/plugin-angular @jsverse/transloco
```

Register the Localive dev-server builder in `angular.json`. The builder wraps the standard Angular dev server and injects the Localive save endpoint. Set the `localive` options at the top level and `buildTarget` per configuration, just like the stock `dev-server`:

```json
{
  "serve": {
    "builder": "@localive/plugin-angular:dev-server",
    "options": {
      "localive": {
        "translationsPath": "src/locales",
        "locales": ["en", "fr"],
        "defaultLocale": "en"
      }
    },
    "configurations": {
      "development": { "buildTarget": "your-app:build:development" },
      "production":   { "buildTarget": "your-app:build:production" }
    },
    "defaultConfiguration": "development"
  }
}
```

Provide Localive when you bootstrap the app (`main.ts` or `app.config.ts`). `provideLocalive` takes an adapter **factory** (a function returning the `I18nAdapter`) as its first argument and the locale options as its second:

```ts
import { provideLocalive, LiveEditorOverlayComponent } from '@localive/angular'
import { withTransloco } from '@localive/adapter-transloco'
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco'
import { inject, ApplicationConfig } from '@angular/core'
import { AppComponent } from './app/app.component'

export const appConfig: ApplicationConfig = {
  providers: [
    provideLocalive(
      () => withTransloco(inject(TranslocoService), TranslocoPipe),
      { locales: ['en', 'fr'], defaultLocale: 'en' },
    ),
  ],
}
```

> The Transloco adapter accepts the `TranslocoService` instance and the pipe/directive class so it can resolve keys from elements the Transloco directives touched.

Drop the overlay into your root template. The selector is `localive-overlay`:

```html
<localive-overlay></localive-overlay>
```

Import `LiveEditorOverlayComponent` in your standalone root component (or `NgModule`):

```ts
import { LiveEditorOverlayComponent } from '@localive/angular'

@Component({
  imports: [LiveEditorOverlayComponent],
  template: `
    <localive-overlay></localive-overlay>
    <router-outlet />
  `,
})
export class AppComponent {}
```

### React (with i18next)

```sh
npm install @localive/react @localive/adapter-i18next @localive/core @localive/vite i18next react-i18next
```

Add the plugin to `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { localiveVite } from '@localive/vite'

export default defineConfig({
  plugins: [
    react(),
    localiveVite({
      translationsPath: './src/locales',
      locales: ['en', 'fr'],
      defaultLocale: 'en',
    }),
  ],
})
```

Wrap your app and add the overlay (`App.tsx`):

```tsx
import { LocaliveProvider, LiveEditorOverlay } from '@localive/react'
import { withI18next } from '@localive/adapter-i18next'
import i18n from './i18n'

export default function App() {
  return (
    <LocaliveProvider adapter={withI18next(i18n)} locales={['en', 'fr']} defaultLocale="en">
      {/* your app */}
      <LiveEditorOverlay />
    </LocaliveProvider>
  )
}
```

### Vue (with vue-i18n)

```sh
npm install @localive/vue @localive/adapter-vue-i18n @localive/core @localive/vite vue vue-i18n
```

Add the plugin to `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { localiveVite } from '@localive/vite'

export default defineConfig({
  plugins: [
    vue(),
    localiveVite({
      translationsPath: './src/locales',
      locales: ['en', 'fr'],
      defaultLocale: 'en',
    }),
  ],
})
```

Register the plugin when you create the app (`main.ts`):

```ts
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { createLocalivePlugin } from '@localive/vue'
import { withVueI18n } from '@localive/adapter-vue-i18n'
import App from './App.vue'

const i18n = createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages })

const localive = createLocalivePlugin({
  adapter: withVueI18n(i18n.global),
  locales: ['en', 'fr'],
  defaultLocale: 'en',
})

createApp(App).use(i18n).use(localive).mount('#app')
```

### Svelte (with svelte-i18n)

```sh
npm install @localive/svelte @localive/adapter-svelte-i18n @localive/core @localive/vite svelte-i18n svelte
```

Add the plugin to `vite.config.ts` (same shape as other Vite apps):

```ts
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { localiveVite } from '@localive/vite'

export default defineConfig({
  plugins: [
    svelte(),
    localiveVite({
      translationsPath: './src/locales',
      locales: ['en', 'fr'],
      defaultLocale: 'en',
    }),
  ],
})
```

Initialize Localive **inside a component** (Svelte context requires it). Call `initLocalive` during your root component's setup, then render the overlay descendant:

```svelte
<!-- App.svelte -->
<script lang="ts">
  import { initLocalive, LiveEditorOverlay } from '@localive/svelte'
  import { withSvelteI18n } from '@localive/adapter-svelte-i18n'
  import { _, locale } from 'svelte-i18n'

  initLocalive(withSvelteI18n({ _, locale }), {
    locales: ['en', 'fr'],
    defaultLocale: 'en',
  })
</script>

<h1 data-i18n-key="app.title">{$_('app.title')}</h1>
<LiveEditorOverlay />
```

> The Svelte overlay provides a toggle button to activate the inspector. Tag elements with `data-i18n-key="your.key"` so clicks resolve to the right locale entry.

Then start your dev server, open the app, and click any translated string to edit it. Full guides for every framework live at [localive.vercel.app](https://localive.vercel.app/).

## Packages

Everything ships under the [`@localive`](https://www.npmjs.com/org/localive) scope.

**Core**
- [`@localive/core`](https://www.npmjs.com/package/@localive/core): the framework-agnostic engine, with zero runtime dependencies

**Clients** (framework overlay components)
- [`@localive/react`](https://www.npmjs.com/package/@localive/react), [`@localive/vue`](https://www.npmjs.com/package/@localive/vue), [`@localive/angular`](https://www.npmjs.com/package/@localive/angular), [`@localive/svelte`](https://www.npmjs.com/package/@localive/svelte)

**Adapters** (bridge to your i18n library)
- [`@localive/adapter-i18next`](https://www.npmjs.com/package/@localive/adapter-i18next), [`@localive/adapter-react-intl`](https://www.npmjs.com/package/@localive/adapter-react-intl), [`@localive/adapter-vue-i18n`](https://www.npmjs.com/package/@localive/adapter-vue-i18n), [`@localive/adapter-transloco`](https://www.npmjs.com/package/@localive/adapter-transloco), [`@localive/adapter-ngx-translate`](https://www.npmjs.com/package/@localive/adapter-ngx-translate), [`@localive/adapter-svelte-i18n`](https://www.npmjs.com/package/@localive/adapter-svelte-i18n)

**Build plugins**
- [`@localive/vite`](https://www.npmjs.com/package/@localive/vite), [`@localive/webpack`](https://www.npmjs.com/package/@localive/webpack), [`@localive/plugin-angular`](https://www.npmjs.com/package/@localive/plugin-angular)

**Tooling**
- [`@localive/cli`](https://www.npmjs.com/package/@localive/cli): the `localive` binary
- **Localive for VS Code**: available on the VS Code Marketplace

## CLI

```sh
npm install -g @localive/cli     # or run it directly: npx @localive/cli --help
```

| Command | What it does |
|---|---|
| `localive extract` | Scans your source files and reports all translation keys (use `--json` for machine output) |
| `localive validate` | Reports missing, extra, or empty translations, and exits with code 1 so it fits in CI |
| `localive sync` | Copies missing keys from the default locale into every other locale |
| `localive types` | Generates a TypeScript union type of all your keys |

## VS Code extension

Preview translations on hover, autocomplete keys as you type, jump to a key's definition in the locale JSON, find every reference, get a warning on missing keys, and create or rename a key across all locales at once. Search for **"Localive"** in the Extensions panel to install it.

## Repository layout

Localive is an Nx monorepo built on npm workspaces:

- `packages/*`: the libraries we publish, plus the CLI and the VS Code extension.
- `apps/*`: framework playgrounds, the end-to-end test app (`playground-e2e`), and the documentation `website`. These are marked `private: true` and are never published. They serve as live demos and tests, and they stay part of the open-source repo.

## License

[MIT](./LICENSE) © Ali.G

<div align="center">

### Made with love by Ali.G

</div>
