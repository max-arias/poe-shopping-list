# PoE Shopping List — Local-Only Extension

A browser extension for Path of Exile that lets players create, manage, share, and use local shopping Lists of trade searches. There is no account, server, or remote synchronization.

## What it does

- Create and edit Personal Drafts locally.
- Import or export one strict, versioned Shareable List JSON format.
- Open a List in the side panel's accordion and mark items complete locally.
- Register the current supported trade search explicitly: review the URL, confirm or edit the List Item title, then save.

Every import creates an independent local copy. Imported items start incomplete.

## Shareable List v1

The portable contract is JSON:

```json
{
  "format": "poe-shopping-list",
  "version": 1,
  "title": "Frostblade essentials",
  "overview": "Weapon first, then solve resistances.",
  "items": [
    {
      "title": "The Pandemonius",
      "tradeUrl": "https://www.pathofexile.com/trade/search/Settlers?q=The%20Pandemonius",
      "variant": "optional variant or qualification",
      "note": "Optional item guidance"
    }
  ]
}
```

`format`, `version`, `title`, and `items` are required. `overview` is optional. Each item requires `title` and an HTTP(S) `tradeUrl`; `variant` and `note` are optional. Unknown fields, unsupported versions, malformed JSON, and invalid values are rejected. Completion state, IDs, timestamps, account data, and synchronization metadata are not portable.

## Tech Stack

| Concern             | Choice                                             |
| ------------------- | -------------------------------------------------- |
| Extension framework | [WXT](https://wxt.dev) (Chrome MV3)                |
| UI                  | [Vue 3](https://vuejs.org) Composition API         |
| State               | Pinia + `browser.storage.local`                    |
| Validation          | [Zod](https://zod.dev)                             |
| Styling             | Tailwind v4 with PoE-themed design tokens          |
| Toolchain           | [VitePlus (`vp`)](https://viteplus.dev)            |

## Developer Workflow

```bash
vp install
vp dev
vp build
vp check
```

This repository intentionally has no automated test suite. Use the build and
check commands above, plus the static-site validation documented in
[`docs/public-site/setup.md`](docs/public-site/setup.md). Do not add test files,
test runners/dependencies, or test CI without an explicit maintainer request.

## Project Structure

```
poe-shopping-list/
├── apps/extension/         # WXT + Vue extension
├── docs/                   # Product and architecture documentation
├── package.json            # Root workspace
└── README.md
```

## Related Docs

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — Extension architecture and data model
- [PRD.md](docs/PRD.md) — Product requirements and workflows
- [STATUS.md](STATUS.md) — Implementation and release status
