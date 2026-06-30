# Localive React Playground

A demo app showing Localive's in-context i18n editing with React and i18next.

## What it demonstrates

- `@localive/react` — `LocaliveProvider` + `LiveEditorOverlay`
- `@localive/adapter-i18next` — wires i18next as the i18n adapter
- `@localive/vite` — dev-server plugin that injects the save middleware
- Tag elements with `data-i18n-key` to make them editable in the overlay

## Development

```bash
npx nx serve playground-react
```

Then open the URL, click any text to edit the translation inline.

## Building

```bash
npx nx build playground-react
```