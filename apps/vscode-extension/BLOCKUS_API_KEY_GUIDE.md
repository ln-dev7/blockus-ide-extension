# blockus API Key Guide

The blockus IDE Extension serves **Free** blocks to everyone and gates **Pro**
blocks behind a blockus API key.

## What's a blockus API key?

A registry token tied to your blockus account. It always starts with
`bk_live_`. Generate one at:

> https://blockus.lndevui.com/account/registry-token

## Where to set it

**In the VS Code extension**

- Settings → search `blockus.apiKey`, or
- Paste it into the API-key field at the top of the **blockus Blocks** panel.

The key is stored in your VS Code global settings and sent as
`Authorization: Bearer <key>` to the blockus registry.

**In the toolbar (browser)**

- Open the **blockus Blocks** panel and paste your key into the "Unlock Pro"
  field. It's stored in `localStorage` under `blockus_api_key`.

**For shadcn installs in your project**

Add the key to your project `.env`:

```bash
BLOCKUS_API_KEY=bk_live_xxxxxxxxxxxxxxxxxxxxxxxx
```

…and reference it from `components.json`:

```json
{
  "registries": {
    "@blockus": {
      "url": "https://blockus.lndevui.com/r/{name}.json",
      "headers": { "Authorization": "Bearer ${BLOCKUS_API_KEY}" }
    }
  }
}
```

## How gating works

- `GET /api/blocks` — without a key, every block is listed but Pro blocks have
  `installable: false`. With a valid Pro key, `unlocked: true` and Pro blocks
  become installable.
- `GET /r/<id>.json` — Free blocks are public; Pro blocks return `401` unless a
  valid Pro key is presented.

## Validation

The extension treats a key as valid only when `/api/blocks` reports
`unlocked: true` for it (i.e. the key belongs to a Pro account). A correctly
formatted key from a non-Pro account is treated as anonymous.
