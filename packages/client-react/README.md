# @localive/react

> React bindings for Localive. Add the provider and edit translations inline as the app runs.

Part of [Localive](https://github.com/Arigatouz/localive), click any text in your running app, edit the translation, and it saves back to your locale files.

## Install

```sh
npm install @localive/react @localive/adapter-i18next @localive/vite
```

Requires the peer dependencies `react` (>=18), `react-dom` (>=18), and `@localive/core`.

## Usage

```tsx
import { LocaliveProvider } from '@localive/react';
import { withI18next } from '@localive/adapter-i18next';
import i18n from './i18n';

<LocaliveProvider adapter={withI18next(i18n)} locales={['en', 'fr']} defaultLocale="en">
  <App />
</LocaliveProvider>
```

See the full documentation at **https://localive.vercel.app/guides/react/**.

## License

MIT © Localive, see [LICENSE](./LICENSE).
