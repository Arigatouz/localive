# @localive/angular

> Angular bindings for Localive, so your team can edit text inside the running app.

Part of [Localive](https://github.com/Arigatouz/localive), click any text in your running app, edit the translation, and it saves back to your locale files.

## Install

```sh
npm install @localive/angular @localive/adapter-transloco @localive/plugin-angular
```

Requires the peer dependencies `@angular/core` (>=17), `@angular/common` (>=17), and `@localive/core`.

## Usage

`provideLocalive` takes an adapter factory as the first argument and an options object as the second. Add the `<localive-overlay>` component to your app template to render the inspector.

```ts
import { provideLocalive } from '@localive/angular';
import { withTransloco } from '@localive/adapter-transloco';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';

// In your app config:
provideLocalive(
  () => withTransloco(inject(TranslocoService), TranslocoPipe),
  { locales: ['en', 'fr'], defaultLocale: 'en' }
);
```

```html
<!-- In your app component template: -->
<localive-overlay></localive-overlay>
```

See the full documentation at **https://localive.vercel.app/guides/angular/**.

## License

MIT © Localive, see [LICENSE](./LICENSE).
