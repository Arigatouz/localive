# Localive Angular Playground

A demo app showing Localive's in-context i18n editing with Angular and Transloco.

## What it demonstrates

- `@localive/angular` — `provideLocalive` + `LiveEditorOverlayComponent` for the inspector overlay
- `@localive/adapter-transloco` — wires Transloco as the i18n adapter
- `@localive/plugin-angular:dev-server` — the Angular CLI builder that injects Localive's save middleware (configured in `angular.json`)

## Development server

The `serve` target in `angular.json` uses `@localive/plugin-angular:dev-server` (not the stock `@angular-devkit/build-angular:dev-server`). This builder wraps the Angular dev server and injects the Localive save middleware so translation edits in the browser write back to `src/locales/*.json`.

```bash
npx nx serve playground-angular
```

Then open `http://localhost:4200/`, click any text to edit the translation inline.

## Building

```bash
npx nx build playground-angular
```