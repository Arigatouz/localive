# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo status

Localive is a live in-context i18n editing toolkit for React, Vue, Angular, and Svelte. Nx monorepo with npm workspaces.

Phases 1–4 and 6 are complete. P5 (AI plugin) is deferred — the `packages/ai-openai/` directory has been removed.

- All 16 packages build, test, and typecheck clean.
- **Published to npm**: all 15 npm packages are at `0.1.4` under the `@localive/*` scope. The VS Code extension is not yet on the Marketplace.
- All packages have `README.md`, `LICENSE`, `repository`, `homepage`, `bugs`, `keywords`, and `publishConfig` metadata. See `RELEASE-GUIDE.md` for the full release process.

## Commands

Run from repo root (`localive/`):

```sh
npx nx run-many -t build --outputStyle=static        # build all
npx nx run-many -t test --outputStyle=static         # test all
npx nx run-many -t typecheck --outputStyle=static    # typecheck all
npx nx test <project-name>                           # single package test
npm run lint:all                                     # lint (direct eslint; no Nx lint targets exist)
npm run check-bundle-sizes                           # browser bundle size limits (CLI excluded)
npx nx e2e playground-e2e                             # e2e
npm install --legacy-peer-deps                       # install (required: Angular zone.js peer conflict)
```

**Important**: `npm run lint` (via `npx nx run-many -t lint`) does nothing — no project has a `lint` Nx target. Always use `npm run lint:all` instead.

**Important**: `npm install` fails without `--legacy-peer-deps` due to an Angular zone.js peer dependency conflict. Always use `npm install --legacy-peer-deps` or `npm ci`.

## Architecture

### Workspace layout

| Layer                           | Packages                                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| Core                            | `@localive/core`                                                                                    |
| Adapters (`packages/adapter-*`) | i18next, react-intl, vue-i18n, transloco, ngx-translate, svelte-i18n                                |
| Clients (`packages/client-*`)   | `@localive/react`, `@localive/vue`, `@localive/angular`, `@localive/svelte`                         |
| Plugins                         | `@localive/vite`, `@localive/webpack`, `@localive/plugin-angular`                                   |
| CLI                             | `@localive/cli` — `extract`, `validate`, `sync`, `types` commands                                   |
| VS Code                         | `@localive/vscode` — hover, completion, definition, references, diagnostics, create-key, rename-key |
| Apps (`apps/*`)                 | `playground-{react,vue,angular,svelte}`, `playground-e2e`, `website`                                |

### Package dependency graph (scope tags → allowed deps)

```
scope:core        → nothing
scope:adapter     → core
scope:client:*    → core
scope:plugin      → core
scope:cli         → core
scope:vscode      → core, cli
scope:app         → core, adapters, clients, plugins (not cli)
```

`scope:app` intentionally excludes `scope:cli` — playgrounds must not depend on CLI tooling. Most packages infer tags from the Nx graph; explicit `tags` in `project.json` exist for `cli`, `vscode`, and `website`.

### Key packages

| Package                    | Tag                    | Notes                                                                                                                                                                                                                  |
| -------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@localive/core`           | `scope:core`           | Browser-compatible, zero runtime deps. Shared pure utils (`localeFromPath`, `sortedKeys`, validation).                                                                                                                 |
| `@localive/cli`            | `scope:cli`            | Node CLI. Externalizes `@localive/core` and all Node builtins in its Vite build. Has `paths: {}` in tsconfig to avoid DTS pulling in core source.                                                                      |
| `@localive/vite`           | `scope:plugin`         | Dev-server plugin. Has its own `writeTranslationToFile` (single-key, indentation-preserving) and `scanTranslationFiles` (locale-aware). No runtime dep on core.                                                        |
| `@localive/angular`        | `scope:client:angular` | Built with ng-packagr, not Vite. Has `sourceRoot: undefined` in the Nx project graph.                                                                                                                                  |
| `@localive/vscode`         | `scope:vscode`         | VS Code extension. Built with esbuild (CJS, node18 target) — not Vite, no declaration files. Typecheck uses `tsc --noEmit`. Pure logic tested via vitest; VS Code providers tested manually in the Extension Dev Host. |
| `website` (`apps/website`) | `scope:app`            | Astro 6 + Starlight 0.40 docs site. Landing page at `/`, docs at root level (no `/docs/` prefix). Cyberpunk dual-theme (dark/light) with an animated inline SVG logo. Build with `npx nx build website`.               |

### Shared utilities in core

`@localive/core` exports `localeFromPath` and `sortedKeys`. The CLI uses both; plugin-vite does not (it has no runtime dep on core and uses an inline `basename()`).

## Gotchas

- **CLI tsconfig**: `packages/cli/tsconfig.json` overrides `paths: {}` to prevent vite-plugin-dts from resolving `@localive/core` to source files. If you add a new workspace package dependency to the CLI, mirror this override.
- **CLI Vite build**: `@localive/core` is explicitly externalized in `rollupOptions.external`. New workspace deps added to the CLI must also be added there.
- **Bundle size script** (`npm run check-bundle-sizes`): Only checks browser-facing packages. CLI is intentionally excluded.
- **Angular playground**: Has no `project.json`; config lives in `package.json`. May show intermittent Nx boundary-rule warnings when the daemon cache is cold — not a real violation.
- **Prettier**: `singleQuote: true`, no semicolons — matches the existing codebase.
- **ESLint**: Flat config at `eslint.config.mjs` (repo root). No per-project eslint files.
- **Test environments**: Core and browser packages use `jsdom`; CLI and VS Code use the `node` environment.
- **VS Code extension**: Uses esbuild (not Vite) since extensions require CJS output. The `@localive/vscode` tsconfig deliberately does **not** extend `tsconfig.base.json`, to avoid a `moduleResolution: bundler` vs `module: commonjs` conflict. VS Code API–dependent code is tested manually in the Extension Development Host.
- **Website (Astro + Starlight)**: `<pre><code>` blocks containing JS `import` syntax cause esbuild parse errors during build — use `<p>`/`<div>` for code examples on the landing page. The same bug affects `<meta property="og:*">` tags; add OG meta via Starlight's `head` config in `astro.config.mjs` instead. `@astrojs/sitemap` requires `site` to be set in `astro.config.mjs`.
- **Website logo**: The animated logo is **inline SVG** via `src/components/CyberLogo.astro`. Do NOT use `<img src="logo.svg">` — SVGs with `fill="none"` render invisible in `<img>` (`naturalWidth: 0`). Theme switching keys off `html[data-theme="dark|light"]`; both themes share `localStorage('starlight-theme')`.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
