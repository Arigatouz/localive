# @localive/svelte

> Svelte 5 bindings for Localive's in-app translation editor.

Part of [Localive](https://github.com/Arigatouz/localive) — click any text in your running app, edit the translation, and it saves straight back to your locale files.

## Install

```sh
npm install @localive/svelte @localive/core @localive/vite
```

Requires `svelte` 5 or later. The package ships Svelte source files, which your app compiles for the server and the browser, and is ESM only.

## The editor

Hover over text to highlight it, click to edit:

- One field per locale, and per branch for plural and select messages, with the clicked locale first and missing translations marked
- A live preview in the page while you type, when the adapter supports it
- Enter saves, Shift+Enter adds a line, Escape closes; save errors appear next to the field
- A choice between messages when one element holds several, and a list of every message on the page for strings you cannot click, such as the title
- Alt+click presses buttons and Ctrl/Cmd+click opens links while editing

## With an async adapter: `LocaliveEditor`

`LocaliveEditor` creates the Localive instance in the browser after mounting, so its adapter may load data first. It is how the Paraglide adapter is used:

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { createParaglideAdapter } from '@localive/adapter-paraglide';
  import { LocaliveEditor } from '@localive/svelte';
  import { getLocale, locales } from '$lib/paraglide/runtime.js';

  let { children } = $props();
</script>

{@render children()}

{#if import.meta.env.DEV}
  <LocaliveEditor createAdapter={() => createParaglideAdapter({ getLocale })} locales={[...locales]} />
{/if}
```

| Prop | Required | Description |
| --- | :---: | --- |
| `createAdapter` | ✅ | Returns an `I18nAdapter`, or a promise of one |
| `locales` | ✅ | Locales to offer fields for |
| `defaultLocale` | ❌ | Defaults to the first locale |
| `endpoint` | ❌ | Save endpoint of the dev server plugin |

If the adapter cannot be created, an alert explains why.

## With a synchronous adapter: `initLocalive`

Call `initLocalive` inside a component, as Svelte's `setContext` requires, then render `LiveEditorOverlay`:

```svelte
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
<LiveEditorOverlay locales={['en', 'fr']} />
```

With adapters that cannot tell which key rendered an element, tag it with `data-i18n-key`. `LiveEditorOverlay` reads the instance from the context, or takes it as the `instance` prop.

Descendant components can read `{ instance, isActive, currentLocale }` with `getLocaliveState()`, or use the rune-based `useLocaliveEditor(instance)`.

See the full documentation at **https://localive.vercel.app/guides/svelte/**.

## License

MIT © Localive, see [LICENSE](./LICENSE).
