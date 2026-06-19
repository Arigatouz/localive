# @localive/plugin-angular

> Angular CLI builder for Localive — enables live i18n editing in `ng serve`.

Part of [Localive](https://github.com/localive/localive) — live, in-context i18n editing for React, Vue, Angular, and Svelte.

## Install

```sh
npm install -D @localive/plugin-angular
```

Requires the peer dependency `@angular-devkit/build-angular` (>=17).

## Usage

```json
// angular.json
"build": {
  "builder": "@localive/plugin-angular:build",
  "options": { "localeDir": "src/assets/i18n", "defaultLocale": "en" }
}
```

See the full documentation at **https://localive.dev**.

## License

MIT © Localive — see [LICENSE](./LICENSE).
