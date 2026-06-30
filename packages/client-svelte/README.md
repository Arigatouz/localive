# @localive/svelte

> Svelte 5 bindings for Localive's in-app translation editor.

Part of [Localive](https://github.com/Arigatouz/localive) — click any text in your running app, edit the translation, and it saves straight back to your locale files.

## Install

```sh
npm install @localive/svelte @localive/adapter-svelte-i18n @localive/vite
```

Requires the peer dependencies `svelte` (>=5) and `@localive/core`.

> The Svelte client uses Svelte 5 runes internally; Svelte 4 is not supported.

## Usage

Initialize Localive **inside a component** (Svelte's `setContext` requires it). `initLocalive` takes the adapter as its first argument and the locale options as the second:

```svelte
<!-- App.svelte -->
<script lang="ts">
  import { initLocalive, LiveEditorOverlay } from '@localive/svelte';
  import { withSvelteI18n } from '@localive/adapter-svelte-i18n';
  import { _, locale } from 'svelte-i18n';

  initLocalive(withSvelteI18n({ _, locale }), {
    locales: ['en', 'fr'],
    defaultLocale: 'en',
  });
</script>

<h1 data-i18n-key="app.title">{$_('app.title')}</h1>
<LiveEditorOverlay />
```

Tag elements with `data-i18n-key="your.key"` so the overlay can resolve clicks to the right locale entry. `LiveEditorOverlay` takes **no props** — it reads the Localive instance from the Svelte context set by `initLocalive`.

In descendant components, `getLocaliveState()` returns the `{ instance, isActive, currentLocale }` state for reactive bindings:

```svelte
<script lang="ts">
  import { getLocaliveState } from '@localive/svelte';
  const { isActive, instance } = getLocaliveState();
</script>
```

> The Svelte `LiveEditorOverlay` currently renders a single floating **toggle button** to activate the inspector. The hover-highlight and editor panel present in React/Vue overlays are not yet ported.

See the full documentation at **https://localive.vercel.app/guides/svelte/**.

## License

MIT © Localive, see [LICENSE](./LICENSE).