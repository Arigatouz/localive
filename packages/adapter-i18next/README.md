# @localive/adapter-i18next

> Use Localive with i18next. Edit your translations from inside the running app.

Part of [Localive](https://github.com/Arigatouz/localive), live in-context i18n editing for React, Vue, Angular, and Svelte.

## Install

```sh
npm install @localive/adapter-i18next i18next
```

Requires the peer dependencies `i18next` (>=22) and `@localive/core`.

## Usage

```ts
import { withI18next } from '@localive/adapter-i18next';
import i18next from 'i18next';

const adapter = withI18next(i18next);
// pass `adapter` to your Localive client (e.g. <LocaliveProvider adapter={adapter} ... />)
```

See the full documentation at **https://localive.vercel.app/concepts/adapters/**.

## License

MIT © Localive, see [LICENSE](./LICENSE).
