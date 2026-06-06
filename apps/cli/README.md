# <img src="https://blockus.lndevui.com/brand/logo.svg" alt="blockus logo" width="40" height="40" style="vertical-align: middle; margin-right: 8px;" /> blockus IDE Extension CLI

# Launch the blockus toolbar in your browser, while you develop

![NPM Version](https://img.shields.io/npm/v/blockus-extension-cli) ![NPM License](https://img.shields.io/npm/l/blockus-extension-cli) [![GitHub Repo stars](https://img.shields.io/github/stars/ln-dev7/blockus-ide-extension)](https://github.com/ln-dev7/blockus-ide-extension)

## About

`blockus-extension-cli` runs the **blockus** toolbar as an overlay on top of your app in development. From the toolbar you can:

- 🧱 Browse and search the [blockus](https://blockus.lndevui.com) catalog of production-ready React blocks
- ⚡ Install any block in one click via the shadcn registry (`@blockus/<id>`)
- 🔒 Unlock Pro blocks with your blockus API key (`bk_live_…`)
- 🧠 Select DOM elements and send rich, browser-powered context to your AI agent — no copy-pasting paths

## 📖 Getting Started

### 1. Start your web app in development mode

Run your app the way you normally do (Next.js on port `3000`, Vite on `5173`, etc.).

### 2. Start the blockus toolbar

In another terminal, **at the root of your app**, run:

```bash
npx blockus-extension-cli
```

or, with pnpm:

```bash
pnpm dlx blockus-extension-cli
```

The CLI opens your browser with the toolbar attached to your running app. Useful flags:

```bash
npx blockus-extension-cli --app-port 3000   # Next.js dev server
npx blockus-extension-cli --app-port 5173   # Vite dev server
npx blockus-extension-cli --help            # all options
```

### 3. Install blocks

Open the **blockus Blocks** panel, find a block, and click **Install** — or run it yourself:

```bash
pnpm dlx shadcn@latest add @blockus/hero-01
```

For Pro blocks, add your key to your project `.env`:

```bash
BLOCKUS_API_KEY=bk_live_xxxxxxxxxxxxxxxxxxxxxxxx
```

## 🤖 Agent support

| **Agent**      | **Supported** |
| -------------- | ------------- |
| Cursor         | ✅            |
| GitHub Copilot | ✅            |
| Windsurf       | ✅            |
| Cline          | ✅            |
| Roo Code       | ✅            |
| Kilo Code      | ✅            |
| Trae           | ✅            |

## 🔗 Links

- 🌐 [blockus.lndevui.com](https://blockus.lndevui.com)
- 📦 [GitHub repo](https://github.com/ln-dev7/blockus-ide-extension)
- 🐛 [Report an issue](https://github.com/ln-dev7/blockus-ide-extension/issues)

## 📜 License

This project is offered under the **AGPLv3** license. For more information, see the [FAQ about the GNU Licenses](https://www.gnu.org/licenses/gpl-faq.html).

---

Built on top of [stagewise](https://github.com/stagewise-io/stagewise) (AGPLv3) — the toolbar ↔ IDE plumbing this CLI relies on. All credit for that foundation goes to the stagewise project.
