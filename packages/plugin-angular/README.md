# @localive/plugin-angular

> Angular CLI builder that lets Localive save translation edits during development.

Part of [Localive](https://github.com/Arigatouz/localive) — live in-context i18n editing for React, Vue, Angular, and Svelte.

## Install

```sh
npm install -D @localive/plugin-angular
```

Requires the peer dependencies `@angular-devkit/build-angular` (>=17), `@angular-devkit/architect` (>=0.1700), and `rxjs` (>=7).

## Usage

Swap the `serve` target builder in `angular.json` to `@localive/plugin-angular:dev-server`. Put the `localive` options at the top level (apply to every configuration) and keep `buildTarget` in each configuration, just like the stock dev server:

```json
{
  "projects": {
    "my-app": {
      "architect": {
        "serve": {
          "builder": "@localive/plugin-angular:dev-server",
          "options": {
            "localive": {
              "translationsPath": "src/locales",
              "locales": ["en", "fr"],
              "defaultLocale": "en"
            }
          },
          "configurations": {
            "development": { "buildTarget": "my-app:build:development" },
            "production":   { "buildTarget": "my-app:build:production" }
          },
          "defaultConfiguration": "development"
        }
      }
    }
  }
}
```

Every standard dev-server option (`port`, `host`, `open`, `proxyConfig`, `ssl`, `liveReload`, `hmr`, `watch`, `poll`, `forceEsbuild`, `prebundle`, `headers`, `allowedHosts`, `disableHostCheck`, `publicHost`, `servePath`, `verbose`, `sslKey`, `sslCert`, `inspect`) is forwarded unchanged to the underlying `@angular-devkit/build-angular:dev-server`.

### `localive` options

| Option | Type | Required | Default | Description |
|--------|------|:---:|---------|-------------|
| `translationsPath` | `string` | ✅ | — | Root directory holding your locale JSON files. |
| `locales` | `string[]` | ✅ | — | Supported locale codes, e.g. `["en", "fr", "de"]`. |
| `defaultLocale` | `string` | ❌ | first in `locales` | Source / fallback locale. |
| `endpoint` | `string` | ❌ | `/__localive-update` | Path the overlay POSTs save requests to. |
| `searchRoots` | `string[]` | ❌ | `[]` | Additional directories scanned for locale JSON files. |
| `ws` | `boolean` | ❌ | `false` | Enable WebSocket transport for multi-tab sync. |
| `wsPort` | `number` | ❌ | auto | WebSocket port used for sync. |

> The `build` builder is **not** replaced. Only `serve` uses the Localive builder; your `build` target keeps using `@angular-devkit/build-angular:application` (or `browser`).

See the full documentation at **https://localive.vercel.app/plugins/angular/**.

## License

MIT © Localive, see [LICENSE](./LICENSE).