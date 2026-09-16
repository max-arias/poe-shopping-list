# Agent Instructions — PoE Shopping List

Verified against `main` at `059c446`.

## Communication Between Extension Surfaces

The service worker (background) is the **central hub** — content scripts and the
side panel never communicate directly. This avoids lifecycle mismatches (content
scripts die on navigation, the side panel may be closed).

```
Content Script  ←──→  Service Worker  ←──→  Side Panel
                           ↑
                      (Source of Truth)
                       WXT Storage
```

### Protocol (`src/utils/messages.ts`)

The whole protocol is two messages. Both return the same payload.

| Message           | Direction                                      | Payload                                    |
| ----------------- | ---------------------------------------------- | ------------------------------------------ |
| `csTradePageInfo` | Service worker → content script (tab-targeted) | `{ supported, url, itemName }`             |
| `spTradePageInfo` | Side panel → service worker → content script   | the relayed `{ supported, url, itemName }` |

There are no broadcast channels. When the active tab or its content script is
unavailable, the background returns `{ supported: false, url: "", itemName: "" }`
rather than throwing.

### When to use messaging (`@webext-core/messaging`)

- **Request/response** when the side panel needs live page state from the active
  tab: `sendMessage("spTradePageInfo")` → background relays `csTradePageInfo`.
- Extend the `ProtocolMap` in `src/utils/messages.ts` before adding a new
  message; never call the raw `browser.runtime.sendMessage` for extension
  traffic.

### When to use `wxt/utils/storage` (`browser.storage.local`)

- Persisting Drafts and settings across sessions (`storage.defineItem`).
- Hydrating composables (`useDraftList`, `useSettings`) on first use.
- Cross-context sync via `storage.watch()` — no message listener needed.

`resetLegacyStorage()` in `types/storage.ts` runs once from the background and
removes pre-reset keys; no obsolete shape is migrated. Draft and settings shapes
are strict Zod schemas, so unknown local data is dropped rather than repaired.

### Key rules

1. **Never send messages directly between the content script and the side
   panel** — always route through the background.
2. **Tab targeting lives in the background**: `sendMessage("csTradePageInfo", undefined, tabId)`.
3. **Use the typed `sendMessage`/`onMessage`** from `src/utils/messages.ts`.
4. **Keep domain math out of components**: pure Draft operations belong in
   `src/domain/drafts.ts`; composables only persist their results.

## Tech Stack

- WXT 0.21, Vue 3 (Composition API + `<script setup>`), Pinia, Nuxt UI 4,
  Tailwind v4, Zod.
- Catalog: Astro 5 with static output; content lives in
  `apps/web/src/content/lists/`.
- Build from the repo root: `vp run ext` (dev), `vp run ext:typecheck`,
  `vp run ext:check`, `vp run ext:build`, `vp run ext:zip`, and the `web:*`
  equivalents. Do not run plain `vp build` for the extension.

## Validation

The repository intentionally has no automated test suite. Do not add test files,
test runners or dependencies, or test CI unless the maintainer explicitly asks.
Validate with type checking, format/lint, production builds, the catalog
validation commands in `docs/public-site/setup.md`, and manual review in a
supported browser.

## Key Conventions

- All types are Zod schemas with inferred TypeScript types.
- Storage keys are defined once in `types/storage.ts`.
- Design tokens live in `src/styles/tokens.css` (Trade Bench, dark-only); Nuxt UI
  primary/neutral ramps are mapped to those tokens in `src/assets/main.css`.
- Components are organized by area: `mine/`, `settings/`, `shared/`.
- The Shareable List contract and its `psl1.` transport live in
  `packages/shareable-list` and are the only portable format.
- This project is unreleased: prefer clean forward-only changes over
  backward-compatibility layers or migration code unless explicitly requested.
