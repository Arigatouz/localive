# Releasing Localive

A plain, top-to-bottom guide to publishing Localive. Every step has the **command** and a short **why**. Do the sections in order the first time; later you'll only repeat sections 4–6.

> A longer internal reference with full per-framework install walkthroughs lives in `docs/RELEASE-GUIDE.md` (not pushed to GitHub).

---

## 1. Read this first — "it's MIT, so why is some of it private?"

These are **three independent things**. Mixing them up is the usual confusion:

1. **License (MIT)** — the *legal* terms for the source code. It applies to the **whole repository** on GitHub. Anyone may read, fork, and use it. This is what "open source" means. It has nothing to do with publishing.
2. **`"private": true` in a `package.json`** — an npm **safety flag** that blocks `npm publish` for that one package. It is *not* about the license and *not* about GitHub. We set it on the **root**, the **playground/e2e apps**, and the **website** because those are demos, tests, and docs — **not reusable libraries**. You don't publish a demo app to npm.
3. **npm scope access (`restricted` vs `public`)** — a *third* meaning of "private". Scoped packages like `@localive/*` default to **restricted**, which needs a **paid** npm plan and throws `402 Payment Required` on publish. We fixed this once by adding `"publishConfig": { "access": "public" }` to every published package.

| Thing | On GitHub? | Published to npm? | Why |
|---|---|---|---|
| The source code / repo | ✅ Yes | — | It *is* the repo (MIT, open source) |
| A library, e.g. `@localive/core` | ✅ Yes | ✅ Yes | Reusable — others install it |
| `@localive/vscode` extension | ✅ Yes | ❌ No (Marketplace instead) | Editor extensions ship to the VS Code Marketplace |
| `apps/playground-*`, `apps/playground-e2e`, `apps/website` | ✅ Yes | ❌ No (`private: true`) | Demos / tests / docs, not libraries |

**Takeaway:** everything is MIT and goes on GitHub. Only the *libraries* go to npm. `private: true` just means "never publish this one to npm."

---

## 2. Push the code to GitHub

**Should you push the e2e and playground apps? Yes.** They are examples and CI tests, not secrets. `private: true` means "don't publish to npm" — it does **not** mean "don't push to GitHub." Pushing them lets contributors run the demos and the test suite.

**Committed:** all source, every `packages/*` and `apps/*` (including `playground-e2e`), `package-lock.json`, the root `README.md` and `LICENSE`.

**Not committed** (already in `.gitignore`, all auto-generated or local): `node_modules/`, `dist/`, `.nx/cache`, `apps/website/dist`, `apps/website/.astro`, the `.playwright-mcp/` tool-artifact folder, and `*.bak` files. Note: `docs/` is intentionally ignored too.

```sh
git status                     # why: review exactly what's staged before committing
git add -A                     # why: stage everything that isn't gitignored
git commit -m "Prepare packages for first release"
git remote add origin https://github.com/Arigatouz/localive.git   # why: link GitHub (first time only)
git push -u origin main        # why: upload it
```

---

## 3. One-time account setup

**npm:**
```sh
npm login        # why: you must be authenticated to publish
npm whoami       # why: confirm which account you're on
```
The `@localive` scope needs either a free npm **org** named `localive` (free orgs allow unlimited *public* packages) or an account that owns that scope.

**VS Code Marketplace (only needed for the extension):**
- Create a publisher named `localive` at <https://marketplace.visualstudio.com/manage>.
- Create an Azure DevOps **Personal Access Token (PAT)** with scope **Marketplace → Manage** and organization set to **All accessible organizations**.
- Why: `vsce` needs this token to publish. A wrong scope or a single-org token causes `401 Unauthorized`.

---

## 4. Pre-publish checklist (run in order)

Each step gates a broken release.

```sh
npm ci                                                   # why: clean, reproducible install
# (if ci fails on peer deps:) npm install --legacy-peer-deps   # why: Angular zone.js peer conflict
```

**Pick a real version.** `0.0.1` is a placeholder; choose e.g. `0.1.0` for a first public beta:
```sh
# bump every package from 0.0.1 to 0.1.0 (skips the empty ai-openai placeholder)
for pkg in packages/*/package.json; do
  [[ "$pkg" == *ai-openai* ]] && continue
  node -e "const f='$pkg',p=require('./'+f);p.version='0.1.0';require('fs').writeFileSync(f,JSON.stringify(p,null,2)+'\n')"
done
```
Why: consumers install by version. Optionally also change the `@localive/*` cross-dependencies from `"*"` to `"^0.1.0"` so installs resolve to compatible versions (the `"*"` form works but always pulls "latest").

```sh
npx nx run-many -t build --outputStyle=static            # REQUIRED: builds dist/, which is what npm actually ships
npx nx run-many -t test --outputStyle=static             # why: don't ship failing code
npm run lint:all                                         # why: catch lint errors (note: `npm run lint` does nothing here)
npx nx run-many -t typecheck --outputStyle=static        # why: type safety
npm run check-bundle-sizes                               # why: keep browser bundles within limits
```

> **Why building is not optional:** `dist/` is gitignored, so a fresh clone has none. npm publishes the **local** `dist/` (it's in each package's `files` field). No build → you publish an empty package.

**Preview the tarball before publishing:**
```sh
cd packages/core && npm pack --dry-run && cd ../..       # why: see the EXACT files that will be published
# you should see: dist/**, README.md, LICENSE, package.json
```

---

## 5. Publish the npm packages (dependency order matters)

A package's `@localive/*` dependencies must already exist on npm, or other people's installs break. So publish **bottom-up**:

1. `@localive/core` — depends on nothing
2. the 6 **adapters** — depend on core
3. the 4 **clients** — depend on core
4. the **plugins** — `@localive/vite` **first**, then `@localive/webpack` and `@localive/plugin-angular` (they depend on vite)
5. `@localive/cli` — depends on core

```sh
#!/bin/bash
set -e

# 1. core
( cd packages/core && npm publish )

# 2. adapters
for a in i18next react-intl vue-i18n transloco ngx-translate svelte-i18n; do
  ( cd "packages/adapter-$a" && npm publish )
done

# 3. clients
for c in react vue angular svelte; do
  ( cd "packages/client-$c" && npm publish )
done

# 4. plugins (vite before the others)
( cd packages/plugin-vite     && npm publish )
( cd packages/plugin-webpack  && npm publish )
( cd packages/plugin-angular  && npm publish )

# 5. cli
( cd packages/cli && npm publish )
```

> `--access public` is **no longer required** — we set `publishConfig.access=public` in every package. (Adding the flag anyway is harmless.)

**Verify:**
```sh
npm view @localive/core version          # why: confirm it's live on the registry
# or open https://www.npmjs.com/package/@localive/core
```

---

## 6. Publish the VS Code extension (separate channel)

The extension goes to the **VS Code Marketplace**, not npm.

```sh
cd packages/vscode
npm run vscode:prepublish                # why: production build of dist/extension.js
npm install -g @vscode/vsce              # why: the Marketplace CLI
vsce package --no-dependencies           # why: build the .vsix
vsce login localive                      # why: authenticate with your PAT (first time)
vsce publish --no-dependencies           # or: vsce publish --no-dependencies --pat <PAT>
```

- **Why `--no-dependencies`:** esbuild already bundles everything into `dist/extension.js`. Without the flag, `vsce` tries to resolve workspace deps like `@localive/core`/`@localive/cli` that aren't on npm and fails.
- **Names must match exactly:** the `publisher` field in `packages/vscode/package.json`, the Marketplace publisher ID, and the `vsce login` name must all be `localive`.

---

## 7. Try it before you publish (optional, recommended)

```sh
npx nx serve playground-react            # run a demo (also -vue / -angular / -svelte)
( cd packages/core && npm pack )         # produces a .tgz you can `npm install` in a scratch project
npx nx build cli && node packages/cli/dist/index.js --help   # smoke-test the CLI
```
For the extension: open `packages/vscode` in VS Code and press **F5** to launch the Extension Development Host.

---

## 8. Releasing updates later

```sh
# bump (per package, or re-run the loop in section 4)
( cd packages/core && npm version patch )    # 0.1.0 -> 0.1.1
npx nx run-many -t build --outputStyle=static
# re-publish in the SAME dependency order as section 5
```
VS Code extension: `vsce publish --no-dependencies patch`.

---

## 9. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `402 Payment Required` | Scoped package isn't public. Ensure `publishConfig.access=public` (already set) or add `--access public`. |
| `401 Unauthorized` (vsce) | PAT missing **Marketplace → Manage** scope, or not set to **All accessible organizations**. |
| Published package is empty / files missing | You forgot to build — `dist/` wasn't generated. Rebuild, then republish. |
| Peer dependency warnings on install | Install the named peer, e.g. `npm install i18next`. |
| `npm install` fails on Angular peers | Use `npm install --legacy-peer-deps` (or `npm ci`). |

---

For exhaustive per-framework install walkthroughs (React+i18next, Vue+vue-i18n, Angular+Transloco/ngx-translate, Svelte+svelte-i18n), see the internal `docs/RELEASE-GUIDE.md`.
