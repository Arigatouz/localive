# Localive Svelte Playground

A demo app showing Localive's in-context i18n editing with Svelte 5.

## What it demonstrates

- `@localive/svelte` — `initLocalive` + `LiveEditorOverlay` + `getLocaliveState`
- `@localive/vite` — dev-server plugin that injects the save middleware
- Uses an inline adapter (no `@localive/adapter-svelte-i18n` dependency) for simplicity
- Tag elements with `data-i18n-key` to make them editable in the overlay

## Development

```bash
npx nx serve playground-svelte
```

Then open the URL, click any text to edit the translation inline.

## Building

```bash
npx nx build playground-svelte
```