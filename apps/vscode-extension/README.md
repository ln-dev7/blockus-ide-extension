# <img src="https://blockus.lndevui.com/brand/logo.png" alt="blockus logo" width="40" height="40" style="vertical-align: middle; margin-right: 8px;" /> blockus IDE Extension

***Drop production-ready React blocks into your project — without leaving your editor.***

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

> New here? Jump to [What is the blockus IDE extension?](#what-is-the-blockus-ide-extension).

## About the project

This extension is a fork of [Stagewise](https://github.com/stagewise-io/stagewise) (via [flyonui-extension](https://github.com/themeselection/flyonui-extension)). It keeps Stagewise's plumbing — the extension ↔ toolbar communication, DOM context selection, and AI-agent bridge — and replaces the block catalog with [**blockus**](https://blockus.lndevui.com): production-ready React blocks, crafted not generated.

Welcome to **blockus IDE Extension** — browse the blockus catalog, preview blocks, and install them in one click while you build.

- 🔎 Search blocks by name, category and tag
- 🧱 Preview every block from the toolbar or the VS Code sidebar
- ⚡ Install a block with one click via the shadcn CLI
- 🔒 Unlock Pro blocks with your blockus API key (`bk_live_…`)
- 🧠 Send a block (with its source) straight to your IDE's AI agent

## Features

- ⚡ Works out of the box — `npx blockus-extension-cli`
- 🧱 The full [blockus catalog](https://blockus.lndevui.com) in your editor
- 🆓 Free + 🔒 Pro tiers, gated by your API key
- 📦 One-click install: `pnpm dlx shadcn@latest add @blockus/<id>`
- 🧠 Compatible with all IDEs and AI agents (via the Stagewise bridge)
- 📖 Open source — AGPLv3

## What is the blockus IDE extension?

The extension has two surfaces:

1. **The browser toolbar** — launched by `npx blockus-extension-cli`. It overlays your running app, lets you select DOM elements as context for your AI agent, and adds a **blockus Blocks** panel to browse and install blocks.
2. **The VS Code sidebar panel** — a **blockus Blocks** view with the same search / category / Free-Pro experience, plus an *Install* action that runs the shadcn command in the integrated terminal.

Blocks come from the blockus registry:

```
GET https://blockus.lndevui.com/api/blocks         # full catalog (Bearer optional)
GET https://blockus.lndevui.com/r/<block-id>.json  # a block's source (Bearer for Pro)
```

Free blocks install for everyone. Pro blocks unlock once you add your API key.

### Installing a block

```bash
pnpm dlx shadcn@latest add @blockus/hero-01
```

For Pro blocks, set `BLOCKUS_API_KEY` in your project's `.env` (and in your `components.json` registry headers), or paste your key into the extension to unlock them.

### 🤖 Supported agents / IDEs

| **Agent**      | **Supported** |
| -------------- | ------------- |
| Cursor         | ✅            |
| GitHub Copilot | ✅            |
| Windsurf       | ✅            |
| Cline          | ✅            |
| Roo Code       | ✅            |
| Kilo Code      | ✅            |
| Trae           | ✅            |

## Credits 🤘

Grateful to the open-source projects this builds on:

- [Stagewise](https://stagewise.io/) — the toolbar ↔ IDE plumbing
- [shadcn/ui](https://ui.shadcn.com/) — the registry & install model

## 📜 License

This extension is a fork of [Stagewise](https://stagewise.io) and is offered under the AGPLv3 license. For more information, see the [FAQ about the GNU Licenses](https://www.gnu.org/licenses/gpl-faq.html).

## 💬 Community & Support

- 🌐 [blockus.lndevui.com](https://blockus.lndevui.com)
- 📖 Open an [issue on GitHub](https://github.com/ln-dev7/blockus-ide-extension/issues) for support.

## Useful Links 🎁

- [blockus blocks](https://blockus.lndevui.com)
- [Pricing](https://blockus.lndevui.com/pricing)
- [Get an API key](https://blockus.lndevui.com/account/registry-token)
