# @localive/adapter-react-intl

> Connect Localive to react-intl and fix copy without digging through message files.

Part of [Localive](https://github.com/Arigatouz/localive), live in-context i18n editing for React, Vue, Angular, and Svelte.

## Install

```sh
npm install @localive/adapter-react-intl react-intl
```

Requires the peer dependencies `react-intl` (>=3) and `@localive/core`.

## Usage

```ts
import { withReactIntl } from '@localive/adapter-react-intl';
import { IntlProvider } from 'react-intl';

// Pass the intl shape — locale, messages, and optional onLocaleChange/setLocale
const adapter = withReactIntl({
  locale: 'en',
  messages: { en: { 'app.title': 'Hello' }, fr: { 'app.title': 'Bonjour' } },
});
```

See the full documentation at **https://localive.vercel.app/concepts/adapters/**.

## License

MIT © Localive, see [LICENSE](./LICENSE).
