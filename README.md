# PoE Shopping List

A local-only browser extension and static catalog for Path of Exile shopping
Lists of Trade searches. There is no account, server, or remote synchronization,
and every import creates an independent local copy whose items start incomplete.

| Surface           | Path                      | Stack                                                                  | Role                                          |
| ----------------- | ------------------------- | ---------------------------------------------------------------------- | --------------------------------------------- |
| Browser extension | `apps/extension`          | WXT (Chrome MV3 side panel), Vue 3, Pinia, Nuxt UI 4, Tailwind v4, Zod | Create, edit, use, and complete Lists locally |
| Portable contract | `packages/shareable-list` | Zod schema plus the `psl1.` gzip/base64url transport                   | The one strict v1 format both surfaces use    |
| Static catalog    | `apps/web`                | Astro 5 static output, Tailwind v4 (daisyUI `lofi`), Zod               | Published List Catalog and craft notes        |

## Product

**Purpose.** Two surfaces for one job: keep a shopping List of Trade searches,
and get someone else's curated List into your own copy quickly. The extension is
a Personal Shopping Companion — save, import, edit, follow, and complete Lists
locally. The catalog publishes curated Published Lists and practical craft notes,
each exposing the official Trade search and its reasoning, with a share code for
import.

**Users.** A **Curator** writes a Published List whose every item carries a real
Trade search and a reason. A **player following a List** imports or creates a
List, opens Trade links, and checks items off. A **private trader** keeps a
personal List and never shares it.

**Register.** The extension sits beside the official Trade site and must feel
native to it; the catalog reads like a field note, not a build-guide funnel.
Clarity, density, and speed over visual flair. The extension is dark-only with
one brass accent; the catalog is a light, high-contrast, flat reference. UI copy
is terse ("New List", "Register Current Trade", "Import list", "Copy"), never
uses exclamation marks in buttons or labels, and reports errors specifically
while keeping the user's input so it can be corrected.

**Anti-references.** SaaS landing pages, build-guide funnels that bury the Trade
link beneath ads or video, loot spectacle and artificial urgency, and gamified UI
such as confetti, badges, or animated progress bars.

**Out of scope.** Accounts, server persistence, cloud sync, collaboration,
analytics, telemetry, recommendations, a social feed, pricing or price history,
purchase history, build importing, additional portable formats, and migration
shims or backward-compatibility layers for prior data shapes.

## Vocabulary

- **List** — a named collection of actionable trade items a person can use,
  edit, and share as a local copy.
- **Published List** — a curator-maintained, publicly browsable collection of
  recommended items with free-text guidance, intended for sharing and optional
  import.
- **Personal Draft** — a local-only, independently editable copy of a List,
  including completion state. Imports never synchronize with their source.
- **Shareable List** — the one strict, versioned, pricing-free JSON contract
  used for both Published List imports and person-to-person sharing, carried as
  the canonical `psl1.` share code.
- **List Accordion** — the side-panel interaction showing every local List as a
  vertical stack of expandable title bands, one expanded at a time.
- **Register Current Trade** — the action that captures the active Trade search
  URL and requires confirmation or editing of the item title before saving.
- **List Overview** — optional free-text guidance attached to a List.
- **List Item** — one actionable recommendation with a direct Trade URL, a
  variant, and optional rationale.
- **Category / Tag** — the single editorially managed primary classification,
  and the faceted classifications, for Published Lists.
- **League Applicability** — the game and named league(s), or evergreen status,
  a Published List targets.
- **Editorial Team** — the maintainers who review and merge content pull
  requests.
- **Catalog / Published List Card** — the public site's single page of
  Published Lists, rendered as compact, read-only cards with ordered Trade links
  and download/copy actions.
- **Trade Bench / League Noticeboard** — the visual systems of the extension and
  the catalog.

## Architecture

One pnpm workspace (`apps/*`, `packages/*`) holds three surfaces. The extension
is local-only, the catalog is a static site with no runtime API, and the two
share only the portable contract.

### Extension (`apps/extension`)

**Entrypoints.**

- `entrypoints/sidepanel.html` + `entrypoints/sidepanel/main.ts` mount `App.vue`
  with Pinia and the Nuxt UI plugin. The panel is dark-only: the bootstrap adds
  the `dark` class and `colorScheme` before Vue mounts.
- `entrypoints/background.ts` is the service-worker hub. It enables
  `chrome.sidePanel` only for tabs whose URL is under `pathofexile.com/trade/`,
  opens the panel on action click for those tabs (otherwise it navigates the tab
  to the Trade site), runs the legacy-storage reset on install and startup, and
  relays panel requests to the active tab's content script.
- `entrypoints/trade.content.ts` matches the two Trade hosts, reports whether the
  URL is a supported `/trade/search/` page, and extracts a current item name from
  the search input or result rows, falling back to the document title.

**Messaging.** `utils/messages.ts` declares the whole protocol, and it is two
messages returning the same payload:

| Message           | Direction                     | Payload                        |
| ----------------- | ----------------------------- | ------------------------------ |
| `csTradePageInfo` | background → content script   | `{ supported, url, itemName }` |
| `spTradePageInfo` | side panel → background → tab | the same payload, relayed      |

The service worker is the central hub: content scripts and the side panel never
message each other, because content scripts die on navigation and the panel may
be closed. Tab targeting lives in the background. When the active tab or its
content script is unavailable the background returns
`{ supported: false, url: "", itemName: "" }` rather than throwing. Extend the
`ProtocolMap` in `utils/messages.ts` before adding a message; never call raw
`browser.runtime.sendMessage` for extension traffic.

**UI.** `components/App.vue` renders `MineTab` plus the overlays (settings
popover, export sheet, import sheet, Register Current Trade modal).
`components/mine/MineTab.vue` owns the accordion: one expanding title band per
List, collapsible overview, grouped and root item rows, drag reorder, group
create/rename/delete, item move, completion, and the create/rename/delete
dialogs. `ItemRow.vue` is one clickable Trade row with a completion checkbox and
optional variant (an item `note` is carried through the Draft and the share
contract but not rendered). `ListAppearancePicker.vue` composes the icon or color
choice, `SaveModal.vue` implements Register Current Trade, `ImportSheet.vue` /
`ExportSheet.vue` own the share code, and `OverviewMarkdown.vue` renders the
sanitized overview. State lives in `composables/useDraftList.ts`,
`composables/useSettings.ts`, and `stores/ui.ts`; `useFocusTrap.ts` manages
overlay focus.

**Data model and storage.** Types and validation live in `types/draft.ts` (Zod,
strict). A `Draft` is `{ id, title, overview?, iconId? | color?, createdAt,
items[], groups[] }`; a group is `{ id, title?, position, items[] }`; an item is
`{ id, position, title, tradeUrl, variant?, note?, completed, addedAt }`.
`iconId` and `color` are mutually exclusive.

Storage keys are declared once in `types/storage.ts`:

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
and sets the marker. No obsolete shape is migrated. Draft and settings shapes are
strict Zod schemas, so unknown local data is dropped rather than repaired.

**Conventions.** All types are Zod schemas with inferred TypeScript types. Keep
domain math out of components: pure Draft operations (appearance, reorder, group
create/rename/remove, item update/remove/move, clear completed) belong in
`domain/drafts.ts`, and composables only persist their results. Cross-context
sync uses `storage.watch()` rather than a message listener. Components are
organized by area: `mine/`, `settings/`, `shared/`.

**Permissions.** The manifest requests only `storage` and `sidePanel`. Host
permissions are limited to `https://www.pathofexile.com/trade/*` and
`https://pathofexile.com/trade/*`; no other site has a content script or host
permission.

### Portable contract (`packages/shareable-list`)

The strict, versioned schema is the only portable format:

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
Each item requires a non-blank `title` and an HTTP(S) `tradeUrl`; `variant` and
`note` are optional, and a group `title` is optional. Objects are strict: unknown
fields, unsupported versions, malformed payloads, invalid URLs, and invalid
values are rejected rather than converted. The contract is groups-only; a flat
authored list is normalized into one untitled group at the export boundary.
Completion state, IDs, timestamps, account data, and synchronization metadata are
not portable. Limits: 500 items, 100 groups, 256 KiB compressed, 1 MiB
decompressed.

Transport (`encodeShareableList` / `decodeShareableList`):

- the token must start with `psl1.`;
- the payload is gzip (level 6, zero mtime) base64url encoded without padding,
  and the base64url text must be canonical;
- exactly one gzip member is allowed, and the footer CRC32 and length are
  verified against the decoded bytes;
- the payload must decode as UTF-8 and parse as JSON before schema validation.

Any failure throws `ShareableListTransportError`; the import surface reports the
message and keeps the pasted text so the user can correct it.

### Static catalog (`apps/web`)

- `src/content.config.ts` loads `src/content/lists/**/*.{md,mdx,json,yaml,yml}`
  into the `lists` collection with `publishedListSchema`.
- `src/domain/schemas.ts` defines the authoring contract: `title`, `category`
  slug, `tags` slugs, `applicability` (`game: "poe1"` with exactly one of
  `league` or `evergreen`), plus either `items` or `groups` (never both), each
  with at least one item. Items require `title` and an official
  `https://www.pathofexile.com/trade/search/...` URL with no credentials or
  fragment, plus optional `variant` and `rationale`. Everything is strict.
- `src/domain/taxonomy.ts` is the canonical category and tag list;
  `validate-content.ts` rejects unknown values and duplicate Trade URLs within a
  group, and rejects missing YAML frontmatter, symlinked content directories,
  and unreadable content roots.
- `src/domain/groups.ts` normalizes flat authored lists to one untitled group;
  `src/domain/serialize.ts` converts a Published List to the portable contract,
  mapping item `rationale` to `note` and never emitting a top-level `items`
  array.
- `src/domain/last-reviewed.ts` derives each list's `lastReviewed` from its last
  Git commit; production builds fail when a list has no review record.
- `src/pages/index.astro` renders the Catalog in title order with per-list
  Download and Copy share-code actions plus an explicit empty state;
  `src/pages/crafts.astro` is the authored craft notes route (Divine Life Flask,
  Large Elemental Cluster Jewel) with a Copy regex helper. Neither route has
  search, filtering, or per-list detail pages yet.
- `astro.config.ts` registers a build hook that validates the content directory
  before the build runs.
- `wrangler.jsonc` declares asset-first Cloudflare Workers Static Assets
  (`poe-shopping-list-catalog`, `assets.directory: ./dist`, no `main`, no
  `run_worker_first`).

## Design

**Extension — Trade Bench.** A quiet, dark ledger with one hot accent.
`src/styles/tokens.css` is the source of truth (`color-scheme: dark`, `--poe-*`
palette with `#e5a83b` as the accent); `src/assets/main.css` maps the Nuxt UI
primary/neutral ramps onto those tokens. The panel is dark-only, compact, and
dense — information density is a feature.

**Catalog — League Noticeboard.** A frank, experienced field reference: white
surfaces, sparse ruled annotations, asymmetric whitespace, hairline rules, and no
shadows, gradients, glass, or floating cards. Structure comes from typography and
rules. `src/styles/theme.css` holds the type scale and maps the daisyUI `lofi`
theme onto `--field-*` semantic variables; `catalog.css` and `crafts.css` use
those variables (`--field-paper`, `--field-soft`, `--field-line`, `--field-ink`,
`--field-action`, `--field-muted`, `--field-faint`). Outfit (with Noto Sans /
system sans fallback) carries prose and headings; a monospace stack carries
numbers, regex, and metadata. Official Trade and sourced actions use the action
color, practical annotations and real warnings get their own semantic colors, and
color is never atmospheric decoration. The catalog uses a 940px measure with 4vw
gutters, the craft route 800px; catalog entries stack at 700px and below, crafts
collapse to one column at 560px and below. Focus is always visible, and
`prefers-reduced-motion: reduce` removes smooth scrolling and shortens
transitions — motion never reveals instructions or copies a Trade query. Meet
WCAG 2.2 AA as the baseline.

## Development

```sh
vp install
vp run ext                # run the extension in a browser
vp run ext:prototype      # reusable Vue side panel with seeded local mocks
vp run ext:typecheck      # vue-tsc over the extension source
vp run ext:check          # format and lint the extension source
vp run ext:build          # production build
vp run ext:zip            # package the built extension
vp run web:dev            # run the catalog site
vp run web:sync           # generate Astro collection types
vp run web:check          # Astro type checks
vp run web:content:validate
vp run web:build
vp run web:output:check
vp run web:links:check
vp check                  # format and lint at the root
```

`web:preview` serves a local build, and `wrangler:validate` is a static-assets
dry run that needs no Cloudflare credentials. The equivalent package-scoped
commands are `corepack pnpm --dir apps/web <script>`; use the Corepack-managed
pnpm (`pnpm@10.28.0`).

**Validation policy.** This repository intentionally has no automated test
suite. Do not add test files, test runners or dependencies, or test CI unless the
maintainer explicitly requests them. Validate extension changes with
`ext:typecheck`, `ext:check`, and `ext:build` plus manual review in a supported
browser; validate catalog changes with `web:sync`, `web:check`,
`web:content:validate`, `web:build`, `web:output:check`, and `web:links:check`.
`web:smoke` verifies a deployed site against a manifest and requires
`PUBLIC_SITE_URL` and `CONTENT_MANIFEST_PATH`, so it is not part of local
validation.

## Contributing Published Lists

Published Lists are authored from scratch in a reviewed Git pull request; that is
the only content intake path — no issue form, no web editor, no seed or migration
from extension drafts, and no placeholder or fixture content. Code changes follow
normal code review and are not a content proposal surface.

1. Author the list under `apps/web/src/content/lists/` using
   [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md).
2. Give each list exactly one canonical Category, only canonical Tags from
   `apps/web/src/domain/taxonomy.ts`, exactly one league or evergreen
   applicability, and either `items` or `groups` in intentional source order.
3. Give every item a direct official Trade URL, a variant, and optional
   rationale; give the list an optional overview. Add no price, cache, query,
   account, completion, source, or author-supplied `lastReviewed` data —
   publication review derives review metadata from Git.
4. Run the catalog checks above, and open and inspect every Trade URL at review
   time, recording the reviewer, UTC date, and result in the PR. Automated URL
   shape checks do not replace that review.
5. Maintainers review content correctness, taxonomy, applicability, ordering,
   and the export boundary, then merge. A content defect is fixed with a
   reviewed revert PR, not a migration.

Taxonomy additions are proposed inside a content PR or as an issue; the
Editorial Team implements them in `taxonomy.ts` before a list can reference them.
An empty Catalog is a valid state and must truthfully say no Published Lists are
available yet. Download and copy emit only the strict Shareable List v1 contract:
`title`, `tradeUrl`, `variant?`, and `note?` per item, with no catalog metadata.
Direct browser-to-extension handoff is deferred; do not add messaging, host
permissions, or a new import protocol for it.

## Status

**Shipped.** Extension: draft CRUD with optional icon or color appearance, items
and titled groups with drag reorder and cross-group moves, per-item local
completion, the accordion side panel, strict share-code import/export, Register
Current Trade through the background hub with title confirmation, trade-page-only
panel scope, and the `openItemsInNewTab` setting. Catalog: the Catalog route with
Download and Copy share codes, the `/crafts/` route, the content contract and
taxonomy validation, build/route/link/output checks, and three published lists
(`cws-chieftain`, `manyshot-mercenary`, `rf-essentials`).

Not implemented:

- Browser-store release. `apps/extension/package.json` is `0.0.1` while the
  manifest is `0.1.0`; there is no Firefox target build or runtime adapter,
  store metadata, privacy policy, or packaging evidence. Firefox needs
  `import.meta.env.FIREFOX` handling for `browser.sidebarAction` because the
  Chrome `chrome.sidePanel` runtime calls are not abstracted by WXT.
- Catalog search, filtering, and URL filter state.
- Better Trading export import (issues #25–#27), mercenary archetype coverage
  beyond the single Manyshot list (#24), and contributor issue-form intake
  (#17–#21).

Deployment is manual: `corepack pnpm --dir apps/web deploy` after a successful
validation run, with `deploy:preview` uploading a preview version. There is no CI
workflow — the one that validated, packaged, and promoted a production artifact
was removed in `5db5b7a` — so a manual deployment must still record the source
SHA, merged PR, artifact identity, Worker version, actor, timestamp, site URL,
and smoke result. Launch is blocked on an assigned deployment owner and backup
owner, Cloudflare account access, a canonical HTTPS hostname with Custom Domain
and Universal SSL, a least-privilege deployment token, a restored
artifact-promotion path, an off-platform repository mirror with a restore drill,
and the protected manual accessibility review.

## Repository layout

```
poe-shopping-list/
├── apps/extension/          # WXT + Vue side panel
├── apps/web/                # Astro catalog and craft notes
├── packages/shareable-list/ # Shareable List v1 schema and psl1. transport
├── AGENTS.md                # Agent operating rules for this repository
├── VENT.md                  # Workflow-friction log
└── package.json             # Root workspace
```

Issues are tracked in GitHub Issues for `max-arias/poe-shopping-list`; see
[`AGENTS.md`](AGENTS.md) for triage labels and tracker conventions.
