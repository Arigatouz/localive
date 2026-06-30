# Localive — Release Guide

Step-by-step guide for publishing all 16 Localive packages to npm and the VS Code Marketplace.

## 0. Prerequisites

- Node 20+ and npm 9+
- `npm` CLI authenticated to npmjs (run `npm whoami` to confirm; `npm login` if not)
- `vsce` CLI installed (`npm i -g @vscode/vsce`)
- An npm org `@localive` created at https://www.npmjs.com/org/create — this scopes every publish under `@localive/*`
- A VS Code Marketplace publisher named `localive` at https://marketplace.visualstudio.com/manage — the `publisher` field in `packages/vscode/package.json` must match this ID exactly
- A Visual Studio Marketplace Personal Access Token (PAT) via Azure DevOps: scope **Marketplace → Manage** for **All accessible organizations**. The PAT is only required once to `vsce login`, then cached.

## 1. Verify the build before publishing

From the repo root (`localive/`):

```sh
npm install --legacy-peer-deps                   # required (Angular zone.js peer conflict)
npx nx run-many -t build --outputStyle=static    # all 16 packages + apps
npx nx run-many -t typecheck --outputStyle=static
npx nx run-many -t test --outputStyle=static
npm run lint:all                                  # flat eslint (NOT npm run lint — no Nx lint target)
npm run check-bundle-sizes                          # browser bundle limits (CLI excluded by design)
npx nx build website                               # Astro docs site (optional, only when publishing docs)
```

All of the above must pass before publishing. If any fail, fix the failure — do not publish a broken build.

## 2. npm packages (15 packages)

### Publish order (dependency-first)

Publish in this order so each package's transitive deps are already on the registry when consumers install it:

1. `@localive/core`
2. 6 adapters → `@localive/adapter-i18next`, `@localive/adapter-vue-i18n`, `@localive/adapter-svelte-i18n`, `@localive/adapter-transloco`, `@localive/adapter-ngx-translate`, `@localive/adapter-react-intl`
3. 4 clients → `@localive/react`, `@localive/vue`, `@localive/angular`, `@localive/svelte`
4. 3 plugins → `@localive/vite`, `@localive/webpack`, `@localive/plugin-angular`
5. `@localive/cli`

### Per-package steps

For each package directory (`cd packages/<name>`):

1. Confirm `package.json` `version` is correct (currently `0.1.4`; bump per semver on subsequent releases).
2. Confirm `publishConfig.access` is `"public"` (already set in all 15 packages).
3. Confirm the build output exists in `dist/` (run `npx nx build <name>` from the repo root if not).
4. Inspect what will be published:
   ```sh
   npm pack --dry-run
   ```
   Verify only `dist/`, `README.md`, and `LICENSE` are included (check `.npmignore` / `files` field if anything else shows up).
5. Publish:
   ```sh
   npm publish --access public
   ```
6. Sanity-check on the registry:
   ```sh
   npm view @localive/<name>@<version>
   ```

### One-command publish (optional)

To publish all 15 npm packages from the repo root in dependency order:

```sh
npm publish --access public -w packages/core
for p in adapter-i18next adapter-vue-i18n adapter-svelte-i18n adapter-transloco adapter-ngx-translate adapter-react-intl; do
  npm publish --access public -w packages/$p
done
for p in client-react client-vue client-angular client-svelte; do
  npm publish --access public -w packages/$p
done
for p in plugin-vite plugin-webpack plugin-angular; do
  npm publish --access public -w packages/$p
done
npm publish --access public -w packages/cli
```

> ⚠️ Do not use `npm publish --workspaces` blindly — it publishes in workspace-declaration order, not dependency order, and will fail because `@localive/*` peer/transitive deps are not yet on the registry when the first workspace ships.

## 3. VS Code extension (1 package)

The VS Code extension (`packages/vscode`) is **not** published to npm — it goes to the VS Code Marketplace via `vsce`. It bundles everything with esbuild (CJS, node18 target) so `--no-dependencies` is correct.

### One-time: configure publisher + login

1. Confirm `packages/vscode/package.json` `publisher` field is `"localive"` — must match your Marketplace publisher ID exactly.
2. Authenticate once (PAT is cached afterwards):
   ```sh
   vsce login localive
   ```
   Paste the Personal Access Token when prompted. The token must have **Marketplace → Manage** scope and **All accessible organizations** access; otherwise `vsce publish` will 401.

### Per-release steps

From `packages/vscode`:

1. Confirm `version` in `package.json` matches the npm release (currently `0.1.4`).
2. Build the extension (run `npx nx build vscode` from the repo root).
3. Package to a `.vsix` for inspection:
   ```sh
   vsce package --no-dependencies
   ```
   This produces `localive-0.1.3.vsix`. You can install it locally to smoke-test:
   ```sh
   code --install-extension localive-0.1.3.vsix
   ```
4. Publish:
   ```sh
   vsce publish --no-dependencies
   ```
5. Verify at https://marketplace.visualstudio.com/items?itemName=localive.localive or via:
   ```sh
   vsce show localive.localive
   ```

### `--no-dependencies` rationale

`packages/vscode/esbuild.config.js` bundles the entire runtime (`@localive/core`, `cli`) into a single `dist/extension.js`. Any `dependencies` you declare in `package.json` would be installed by VS Code end-users at install time; passing `--no-dependencies` to `vsce publish` prevents the Marketplace from requiring those installs, keeping the extension self-contained.

## 4. Versioning

- All 16 packages share one version (`0.1.4` currently). Bump them in lockstep for consistency — consumers should be able to update one `@localive/*` package and trust the others at the same version are compatible.
- Use `npm version patch | minor | major` from the package directory, or manually edit `package.json` `version` then commit + tag the repo.
- After bumping, re-run the full verification suite (Section 1) before publishing.

## 5. Post-publish checklist

- [x] All 15 npm packages published and visible at `0.1.4` (verified June 2026)
- [ ] VS Code extension listed at https://marketplace.visualstudio.com/items?itemName=localive.localive (pending)
- [x] `npm view @localive/core dist.tarball` returns a tarball with `dist/`, `README.md`, `LICENSE`
- [x] Tag the release commit (`git tag v0.1.4 && git push --tags`) — done
- [ ] Update the website's "latest version" reference if any docs hardcode the version

## 6. Rollback / unpublish

- npm: a published version can only be **unpublished within 72 hours** of publish and as long as no other package depends on it. Prefer `npm deprecate @localive/<name>@<version> "Use 0.1.4 instead"` over unpublishing, which leaves the package installable with a deprecation warning.
- VS Code: `vsce unpublish localive.localive` — use sparingly; prefer not to unpublish. Marketplace guidelines discourage it because installed copies break.

## 7. Common pitfalls

- **`npm install` fails without `--legacy-peer-deps`** — Angular's `zone.js` peer-conflict. Always use `npm install --legacy-peer-deps` or `npm ci` for installs in this repo; the published packages don't carry the conflict because their `peerDependencies` are correctly narrowed.
- **`npm publish` fails with 403 / "You need a paid account"** — the `@localive` scope is unscoped public; if you accidentally prefix with a scoped-private config you'll get 403. Run `npm publish --access public` so npm publishes the package publicly regardless of org defaults.
- **`vsce publish` fails with 401** — the PAT's scope or organization access is wrong. Re-create the PAT with **Marketplace → Manage** scope and **All accessible organizations**, then `vsce logout localive && vsce login localive`.
- **`vsce publish` fails with "publisher not found"** — `publisher` in `packages/vscode/package.json` doesn't match the Marketplace publisher ID. Must be `localive` (all lowercase, no `@`).
- **A consumer reports `Cannot find module '@localive/core'` after installing `@localive/vite`** — you forgot to publish `@localive/core` first. Always run the dependency-first publish order in Section 2.
- **A consumer reports the VS Code extension is broken on install** — you published with `vsce publish` (without `--no-dependencies`) so VS Code tried to `npm install` external deps that aren't bundled. Use `vsce publish --no-dependencies` always.

---

See `AGENTS.md` for the architecture overview and `Commands` section for the standard dev/test/build commands it run during local verification.