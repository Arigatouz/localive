# @localive/cli

> Localive CLI — extract, validate, sync, and generate types for your translation keys.

Part of [Localive](https://github.com/localive/localive) — live, in-context i18n editing for React, Vue, Angular, and Svelte.

## Install

```sh
npm install -g @localive/cli
# or run without installing:
npx @localive/cli --help
```

## Commands

| Command | What it does |
|---|---|
| `localive extract` | Scan source files for translation keys and write them to a locale JSON file |
| `localive validate` | Report missing, extra, and empty translations across locales (exit code 1 on issues — CI-friendly) |
| `localive sync` | Add missing keys from the default locale to all other locales |
| `localive types` | Generate a TypeScript union type of all translation keys |

```sh
localive extract --src "src/**/*.{ts,tsx}" --locale en --output src/locales/en.json
localive validate --locales "src/locales/*.json" --default en
```

See the full documentation at **https://localive.dev**.

## License

MIT © Localive — see [LICENSE](./LICENSE).
