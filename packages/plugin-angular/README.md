# @localive/plugin-angular

> Angular CLI builder that lets Localive save translation edits during development.

Part of [Localive](https://github.com/Arigatouz/localive), live in-context i18n editing for React, Vue, Angular, and Svelte.

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

See the full documentation at **https://localive.vercel.app/plugins/angular/**.

## License

MIT © Localive, see [LICENSE](./LICENSE).
