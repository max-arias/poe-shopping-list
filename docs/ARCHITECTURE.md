# PoE Shopping List — Architecture

Verified against `main` at `059c446`.

## Overview

One pnpm workspace (`apps/*`, `packages/*`) holds three surfaces:

| Surface           | Path                      | Stack                                                |
| ----------------- | ------------------------- | ---------------------------------------------------- |
| Browser extension | `apps/extension`          | WXT, Vue 3, Pinia, Nuxt UI, Tailwind v4, Zod         |
| Static catalog    | `apps/web`                | Astro (static output), Tailwind v4, Zod              |
| Shareable List    | `packages/shareable-list` | Zod schema plus the `psl1.` gzip/base64url transport |

The extension is local-only: no server, account, or synchronization layer. The
catalog is a static site with no runtime API. The two surfaces share only the
portable contract in `packages/shareable-list`.

## Extension (`apps/extension`)

### Entrypoints

- `entrypoints/sidepanel.html` + `entrypoints/sidepanel/main.ts` mount `App.vue`
  with Pinia and the Nuxt UI plugin. The panel is dark-only: the bootstrap adds
  the `dark` class and `colorScheme` before Vue mounts.
- `entrypoints/background.ts` is the service-worker hub. It enables
  `chrome.sidePanel` only for tabs whose URL is under `pathofexile.com/trade/`,
  opens the panel on action click for those tabs (and otherwise navigates the
  tab to the Trade site), runs the legacy-storage reset, and relays
  `spTradePageInfo` to the active tab's content script.
- `entrypoints/trade.content.ts` matches the two Trade hosts, reports whether
  the URL is a supported `/trade/search/` page, and extracts a current item name
  from the search input or result rows, falling back to the document title.

### Messaging

`utils/messages.ts` declares the whole protocol:

| Message           | Direction                     | Payload                                     |
| ----------------- | ----------------------------- | ------------------------------------------- |
| `csTradePageInfo` | background → content script   | `{ supported, url, itemName }`              |
| `spTradePageInfo` | side panel → background → tab | the same payload, relayed by the background |

The side panel never messages a content script directly; the background hub owns
tab targeting and returns `{ supported: false, url: "", itemName: "" }` when the
active tab or content script is unavailable.

### UI

- `components/App.vue` renders `MineTab` plus the overlays: settings popover,
  export sheet, import sheet, and the Register Current Trade modal.
- `components/mine/MineTab.vue` owns the accordion: one expanding title band per
  List, collapsible overview, grouped and root item rows, drag reorder, group
  create/rename/delete, item move, completion, and the create/rename/delete
  dialogs. The footer holds the primary create action and a menu for import,
  settings, and per-List actions.
- `components/mine/ItemRow.vue` renders one clickable Trade row with a
  completion checkbox and the optional variant. The item `note` is carried
  through the Draft and the share contract but is not rendered in the row.
- `components/mine/ListAppearancePicker.vue` composes the icon or color choice.
- `components/mine/SaveModal.vue` implements Register Current Trade: it asks the
  background for the active trade page, prefills an editable title, and saves an
  incomplete item only after explicit confirmation.
- `components/mine/ImportSheet.vue` and `ExportSheet.vue` are the share-code
  surfaces; `overview-markdown.ts` and `OverviewMarkdown.vue` render the
  sanitized overview.
- `composables/useDraftList.ts`, `composables/useSettings.ts`, and
  `stores/ui.ts` hold state; `composables/useFocusTrap.ts` manages overlay focus.

### Data model and storage

Types and validation live in `types/draft.ts` (Zod, strict). A `Draft` is
`{ id, title, overview?, iconId? | color?, createdAt, items[], groups[] }`; a
group is `{ id, title?, position, items[] }`; an item is
`{ id, position, title, tradeUrl, variant?, note?, completed, addedAt }`.
`iconId` and `color` are mutually exclusive.

Storage keys are declared in `types/storage.ts`:

| Key                 | Purpose                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `local:drafts:v1`   | Local `Draft[]`, including completion, IDs, positions, timestamps |
| `local:settings:v2` | `openItemsInNewTab`                                               |
| `local:reset:v1`    | Marker recording that the one-time legacy reset already ran       |

`resetLegacyStorage()` runs once: it keeps valid current settings, adopts valid
legacy `local:settings:v1` settings when the current value is invalid, deletes
the obsolete keys (`local:drafts`, `local:purchaseHistory`, `local:visitHistory`,
`local:triggerSaveSearch`, `local:pricingJobs:v1`, `local:fabPosition:v1`,
`local:settings:v1`, `local:poeSlDebugLogs:v1`, `local:poeTradeStatsIndex:v1`),
and sets the marker. No obsolete shape is migrated.

`domain/drafts.ts` holds the pure draft operations (appearance, reorder, group
create/rename/remove, item update/remove/move, clear completed); the composable
persists their results.

### Permissions and hosts

The manifest requests only `storage` and `sidePanel`. Host permissions are
limited to `https://www.pathofexile.com/trade/*` and
`https://pathofexile.com/trade/*`. No other site has a content script or host
permission.

## Portable contract (`packages/shareable-list`)

`shareableListSchema` is strict and versioned:

```typescript
{
  format: "poe-shopping-list",
  version: 1,
  title: string,                 // non-blank
  overview?: string,
  groups: Array<{ title?: string, items: Array<{ title, tradeUrl, variant?, note? }> }>
}
```

The contract is groups-only; a flat authored list is normalized into one
untitled group at the export boundary. Duplicate Trade URLs are rejected within
a group by the catalog validators. Limits: 500 items, 100 groups, 256 KiB
compressed, 1 MiB decompressed.

Transport rules (`encodeShareableList` / `decodeShareableList`):

- the token must start with `psl1.`;
- the payload is gzip (level 6, zero mtime) base64url encoded without padding,
  and the base64url text must be canonical;
- exactly one gzip member is allowed, and the footer CRC32 and length are
  verified against the decoded bytes;
- the payload must decode as UTF-8 and parse as JSON before schema validation;

Any failure throws `ShareableListTransportError`; the import surface reports the
message and keeps the pasted text so the user can correct it.

## Static catalog (`apps/web`)

- `src/content.config.ts` loads `src/content/lists/**/*.{md,mdx,json,yaml,yml}`
  into the `lists` collection with `publishedListSchema`.
- `src/domain/schemas.ts` defines the authoring contract: `title`,
  `category` slug, `tags` slugs, `applicability` (`game: "poe1"` with exactly
  one of `league` or `evergreen`), plus either `items` or `groups`, each with at
  least one item. Items require `title`, an official
  `https://www.pathofexile.com/trade/search/...` URL with no credentials or
  fragment, and an optional `variant` and `rationale`.
- `src/domain/taxonomy.ts` is the canonical category and tag list used by
  `validate-content.ts` when validating each list.
- `src/domain/groups.ts` normalizes flat authored lists to one untitled group;
  `src/domain/serialize.ts` converts a Published List to the portable contract,
  mapping item `rationale` to `note`.
- `src/domain/last-reviewed.ts` derives each list's `lastReviewed` from its last
  Git commit; production builds fail when a list has no review record.
- `src/pages/index.astro` renders the Catalog, and `src/pages/crafts.astro` the
  craft notes. Each card exposes a Download (data URL) and Copy action carrying
  the canonical `psl1.` token.
- `astro.config.ts` registers a build hook that validates the content directory
  before the build runs.

`apps/web/wrangler.jsonc` declares asset-first Cloudflare Workers Static Assets
(`poe-shopping-list-catalog`, `assets.directory: ./dist`, no `main`, no
`run_worker_first`). Deployment is manual; the CI workflow that packaged and
promoted a verified artifact was removed in `5db5b7a`.

## Validation

There is no automated test suite, by policy. Extension changes are validated with
`vp run ext:typecheck`, `vp run ext:check`, and `vp run ext:build`, plus manual
review in a supported browser. Catalog changes are validated with the commands
in [`public-site/setup.md`](./public-site/setup.md): `sync`, `check`,
`content:validate`, `build`, `output:check`, `links:check`, and
`wrangler:validate`. `smoke` and the manifest/deployment-record scripts require a
deployed site and protected configuration, so they are not part of local
validation.
