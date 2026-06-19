# @localive/vue

> Vue bindings for Localive. Drop in the provider and fix copy right on the page.

Part of [Localive](https://github.com/Arigatouz/localive), click any text in your running app, edit the translation, and it saves back to your locale files.

## Install

```sh
npm install @localive/vue @localive/adapter-vue-i18n @localive/vite
```

Requires the peer dependencies `vue` (>=3.3) and `@localive/core`.

## Usage

```ts
import { LocalivePlugin } from '@localive/vue';
import { withVueI18n } from '@localive/adapter-vue-i18n';
import i18n from './i18n';

app.use(LocalivePlugin, { adapter: withVueI18n(i18n), locales: ['en', 'fr'], defaultLocale: 'en' });
```

See the full documentation at **https://localive.vercel.app/guides/vue/**.

## License

MIT © Localive, see [LICENSE](./LICENSE).
