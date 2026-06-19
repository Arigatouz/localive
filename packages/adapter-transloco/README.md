# @localive/adapter-transloco

> Transloco adapter for Localive — bridges @jsverse/transloco to Localive's live i18n editing.

Part of [Localive](https://github.com/localive/localive) — live, in-context i18n editing for React, Vue, Angular, and Svelte.

## Install

```sh
npm install @localive/adapter-transloco @jsverse/transloco
```

Requires the peer dependencies `@jsverse/transloco` (>=7) and `@localive/core`.

## Usage

```ts
import { withTransloco } from '@localive/adapter-transloco';
import { TranslocoService } from '@jsverse/transloco';

const adapter = withTransloco(inject(TranslocoService));
```

See the full documentation at **https://localive.dev**.

## License

MIT © Localive — see [LICENSE](./LICENSE).
