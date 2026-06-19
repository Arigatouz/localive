# @localive/adapter-ngx-translate

> ngx-translate adapter for Localive — bridges @ngx-translate/core to Localive's live i18n editing.

Part of [Localive](https://github.com/Arigatouz/localive) — live, in-context i18n editing for React, Vue, Angular, and Svelte.

## Install

```sh
npm install @localive/adapter-ngx-translate @ngx-translate/core
```

Requires the peer dependencies `@ngx-translate/core` (>=15) and `@localive/core`.

## Usage

```ts
import { withNgxTranslate } from '@localive/adapter-ngx-translate';
import { TranslateService } from '@ngx-translate/core';

const adapter = withNgxTranslate(inject(TranslateService));
```

See the full documentation at **https://localive.vercel.app/concepts/adapters/**.

## License

MIT © Localive — see [LICENSE](./LICENSE).
