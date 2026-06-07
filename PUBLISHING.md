# Publishing Guide

How to ship the two published artifacts of this repo:

| Artifact | Registry | Package / ID |
|---|---|---|
| **CLI** (`apps/cli`) | npm | `blockus-extension-cli` |
| **VS Code extension** (`apps/vscode-extension`) | VS Code Marketplace | `ln-dev.blockus-ide-extension` |

> The browser **toolbar** (`toolbar/core`) is **not** published on its own — it is
> bundled into the CLI. A toolbar change ships by republishing the **CLI**.

---

## 0. One-time prerequisites

```bash
pnpm install
cp .env.example .env        # required by the CLI build (esbuild needs POSTHOG_API_KEY to exist; empty = no analytics)
```

- **Node** ≥ 18, **pnpm** (see `packageManager` in the root `package.json`).
- **npm account** with publish rights (for the CLI).
- **Azure DevOps Personal Access Token (PAT)** with *Marketplace → Manage* scope, and the **`ln-dev`** publisher created at <https://marketplace.visualstudio.com/manage> (for the extension).
- `vsce` is available via the repo devDependency — run it with `pnpm exec vsce …` (no global install needed).

---

## 1. Publish the CLI to npm (`blockus-extension-cli`)

The CLI bundle is self-contained: esbuild inlines all `@stagewise/*` workspace
packages, and the build copies the toolbar + plugins into `dist/`.

```bash
cd apps/cli

# 1. Bump the version — npm refuses to republish an existing version.
npm version patch --no-git-tag-version      # 0.2.11 -> 0.2.12  (use minor/major as needed)

# 2. Build (turbo builds the toolbar + plugins first, then the bundle).
#    Run from the repo root, or: pnpm --filter blockus-extension-cli build
pnpm build --filter blockus-extension-cli

# 3. (optional) Inspect exactly what will be published.
npm pack --dry-run

# 4. Publish (public).
pnpm publish --access public --no-git-checks
```

Verify:

```bash
npm view blockus-extension-cli version       # should print the new version
npx blockus-extension-cli@latest             # smoke test
```

Notes:
- `publishConfig.access` is already `"public"`, and the name is unscoped → public by default.
- `--no-git-checks` lets you publish from a dirty tree / non-`main` branch.
- The published tarball ships `dist/index.cjs` + `dist/toolbar-app/` + `dist/plugins/` + README (sourcemaps and build metadata are excluded via the `files` field).

---

## 2. Publish the VS Code extension to the Marketplace (`ln-dev.blockus-ide-extension`)

The extension is bundled with webpack (`vscode:prepublish` → `webpack`), so we
publish with `--no-dependencies` (vsce must NOT try to resolve the monorepo's
`workspace:*` dependencies).

```bash
cd apps/vscode-extension

# 1. Bump the version — the Marketplace refuses an existing version.
npm version patch --no-git-tag-version      # 1.0.4 -> 1.0.5

# 2. (recommended) Build a .vsix and inspect it first.
pnpm exec vsce package --no-dependencies     # -> blockus-ide-extension-<version>.vsix

# 3. Publish with your Azure DevOps PAT.
pnpm exec vsce publish --no-dependencies -p <YOUR_PAT>
#   …or publish the validated .vsix directly:
#   pnpm exec vsce publish --no-dependencies --packagePath blockus-ide-extension-<version>.vsix -p <YOUR_PAT>
```

Verify (Marketplace re-indexes in ~1–2 min):
- <https://marketplace.visualstudio.com/items?itemName=ln-dev.blockus-ide-extension>
- Publisher hub: <https://marketplace.visualstudio.com/manage/publishers/ln-dev>

Manifest requirements already satisfied (don't break them): `name`, `displayName`,
`description`, `version`, **`publisher: "ln-dev"`**, `icon` (PNG ≥ 128×128),
`repository`, `categories`, `engines.vscode`.

---

## 3. Troubleshooting (issues we actually hit)

**npm: `E404 … 'blockus-extension-cli@x' is not in this registry` on publish**
Misleading — it almost always means your npm token is **expired/invalid**. Check
`npm whoami` (a `401` confirms it). Fix with `npm login`, or generate a fresh
**Granular/Automation token** on npmjs.com (Read & write; automation/granular
tokens bypass 2FA) and set it:
`npm config set //registry.npmjs.org/:_authToken=npm_xxx`.

**npm: `EOTP … requires a one-time password`**
Your account has 2FA. Either pass `--otp=<code>` (6-digit, expires fast), or use
an **Automation token** that bypasses 2FA.

**npm: CLI build fails — `Expected value for define "process.env.POSTHOG_API_KEY"`**
The root `.env` is missing. `cp .env.example .env` (the value can stay empty —
analytics is disabled).

**vsce: `SVGs are restricted in README.md`**
The Marketplace forbids `<img>` SVGs in the README. Use a PNG
(`https://blockus.lndevui.com/brand/logo.png`). Shields.io badges are allowed.

**vsce: errors resolving `workspace:*` dependencies**
You forgot `--no-dependencies`. The extension is webpack-bundled, so vsce must
skip dependency resolution.

**A toolbar/preview change isn't reflected after publishing the extension**
The toolbar ships via the **CLI** (npm), not the extension. Republish the CLI.

---

## 4. Security

- **Never paste tokens** (npm token, Azure PAT) into chats, issues, or commits.
  Put them in `~/.npmrc` / `vsce login` only.
- If a token is ever exposed, revoke it immediately (npmjs.com → Access Tokens,
  or dev.azure.com → Personal Access Tokens).

---

## 5. Quick reference

| Task | Command (from the package dir) |
|---|---|
| Bump version (no git tag) | `npm version patch --no-git-tag-version` |
| Build CLI | `pnpm build --filter blockus-extension-cli` (repo root) |
| Publish CLI | `pnpm publish --access public --no-git-checks` |
| Package extension | `pnpm exec vsce package --no-dependencies` |
| Publish extension | `pnpm exec vsce publish --no-dependencies -p <PAT>` |
| Check npm version | `npm view blockus-extension-cli version` |
