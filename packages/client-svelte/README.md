# @localive/svelte

> Svelte component for Localive — live, in-context i18n editing.

Part of [Localive](https://github.com/Arigatouz/localive) — click any text in your running app, edit the translation, and it saves back to your locale files.

## Install

```sh
npm install @localive/svelte @localive/adapter-svelte-i18n @localive/vite
```

Requires the peer dependencies `svelte` (>=5) and `@localive/core`.

## Usage

```svelte
<script lang="ts">
  import LocaliveWrapper from '@localive/svelte';
  import { withSvelteI18n } from '@localive/adapter-svelte-i18n';
  import { locale, locales, _ } from 'svelte-i18n';

  const adapter = withSvelteI18n({ locale, locales, t: $_ });
</script>

<LocaliveWrapper {adapter} locales={['en', 'fr']} defaultLocale="en">
  <!-- your app -->
</LocaliveWrapper>
```

See the full documentation at **https://localive.vercel.app/guides/svelte/**.

## License

MIT © Localive — see [LICENSE](./LICENSE).
