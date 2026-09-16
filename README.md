# PoE Shopping List

A local-only browser extension and static catalog for Path of Exile shopping
Lists of trade searches. There is no account, server, or remote synchronization.

## What it does

- **Extension** (`apps/extension`) — create and edit Personal Drafts locally,
  follow their Trade links, mark items complete, and register the current Trade
  search explicitly.
- **Static catalog** (`apps/web`) — browse curated Published Lists and craft
  notes, then Download or Copy a share code for import.
- **Shared contract** (`packages/shareable-list`) — the one strict, versioned
  format both surfaces use for import and export.

Every import creates an independent local copy. Imported items start incomplete.

## Shareable List v1

The portable format is a strict JSON object whose only transport is the
canonical `psl1.` share code: gzip-compressed JSON, base64url-encoded without
padding.

```json
{
  "format": "poe-shopping-list",
  "version": 1,
  "title": "Frostblade essentials",
  "overview": "Weapon first, then solve resistances.",
  "groups": [
    {
      "title": "Weapon",
      "items": [
        {
          "title": "The Pandemonius",
          "tradeUrl": "https://www.pathofexile.com/trade/search/Settlers?q=The%20Pandemonius",
          "variant": "optional variant or qualification",
          "note": "Optional item guidance"
        }
      ]
    }
  ]
}
```

`format`, `version`, `title`, and `groups` are required; `overview` is optional.
Each item requires `title` and an HTTP(S) `tradeUrl`; `variant` and `note` are
optional. Objects are strict: unknown fields, unsupported versions, malformed
payloads, and invalid values are rejected. Completion state, IDs, timestamps,
account data, and synchronization metadata are not portable. Limits and
transport rules are in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Tech Stack

| Concern             | Choice                                         |
| ------------------- | ---------------------------------------------- |
| Extension framework | [WXT](https://wxt.dev) (Chrome MV3 side panel) |
| UI                  | Vue 3 Composition API + Nuxt UI                |
| State               | Pinia + `browser.storage.local`                |
| Validation          | [Zod](https://zod.dev)                         |
| Styling             | Tailwind v4 with Trade Bench design tokens     |
| Catalog             | [Astro](https://astro.build) static output     |
| Toolchain           | [VitePlus (`vp`)](https://viteplus.dev), pnpm  |

## Developer Workflow

```sh
vp install
vp run ext              # run the extension in a browser
vp run ext:typecheck    # vue-tsc over the extension source
vp run ext:check        # format and lint the extension source
vp run ext:build        # production build
vp run ext:zip          # package the built extension
vp run web:dev          # run the catalog site
vp run web:content:validate
vp run web:build
vp run web:output:check
vp run web:links:check
vp check                # format, lint, and type checks at the root
```

The catalog checks are also documented as direct pnpm invocations in
[`docs/public-site/setup.md`](docs/public-site/setup.md). This repository
intentionally has no automated test suite; do not add test files, test runners
or dependencies, or test CI without an explicit maintainer request.

## Project Structure

```
poe-shopping-list/
├── apps/extension/          # WXT + Vue side panel
├── apps/web/                # Astro catalog and craft notes
├── packages/shareable-list/ # Shareable List v1 schema and psl1. transport
├── docs/                    # Product, architecture, and operations docs
└── package.json             # Root workspace
```

## Related Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Extension, contract, and catalog architecture
- [docs/PRD.md](docs/PRD.md) — Product requirements and workflows
- [CONTEXT.md](CONTEXT.md) — Domain glossary
- [STATUS.md](STATUS.md) — Implementation and release status
- [docs/public-site/README.md](docs/public-site/README.md) — Catalog operation
