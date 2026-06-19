# @localive/adapter-vue-i18n

> vue-i18n adapter for Localive — bridges vue-i18n to Localive's live i18n editing.

Part of [Localive](https://github.com/localive/localive) — live, in-context i18n editing for React, Vue, Angular, and Svelte.

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

See the full documentation at **https://localive.dev**.

## License

MIT © Localive — see [LICENSE](./LICENSE).
