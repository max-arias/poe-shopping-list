# PoE Shopping List — Architecture

## Overview

PoE Shopping List is a local-only WXT browser extension for Path of Exile. Vue renders the side panel, Pinia holds UI state, and `browser.storage.local` holds Lists and settings. There is no server or account layer.

## Extension (`apps/extension`)

### Main pieces

- `components/App.vue` mounts the List workflow and import/export or registration overlays.
- `components/mine/MineTab.vue` renders all Lists as one accordion with title-band selection, collapsible overview, item rows, local completion, reordering, and List actions.
- `components/mine/ItemRow.vue` renders a clickable trade-link row, checkbox, and reorder affordance.
- `composables/useDraftList.ts` owns local List CRUD, completion, and reorder persistence.
- `composables/useImportExport.ts` serializes and parses the strict v1 contract.
- `types/draft.ts` defines the Shareable List and local Draft Zod schemas.
- `entrypoints/trade.content.ts` reports whether the active URL is a supported trade search.
- `entrypoints/background.ts` enables the side panel on supported trade pages and opens the trade site from the action elsewhere.

## Data model and storage

Drafts are stored through WXT storage helpers using these current keys:

| Key | Purpose |
| --- | --- |
| `local:drafts:v1` | Local `Draft[]`, including completion, IDs, positions, and timestamps |
| `local:settings:v1` | Theme and item-opening preferences |
| `local:fabPosition:v1` | Reserved local UI position state |

The clean v1 reset does not read or migrate obsolete keys or data shapes. A Shareable List is only the portable subset:

```typescript
{
  format: "poe-shopping-list",
  version: 1,
  title: string,
  overview?: string,
  items: Array<{
    title: string,
    tradeUrl: string, // HTTP(S)
    variant?: string,
    note?: string
  }>
}
```

The top-level and item objects are strict. JSON parse errors and schema failures reject the import. Import generates new local IDs and timestamps and forces `completed: false` for every item.

## Register Current Trade

The expanded List exposes **Register Current Trade**. The intended flow is to read the current supported trade URL, show it for review, require a title confirmation or edit, and save only after explicit confirmation. The current modal is present, but its runtime URL signal and save path are not yet connected.

## Permissions and hosts

The manifest requests only `storage` and `sidePanel`. Host permissions are limited to:

- `https://www.pathofexile.com/trade/*`
- `https://pathofexile.com/trade/*`

The trade content script only reports supported `/trade/search/` pages. No other site content script or host is part of the current v1 implementation.

## Validation and release state

The repository intentionally has no automated test suite. Validate extension
changes with type checking, formatting/linting, production builds, and manual
review in supported browsers. No release has been submitted to either browser
store.
