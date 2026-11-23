# SvelteKit + Paraglide example

A SvelteKit 3 app using Paraglide JS 3, with Localive's visual editor. It installs the Localive packages from this repository, as an app installs them from npm.

## Run it

Build the Localive packages, then install and start the example:

```sh
npx nx run-many -t build -p @localive/core @localive/vite @localive/adapter-paraglide @localive/svelte
cd examples/sveltekit-paraglide
npm install
npm run dev
```

`npx nx dev example-sveltekit-paraglide` does all of this in one step.

Open http://localhost:5176 and click **Edit translations**. Saving changes the files in `messages/`.

## What to try

| Page | Shows |
| --- | --- |
| `/` | Plain text, an input, a nested key, a plural, markup, a prop, `$derived`, an attribute, the page title, duplicate text and a missing French translation |
| `/loads` | Messages returned by server and universal `load` functions |
| `/form` | A `use:enhance` form whose submitted value carries no markers |

In edit mode, Alt+click presses buttons and Ctrl/Cmd+click opens links in a new tab.

## Production build

`npm run build` builds the app and fails if any Localive code, marker or endpoint reaches the browser bundle.
