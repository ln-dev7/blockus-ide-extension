# blockus IDE Extension

## 1.0.4

- Rebranded from FlyonUI to **blockus**: blocks now come from the blockus registry (`/api/blocks`, `/r/<id>.json`).
- API key model switched to blockus Bearer tokens (`bk_live_…`); Pro blocks unlock when a valid key is set.
- New dedicated **blockus Blocks** panel in the toolbar (search, category filter, one-click install).
- One-click install runs `pnpm dlx shadcn@latest add @blockus/<id>` in the integrated terminal.

## 1.0.3

- Fixed CORS issues affecting API calls and block searches.
- Removed unnecessary console logs for cleaner output to users.

## 1.0.2

- Fixed issues with toolbar integration and block access.
- Added a handy option to use blockus docs from the toolbar.

## 1.0.1

- Fixed a UI-related issue.
- Improved search performance and accuracy.

## 1.0.0

- Bridge mode is now enabled by default for smoother IDE agent communication with the toolbar.
- Added direct access to blocks from within the IDE and via the toolbar.
- Introduced toolbar integration for quick actions like accessing blocks and library documentation.
- Integrated documentation lookup via Context7.
