# Localive Vue Playground

A demo app showing Localive's in-context i18n editing with Vue and vue-i18n.

## What it demonstrates

- `@localive/vue` — `createLocalivePlugin` + `LiveEditorOverlay` + `vLocaliveTag` directive
- `@localive/adapter-vue-i18n` — wires vue-i18n as the i18n adapter
- `@localive/vite` — dev-server plugin that injects the save middleware
- Tag elements with `data-i18n-key` to make them editable in the overlay

## Development

```bash
npx nx serve playground-vue
```

Then open the URL, click any text to edit the translation inline.

## Building

```bash
npx nx build playground-vue
```