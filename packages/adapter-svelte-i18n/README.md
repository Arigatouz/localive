# @localive/adapter-svelte-i18n

> Use Localive with svelte-i18n and edit translations while your Svelte app runs.

Part of [Localive](https://github.com/Arigatouz/localive), live in-context i18n editing for React, Vue, Angular, and Svelte.

## Install

```sh
npm install @localive/adapter-svelte-i18n svelte-i18n
```

Requires the peer dependencies `svelte-i18n` (>=4) and `@localive/core`.

## Usage

```ts
import { withSvelteI18n } from '@localive/adapter-svelte-i18n';
import { _, locale } from 'svelte-i18n';

const adapter = withSvelteI18n({ _, locale });
```

See the full documentation at **https://localive.vercel.app/concepts/adapters/**.

## License

MIT © Localive, see [LICENSE](./LICENSE).
