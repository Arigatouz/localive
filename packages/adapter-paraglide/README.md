# @localive/adapter-paraglide

> Edit Paraglide JS messages by clicking them in your running app.

Part of [Localive](https://github.com/Arigatouz/localive), live in-context i18n editing for React, Vue, Angular, and Svelte.

Paraglide compiles messages into functions, so the rendered text no longer says which key it came from. In development, this adapter wraps each compiled message so that, in edit mode, its output carries an invisible marker naming the key and locale. Clicking text then opens that exact message, wherever it was rendered: in a component, a prop, `$derived` state, `load` data, an attribute or the page title.

Requires Paraglide JS 3 with messages stored by `@inlang/plugin-message-format`. Tested with SvelteKit 3.

## Install

```sh
npm install -D @localive/adapter-paraglide @localive/core @localive/vite @localive/svelte
```

## Usage

Add the Localive plugin after Paraglide's, with the same project path:

```js
// vite.config.js
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { paraglideIntegration } from '@localive/adapter-paraglide/vite';
import { localiveVite } from '@localive/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    paraglideVitePlugin({ project: './project.inlang', outdir: './src/lib/paraglide' }),
    localiveVite({ integration: paraglideIntegration({ project: './project.inlang' }) }),
    sveltekit(),
  ],
});
```

Render the editor in your root layout during development:

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { createParaglideAdapter } from '@localive/adapter-paraglide';
  import { LocaliveEditor } from '@localive/svelte';
  import { getLocale, locales } from '$lib/paraglide/runtime.js'; // #lib/... in SvelteKit 3

  let { children } = $props();
</script>

{@render children()}

{#if import.meta.env.DEV}
  <LocaliveEditor createAdapter={() => createParaglideAdapter({ getLocale })} locales={[...locales]} />
{/if}
```

Click **Edit translations**, then click any text. Saving writes the message files and Paraglide reloads the page with the new text.

## What you can edit

- Plain messages and messages with inputs, such as `Hello {name}`
- Each branch of a plural or select message
- Translations missing in a locale, added in the same file and nesting as the base locale
- Markup messages, such as `Read {#link}the terms{/link}`

Saves change only the bytes of that message. They are refused when they would add an input or markup the message does not have, leave markup unbalanced, or overwrite a value someone changed since you opened it.

## Behaviour in edit mode

Markers exist only while edit mode is on. Outside it, and in production builds, messages return exactly what Paraglide returns. In edit mode:

- `m.title() === 'Some text'` is false. Wrap values used in URLs, headers or comparisons in `untag()`, or exclude their keys:

  ```js
  import { untag } from '@localive/adapter-paraglide';
  paraglideIntegration({ project: './project.inlang', exclude: ['product_slug', /^seo\./] });
  ```

- Copied text and submitted form values have their markers removed.
- Alt+click presses buttons and Ctrl/Cmd+click opens links, as a plain click opens the editor.

## API

| Entry | Export | Purpose |
| --- | --- | --- |
| `@localive/adapter-paraglide/vite` | `paraglideIntegration({ project, exclude? })` | Integration for `localiveVite` |
| `@localive/adapter-paraglide` | `createParaglideAdapter({ getLocale, endpoint?, reloadPage? })` | Loads the message catalog and returns the adapter |
| `@localive/adapter-paraglide` | `untag(text)` | Removes markers from a string |
| `@localive/adapter-paraglide/runtime` | `tag`, `untag` | Used by the instrumented messages |

## License

MIT © Localive, see [LICENSE](./LICENSE).
