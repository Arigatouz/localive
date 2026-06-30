# @localive/vue

> Vue 3 bindings for Localive. Drop in the plugin and fix copy right on the page.

Part of [Localive](https://github.com/Arigatouz/localive) — click any text in your running app, edit the translation, and it saves straight back to your locale files.

## Install

```sh
npm install @localive/vue @localive/adapter-vue-i18n @localive/vite
```

Requires the peer dependencies `vue` (>=3) and `@localive/core`.

## Usage

`createLocalivePlugin` is a **factory** — call it with your options, then `app.use()` the returned plugin. There is no `LocalivePlugin` class:

```ts
import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import { createLocalivePlugin, LiveEditorOverlay, localiveSymbol, useLocaliveEditor, vLocaliveTag } from '@localive/vue';
import { withVueI18n } from '@localive/adapter-vue-i18n';
import App from './App.vue';
import en from './locales/en.json';
import fr from './locales/fr.json';

const i18n = createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: { en, fr } });

const localive = createLocalivePlugin({
  adapter: withVueI18n(i18n.global),
  locales: ['en', 'fr'],
  defaultLocale: 'en',
});

const app = createApp(App);
app.use(i18n);
app.use(localive);
app.mount('#app');
```

In templates, tag elements with `v-localive-tag` and render `<LiveEditorOverlay />` anywhere inside the installed tree:

```vue
<template>
  <span v-localive-tag="'nav.home'">{{ t('nav.home') }}</span>
  <LiveEditorOverlay />
</template>
```

To toggle the inspector, `useLocaliveEditor(instance)` takes the instance from `inject(localiveSymbol)` and returns `{ isActive, activate, deactivate, toggle, getTranslation }`. `isActive` is a `Ref<boolean>`.

See the full documentation at **https://localive.vercel.app/guides/vue/**.

## License

MIT © Localive, see [LICENSE](./LICENSE).