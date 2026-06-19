# @localive/angular

> Angular provider and components for Localive — live, in-context i18n editing.

Part of [Localive](https://github.com/Arigatouz/localive) — click any text in your running app, edit the translation, and it saves back to your locale files.

## Install

```sh
npm install @localive/angular @localive/adapter-transloco @localive/plugin-angular
```

Requires the peer dependencies `@angular/core` (>=17), `@angular/common` (>=17), and `@localive/core`.

## Usage

```ts
import { provideLocalive } from '@localive/angular';
import { withTransloco } from '@localive/adapter-transloco';
import { TranslocoService } from '@jsverse/transloco';

provideLocalive({ adapter: withTransloco(inject(TranslocoService)), locales: ['en', 'fr'], defaultLocale: 'en' });
```

See the full documentation at **https://localive.vercel.app/guides/angular/**.

## License

MIT © Localive — see [LICENSE](./LICENSE).
