# PoE Shopping List — Architecture

## Overview

PoE Shopping List is a **local-only browser extension** for Path of Exile. Users create and manage shopping lists of trade searches entirely in their browser — no server, no account, no API required. Lists can be shared via compressed text strings (import/export).

## Extension (`apps/extension`)

**Stack:** WXT 0.20, Vue 3.5, Pinia, Tailwind v4, lz-string

### Directory Structure

```
apps/extension/src/
├── assets/main.css              # Tailwind + token imports
├── components/
│   ├── App.vue                  # Root: ChromeBar + TabBar + MineTab/HistoryTab/DetailPanel + overlays
│   ├── detail/DetailPanel.vue   # Active draft detail view (items, actions)
│   ├── history/
│   │   ├── HistoryTab.vue       # Purchase history tab (select all, list, overlays)
│   │   ├── HistoryItemRow.vue   # Single history item row (checkbox, name, price, kebab)
│   │   └── HistoryKebabMenu.vue  # Context menu for history item actions
│   ├── layout/ChromeBar.vue    # Top bar (title, league badge, settings)
│   ├── layout/TabBar.vue       # "My Lists" header (single-tab)
│   ├── mine/
│   │   ├── ActiveListHeader.vue # Header showing active draft name + estimate
│   │   ├── EditItemSheet.vue    # Edit item name/URL/price overlay
│   │   ├── EmptyMine.vue       # Empty state with create form
│   │   ├── ExportSheet.vue     # Export list as compressed string
│   │   ├── ImportSheet.vue     # Import list from compressed string
│   │   ├── ItemRow.vue         # Single item row (checkbox, name, price, kebab)
│   │   ├── KebabMenu.vue       # Context menu for item actions
│   │   ├── MineListRow.vue     # Draft list row in list view
│   │   ├── MineTab.vue         # Main tab: list of drafts + create form
│   │   └── SaveModal.vue       # Save search modal (name + price preview)
│   ├── settings/SettingsPopover.vue
│   └── shared/                 # BtnGhost, BtnGold, Pill, CaptureUnavailableBanner
├── composables/
│   ├── useDivineRate.ts        # Fetches divine orb price from poe.ninja
│   ├── useDraftList.ts         # CRUD for local draft lists (browser.storage.local)
│   ├── useImportExport.ts      # Export/import drafts as lz-string compressed strings
│   ├── usePurchaseHistory.ts   # Purchase history CRUD + real-time messaging listener
│   └── useSettings.ts          # Settings store (game, league, theme, auto-capture)
├── entrypoints/
│   ├── background.ts           # Service worker: side panel activation, tab tracking
│   ├── build.content.ts        # Content script: pobb.in, maxroll.gg FAB injection
│   ├── sidepanel/main.ts       # Vue app mount
│   ├── sidepanel.html          # Side panel HTML entry
│   └── trade.content.ts        # Content script: trade page price capture
├── stores/ui.ts                # Pinia UI state (active view, modals, kebab)
├── styles/tokens.css           # Design tokens (PoE-themed palette, light/dark)
├── trade-dom/
│   ├── index.ts                # Price extraction, capture building, search bar reading
│   └── selectors.ts            # DOM selectors for trade page elements
├── types/
│   ├── index.ts                # Re-exports all types
│   ├── game.ts                 # Game enum, league constants
│   ├── item.ts                 # ItemKind enum
│   ├── trade.ts                # TradeCapture, RawListing types
│   ├── draft.ts                # Draft, DraftItem types
│   ├── purchaseHistory.ts     # PurchaseHistoryItem type
│   ├── settings.ts             # Settings type + defaults
│   ├── storage.ts              # Storage key constants
│   └── messages.ts             # Extension message types
└── utils/
    ├── fab.ts                  # FAB injection for build guide pages
    └── messages.ts              # @webext-core/messaging typed protocol
```

### Data Model

All data is stored in `browser.storage.local`:

| Key                     | Type                    | Description                                 |
| ----------------------- | ----------------------- | ------------------------------------------- |
| `local:drafts`          | `Draft[]`               | User's shopping lists                       |
| `local:settings:v1`     | `Settings`              | User preferences                            |
| `local:purchaseHistory` | `PurchaseHistoryItem[]` | Purchase history (Travel to Hideout clicks) |

### Import/Export Format

Lists are exported as lz-string compressed, URI-safe strings. The portable format strips transient fields (IDs, timestamps, capture data) and uses short keys:

```typescript
// Portable format (before compression)
{
  n: string,      // name
  g: "poe1"|"poe2", // game
  l: string,      // league
  i: [{ n, k, u, b }], // items: name, kind, url, base
  bu?: string,    // buildUrl
  bc?: string,    // buildCreator
  au?: string[],  // associatedUrls
}
```

On import, a new ID and timestamps are generated, and the list is saved to local storage.

### Content Scripts

| Script             | Matches                     | Purpose                                                                  |
| ------------------ | --------------------------- | ------------------------------------------------------------------------ |
| `trade.content.ts` | `pathofexile.com/trade/*`   | Price capture, search bar text, FAB injection, purchase history tracking |
| `build.content.ts` | `pobb.in/*`, `maxroll.gg/*` | FAB injection for build guide pages                                      |

### Cross-Context Communication

The extension uses **`@webext-core/messaging`** as the primary communication channel between content scripts, background worker, and sidepanel. Prefer messaging over `chrome.storage` watch patterns for real-time data flow.

| Message              | Direction           | Purpose                                 |
| -------------------- | ------------------- | --------------------------------------- |
| `captureRead`        | sidepanel → content | Read current trade page prices          |
| `autoCaptureRead`    | sidepanel → content | Auto-capture prices                     |
| `searchBarGet`       | sidepanel → content | Read search bar text                    |
| `captureStatus`      | content → sidepanel | Report if capture is available          |
| `purchaseHistoryAdd` | content → sidepanel | Add item from "Travel to Hideout" click |

Legacy patterns still in use:

- `chrome.runtime.sendMessage({ type: "save-search" })` → background → `chrome.storage.local.set({ triggerSaveSearch })` → sidepanel watches storage key. This should be migrated to `@webext-core/messaging` when convenient.

### Build-Site Integration

When a user visits a build guide page (pobb.in, maxroll.gg), the content script injects a FAB/ribbon that:

1. Checks local drafts for matching `buildUrl` or `associatedUrls`
2. If matches found, shows a mini-view with "View →" buttons
3. If no matches, shows a shopping cart icon that opens the side panel

### Extension Permissions

| Permission  | Purpose                                 |
| ----------- | --------------------------------------- |
| `storage`   | Local storage for drafts and settings   |
| `sidePanel` | Chrome side panel API                   |
| `tabs`      | Query active tab URL for build matching |

### Host Permissions

| Pattern                         | Purpose                       |
| ------------------------------- | ----------------------------- |
| `https://www.pathofexile.com/*` | Trade site content script     |
| `https://pathofexile.com/*`     | Trade site (alternate domain) |
| `https://pobb.in/*`             | Build guide FAB injection     |
| `https://maxroll.gg/*`          | Build guide FAB injection     |
| `https://poe.ninja/*`           | Divine rate API fetch         |

## E2E Tests (`apps/e2e`)

Playwright-based end-to-end tests for the extension. Run via `npm run e2e` from root.

## Tech Stack

| Concern             | Choice                                  | Rationale                                      |
| ------------------- | --------------------------------------- | ---------------------------------------------- |
| Extension framework | [WXT](https://wxt.dev)                  | MV3 + Firefox from one codebase                |
| Extension UI        | [Vue 3](https://vuejs.org)              | Composition API + `<script setup>`             |
| State               | Pinia + browser.storage.local           | Local-only, no server sync                     |
| Compression         | lz-string                               | Lightweight, browser-native, URI-safe encoding |
| Validation          | Zod                                     | Runtime type validation for imports            |
| Design tokens       | Tailwind v4 `@theme inline`             | Theme-switchable via `data-theme` attribute    |
| Toolchain           | [VitePlus (`vp`)](https://viteplus.dev) | Unified dev/build/test/lint/format             |
