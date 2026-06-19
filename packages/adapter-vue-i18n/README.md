# @localive/adapter-vue-i18n

> Connect Localive to vue-i18n and edit translations straight from the page.

Part of [Localive](https://github.com/Arigatouz/localive), live in-context i18n editing for React, Vue, Angular, and Svelte.

## Install

```sh
npm install @localive/adapter-vue-i18n vue-i18n
```

Requires the peer dependencies `vue-i18n` (>=9) and `@localive/core`.

## Usage

```ts
import { withVueI18n } from '@localive/adapter-vue-i18n';
import i18n from './i18n';

const adapter = withVueI18n(i18n);
```

See the full documentation at **https://localive.vercel.app/concepts/adapters/**.

## License

MIT © Localive, see [LICENSE](./LICENSE).
