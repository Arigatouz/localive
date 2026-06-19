# @localive/adapter-svelte-i18n

> svelte-i18n adapter for Localive — bridges svelte-i18n to Localive's live i18n editing.

Part of [Localive](https://github.com/localive/localive) — live, in-context i18n editing for React, Vue, Angular, and Svelte.

## Install

```sh
npm install @localive/adapter-svelte-i18n svelte-i18n
```

Requires the peer dependencies `svelte-i18n` (>=4) and `@localive/core`.

## Usage

```ts
import { withSvelteI18n } from '@localive/adapter-svelte-i18n';
import { locale, locales, _ } from 'svelte-i18n';

const adapter = withSvelteI18n({ locale, locales, t: $_ });
```

See the full documentation at **https://localive.dev**.

## License

MIT © Localive — see [LICENSE](./LICENSE).
