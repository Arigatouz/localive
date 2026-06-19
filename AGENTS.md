# Localive — Agent Guide

## Repo status

Phases 1-4 and 6 (website/docs) are complete. P5 (AI plugin) is deferred.
Website redesign (cyberpunk theme + animated logo + light/dark mode) is complete.
Release guide created at `RELEASE-GUIDE.md`. All packages are at `0.0.1` and ready for publishing.

## Release status

- All 17 packages build, test, and typecheck clean
- **Not yet published to npm** — all are at `0.0.1` with `@localive/*` scope
- **VS Code extension not yet published** to Marketplace — publisher `localive` must be created
- **Missing files for publishing**: No packages have `README.md` or `LICENSE` files (required by npm). See `RELEASE-GUIDE.md` Section 3.4-3.5 for instructions.
- **Missing metadata**: No packages have `repository`, `homepage`, `bugs`, `keywords`, or `publishConfig` fields. See `RELEASE-GUIDE.md` Section 3.2.

## Commands

Run from repo root (`localive/`):

```sh
npx nx run-many -t build --outputStyle=static      # build all
npx nx run-many -t test --outputStyle=static        # test all
npx nx run-many -t typecheck --outputStyle=static    # typecheck all
npx nx test <project-name>                           # single package test
npm run lint:all                                     # lint (direct eslint; no Nx lint targets exist)
npm run check-bundle-sizes                           # browser bundle size limits (CLI excluded)
npx nx e2e playground-e2e                             # e2e
npm install --legacy-peer-deps                       # install (required: Angular zone.js peer conflict)
```

**Important**: `npm run lint` (via `npx nx run-many -t lint`) does nothing — no project has a `lint` Nx target. Always use `npm run lint:all` instead.

**Important**: `npm install` fails without `--legacy-peer-deps` due to Angular zone.js peer dependency conflict. Always use `npm install --legacy-peer-deps` or `npm ci`.

## Architecture

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

`scope:app` intentionally excludes `scope:cli` — playgrounds must not depend on CLI tooling.

### Key packages

| Package | Tag | Notes |
|---|---|---|
| `@localive/core` | `scope:core` | Browser-compatible, zero runtime deps. Contains shared pure utils (`localeFromPath`, `sortedKeys`, validation). |
| `@localive/cli` | `scope:cli` | Node CLI. Externalizes `@localive/core` and all Node builtins in Vite build. Has `paths: {}` in tsconfig to avoid DTS pulling in core source. |
| `@localive/vite` | `scope:plugin` | Dev-server plugin. Has its own `writeTranslationToFile` (single-key, indentation-preserving) and `scanTranslationFiles` (locale-aware). |
| `@localive/angular` | `scope:client:angular` | Built with ng-packagr, not Vite. Has `sourceRoot: undefined` in Nx project graph. |
| `@localive/vscode` | `scope:vscode` | VS Code extension. Built with esbuild (CJS, node18 target). No Vite. No declaration files. Typecheck uses `tsc --noEmit`. Pure logic tested via vitest; VS Code providers tested manually in Extension Dev Host. |
| `@localive/website` | `scope:app` | Astro 6 + Starlight 0.40 docs site. Landing page at `/`, docs at root level (no `/docs/` prefix). Built with `npx nx build website`. Cyberpunk dual-theme (dark/light) with animated inline SVG logo. Note: `<pre><code>` blocks with JS `import` syntax cause esbuild errors in Astro — use plain `<p>` or `<div>` for code examples on the landing page. OG meta tags must be added via Starlight head config, not raw HTML `<meta property="og:*">` tags (same esbuild bug). |

### Shared utilities in core

`@localive/core` exports `localeFromPath` and `sortedKeys`. The CLI uses both; plugin-vite does not (it has no runtime dep on core, uses inline `basename()`).

## Publishing

See `RELEASE-GUIDE.md` for the complete step-by-step guide. Key points:

- **npm packages**: 17 packages under `@localive/*` scope. Publish in dependency order: core → adapters → clients → plugins → CLI. Use `npm publish --access public` (or add `"publishConfig": { "access": "public" }` to each package.json).
- **VS Code extension**: Published via `vsce` to the VS Code Marketplace, not npm. Publisher name `localive` in `packages/vscode/package.json` must match the Marketplace publisher ID exactly. Use `vsce package --no-dependencies` (esbuild bundles everything). PAT must have **Marketplace → Manage** scope and **All accessible organizations**.
- **Missing files**: No packages have `README.md` or `LICENSE` files yet — both required by npm. See `RELEASE-GUIDE.md` Section 3.4-3.5.
- **Missing metadata**: No packages have `repository`, `homepage`, `bugs`, `keywords`, or `publishConfig` fields. See `RELEASE-GUIDE.md` Section 3.2.

## Gotchas

- **CLI tsconfig**: `packages/cli/tsconfig.json` overrides `paths: {}` to prevent vite-plugin-dts from resolving `@localive/core` to source files. If you add a new workspace package dependency to CLI, you may need to mirror this override.
- **CLI Vite build**: `@localive/core` is explicitly externalized in `rollupOptions.external`. New workspace deps added to CLI must also be added there.
- **Bundle size script** (`npm run check-bundle-sizes`): Only checks browser-facing packages. CLI is intentionally excluded.
- **Angular playground**: Has no `project.json`; config lives in `package.json`. May show intermittent Nx boundary-rule warnings when daemon cache is cold — not a real violation.
- **Prettier**: `singleQuote: true` — no semicolons rule; matches existing codebase.
- **eslintrc is flat config**: `eslint.config.mjs` at repo root. No per-project eslint files.
- **Test environments**: Core and browser packages use `jsdom`; CLI and VS Code use `node` environment.
- **VS Code extension**: Uses esbuild (not Vite) since VS Code extensions require CJS output. Typecheck target uses `tsc --noEmit` (not `tsc --build --emitDeclarationOnly`). The `@localive/vscode` tsconfig does not extend `tsconfig.base.json` to avoid `moduleResolution: bundler` conflict with `module: commonjs`. Pure logic is tested via vitest; VS Code API–dependent code is tested manually in Extension Development Host.
- **Website (Astro + Starlight)**: `<pre><code>` blocks containing JS `import` syntax cause esbuild parse errors during build. Use `<p>` tags or other HTML for code examples on the landing page. Same issue affects `<meta property="og:*">` tags — add OG meta via Starlight's `head` config in `astro.config.mjs` instead. The `@astrojs/sitemap` integration requires `site` to be set in `astro.config.mjs`.
- **Website logo**: The animated cyberpunk logo uses **inline SVG** via `src/components/CyberLogo.astro` (imported by `SiteTitle.astro` for Starlight header and `index.astro` for landing page). Do NOT use `<img src="logo.svg">` — SVGs with `fill="none"` render as invisible in `<img>` tags (`naturalWidth: 0`). The SVGs use SMIL animations (draw-on, glitch, scanline, data-flow particles) with CSS `drop-shadow` glow on top. Theme switching: `html[data-theme="dark"] .logo-light { display: none }` and vice versa. Both themes share `localStorage('starlight-theme')`.
- **Website dual theme**: Dark and light themes via `html[data-theme="dark"]` / `html[data-theme="light"]` in `custom.css`. Landing page uses `--lp-*` tokens scoped to `body.landing-page`. Starlight docs use `--sl-color-*` and `--cyber-*` tokens. CRT scanlines only in dark mode (`--lp-crt-opacity: 0` in light). FOUC prevention script in `index.astro` reads `localStorage('starlight-theme')` before paint.
- **Stack badges**: Landing page "Works with your stack" badges use `data-color` attributes for per-framework brand colors on hover (React `#61DAFB`, Vue `#42B883`, Angular `#DD0031`, Svelte `#FF3E00`, i18next `#2496ED`, Transloco/ngx-translate `#E23E6D`). CSS uses `var(--badge-color)` set via `[data-color="..."]` selectors.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e., `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
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