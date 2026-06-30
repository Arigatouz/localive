# @localive/cli

> Command-line tools for Localive. Extract, validate, sync, and generate types for your translation keys.

Part of [Localive](https://github.com/Arigatouz/localive) — live in-context i18n editing for React, Vue, Angular, and Svelte.

## Install

```sh
npm install -g @localive/cli
# or run without installing:
npx @localive/cli --help
```

## Commands

| Command | What it does |
|---|---|
| `localive extract` | Scan source files for translation keys and report them |
| `localive validate` | Compare extracted keys against locale files; exits with code 1 on missing/extra/empty (CI-friendly) |
| `localive sync` | Add missing keys from the source locale to all other locales |
| `localive types` | Generate a TypeScript union type of all translation keys |

## Flags

| Flag | Applies to | Description |
|---|---|---|
| `--source <path>` | extract, validate, sync | Source root to scan (repeatable). Defaults to `src`. |
| `--locale-file <path>` | validate, sync, types | Locale JSON file (repeatable). Defaults to `src/locales/*.json`. |
| `--source-locale <code>` | sync | Locale used when syncing with source values (e.g. `en`). |
| `--missing-value <kind>` | sync | Strategy for missing values: `empty` or `source`. |
| `--out <path>` | types | Output file for the generated declarations. |
| `--json` | all | Print structured JSON instead of human-readable text. |
| `--help`, `-h` | all | Show help. |

## Examples

```sh
# Extract keys from your source code
localive extract --source src --json

# Validate locale files against extracted keys (fails CI if anything is missing)
localive validate --source src --locale-file src/locales/en.json

# Sync missing keys from the source locale into other locale files
localive sync --source src --locale-file src/locales/fr.json --source-locale en --missing-value empty

# Generate TypeScript types for your keys
localive types --locale-file src/locales/en.json --out src/i18n.d.ts
```

See the full documentation at **https://localive.vercel.app/cli/overview/**.

## License

MIT © Localive, see [LICENSE](./LICENSE).