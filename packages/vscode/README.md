# Localive for VS Code

> Work with i18n keys without leaving your editor. Hover to preview translations, autocomplete keys, jump to definitions, find references, spot missing keys, and rename across every locale. Supports React, Vue, Angular, and Svelte.

Part of [Localive](https://github.com/Arigatouz/localive), live in-context i18n editing for React, Vue, Angular, and Svelte.

## Features

| Feature | How to use |
|---|---|
| **Hover preview** | Hover a key like `t('nav.home')` to see all locale translations |
| **Autocomplete** | Type `t('` to get key suggestions |
| **Go-to-definition** | Ctrl/Cmd+click a key to jump to its locale JSON |
| **Find references** | See everywhere a key is used |
| **Diagnostics** | Missing keys are flagged in the Problems panel |
| **Create key** | Select text → "Localive: Create Translation Key" |
| **Rename key** | Rename a key across all locales and source files |

Supported languages: TypeScript, TSX, JavaScript, JSX, Vue, Svelte, HTML.

## Settings

| Setting | Default | Description |
|---|---|---|
| `localive.localePaths` | `["src/i18n/**/*.json", "src/locales/**/*.json", "public/locales/**/*.json"]` | Glob patterns for locale JSON files |
| `localive.defaultLocale` | `"en"` | Default/source locale code |
| `localive.sourcePaths` | `["src/**/*.{ts,tsx,js,jsx,vue,svelte,html}"]` | Source files to scan for key usage |

See the full documentation at **https://localive.vercel.app/vscode/**.

## License

MIT © Localive, see [LICENSE](./LICENSE).
