# Architecture — PoE Shopping List

Technical companion to [README.md](README.md) and [PRD.md](PRD.md). Covers the D1 schema, Worker routes, extension message contracts, DOM extraction contract, integration hooks, and the PoE2 forward-compat story.

---

## System Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                   Extension (MV3 Chrome / MV2 Firefox)           │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐    │
│  │ Popup (Vue)    │  │ Options (Vue)  │  │ Content scripts  │    │
│  │ - My Lists tab │  │ - league pick  │  │ - trade sidebar  │    │
│  │ - Following tab│  │ - defaults     │  │ - injected btns  │    │
│  │ - Publish CTA  │  │                │  │                  │    │
│  └───────┬────────┘  └───────┬────────┘  └─────────┬────────┘    │
│          │                   │                     │             │
│          └───────────────────┴─────────────────────┘             │
│                              │                                   │
│                ┌─────────────▼──────────────┐                    │
│                │ Background service worker  │                    │
│                │ - chrome.storage.local     │                    │
│                │ - draft merge              │                    │
│                │ - API client (fetch)       │                    │
│                └─────────────┬──────────────┘                    │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                         HTTPS │ (POST /lists, GET *)
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│              API — Cloudflare Worker (Hono or similar)            │
│                                                                   │
│   POST /auth/callback        (PoE OAuth code exchange → JWT)      │
│   POST /lists                (Bearer JWT required)                │
│   GET  /lists/:slug          (410 Gone if deleted)                │
│   PATCH /lists/:slug         (Bearer JWT + ownership required)    │
│   DELETE /lists/:slug        (Bearer JWT + ownership required)    │
│   GET  /lists                (catalog query, excludes deleted)    │
│   GET  /build-links/lookup   (cross-site button)                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │ SQL (prepared statements)
                               ▼
                 ┌──────────────────────────────┐
                 │      Cloudflare D1           │
                 │ lists / list_items / picks / │
                 │ build_links                  │
                 └──────────────────────────────┘

        Website (Astro, Pages) ── GET /lists, GET /lists/:slug ──┘
```

No cron jobs, no queues. The only external HTTP call from the Worker is to `pathofexile.com/oauth/token` + `pathofexile.com/api/profile` during the auth callback exchange.

---

## D1 Schema (v1)

SQLite. All timestamps are Unix epoch milliseconds.

```sql
CREATE TABLE authors (
  poe_account_id  TEXT PRIMARY KEY,           -- UUID from PoE OAuth profile
  display_name    TEXT NOT NULL,              -- account name shown on lists
  created_at      INTEGER NOT NULL
);

CREATE TABLE lists (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  slug            TEXT NOT NULL UNIQUE,
  author_poe_id   TEXT NOT NULL REFERENCES authors(poe_account_id),
  game            TEXT NOT NULL CHECK (game IN ('poe1', 'poe2')),
  league          TEXT NOT NULL,
  title           TEXT NOT NULL,
  ascendancy      TEXT,
  pob_hash        TEXT,                       -- deterministic hash of the PoB code
  source_url      TEXT,                       -- optional: pobb.in / maxroll / etc. link the author associated
  published_at    INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,           -- same as published_at on first insert; updated on PATCH
  deleted_at      INTEGER                     -- NULL = active; set = soft-deleted (returns 410 Gone)
);
CREATE INDEX idx_lists_game_league_published ON lists (game, league, published_at DESC);
CREATE INDEX idx_lists_pob_hash              ON lists (pob_hash);
CREATE INDEX idx_lists_author                ON lists (author_poe_id);

CREATE TABLE list_items (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id          INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  position         INTEGER NOT NULL,           -- stable ordering inside a list
  kind             TEXT NOT NULL CHECK (kind IN
                      ('unique','rare','gem','flask','jewel','cluster','base')),
  name             TEXT NOT NULL,              -- e.g. 'Headhunter'
  base             TEXT,                       -- e.g. 'Leather Belt'
  trade_query_json TEXT NOT NULL,              -- JSON body posted to pathofexile.com/trade
  item_hash        TEXT NOT NULL               -- deterministic hash of (kind,name,base,trade_query_json)
);
CREATE INDEX idx_list_items_list ON list_items (list_id, position);

CREATE TABLE picks (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  list_item_id          INTEGER NOT NULL REFERENCES list_items(id) ON DELETE CASCADE,
  listing_url           TEXT,                  -- canonical URL/id of the picked listing
  picked_price_value    REAL NOT NULL,
  picked_price_currency TEXT NOT NULL,         -- 'chaos', 'divine', 'alt', etc.
  sample_min            REAL NOT NULL,
  sample_median         REAL NOT NULL,
  sample_avg            REAL NOT NULL,
  sample_size           INTEGER NOT NULL,
  raw_samples_json      TEXT,                  -- capped array of {value, currency} objects
  captured_at           INTEGER NOT NULL
);
CREATE INDEX idx_picks_list_item ON picks (list_item_id);

CREATE TABLE build_links (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id       INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  site          TEXT NOT NULL CHECK (site IN ('pobb','maxroll','poeninja','poedb')),
  external_key  TEXT NOT NULL,                 -- pobb slug / maxroll guide slug / character URL / item name
  created_at    INTEGER NOT NULL
);
CREATE INDEX idx_build_links_site_key ON build_links (site, external_key);
```

Immutability: there is no `updated_at` on `lists`. The only mutation permitted in v1 is deletion via a manual Worker admin path (future, not shipped).

Why one `picks` row per `list_item` (not per-list) — an item may be re-picked during drafting. The extension keeps only the latest pick locally, so publish typically inserts 1 `picks` row per `list_item`. Schema allows history if ever useful.

---

## Worker Routes

### `POST /auth/callback`

PoE OAuth code exchange. Called by PoE after the user authorizes the app.

**Query params:** `code`, `state` (state encodes the PKCE `code_verifier`)

**Flow:**

1. Decode `code_verifier` from `state`.
2. POST to `https://www.pathofexile.com/oauth/token` with `code`, `code_verifier`, `client_id`, `client_secret`.
3. Fetch `https://www.pathofexile.com/api/profile` with the returned access token.
4. Upsert `authors (poe_account_id, display_name)`.
5. Issue a signed session JWT: `{ poe_account_id, display_name, exp: now+24h }` signed with `JWT_SECRET` (Cloudflare Worker secret).
6. Redirect to `<website>/auth/success?token=<jwt>`.

**Protections:** IP rate limit on this endpoint (e.g. 20/IP/hour) to limit OAuth abuse.

---

### Auth Middleware

All authenticated routes (`POST /lists`, `PATCH /lists/:slug`, `DELETE /lists/:slug`) run this middleware:

1. Read `Authorization: Bearer <token>` header.
2. Verify JWT signature against `JWT_SECRET`; check `exp`.
3. On failure → `401 { error: 'unauthorized' }`.
4. On success → attach `{ poe_account_id, display_name }` to request context.

---

### `POST /lists`

Publish a list. **Requires auth.**

**Protections**

- Bearer session JWT required (auth middleware)
- Per-IP rate limit: N publishes per hour

**Request body** (Zod-validated via `@pkg/schema`)

```ts
{
  game: 'poe1' | 'poe2',
  league: string,
  title: string,               // 3..120 chars
  ascendancy?: string,
  pob_hash?: string,
  source_url?: string,
  build_links?: Array<{ site: 'pobb'|'maxroll'|'poeninja'|'poedb', external_key: string }>,
  items: Array<{
    position: number,
    kind: 'unique'|'rare'|'gem'|'flask'|'jewel'|'cluster'|'base',
    name: string,
    base?: string,
    trade_query_json: unknown,  // validated as a JSON object
    pick?: {
      listing_url?: string,
      picked_price_value: number,
      picked_price_currency: string,
      sample_min: number,
      sample_median: number,
      sample_avg: number,
      sample_size: number,
      raw_samples?: Array<{ value: number, currency: string }>,
      captured_at: number
    }
  }>
}
```

**Response**

```ts
{ slug: string, url: string }
```

Worker runs everything in one D1 transaction (D1 batch): upsert `authors`, insert `lists` (with `author_poe_id` from JWT), then `list_items`, then `picks`, then `build_links`. Slug is generated as a random 10-char base32 string; retried on unique-index collision (unlikely).

### `GET /lists/:slug`

Returns `410 Gone` with `{ error: 'list_deleted' }` if `deleted_at` is set.

```ts
{
  list: { id, slug, author_display_name, game, league, title, ascendancy, pob_hash, source_url, published_at, updated_at },
  items: Array<ListItem & { pick: Pick | null }>
}
```

### `PATCH /lists/:slug`

Edit a list. **Requires auth + ownership.**

Worker verifies `lists.author_poe_id = jwt.poe_account_id`; returns `403` otherwise. Accepts a partial body; replaces items atomically (delete + re-insert in one D1 batch). Updates `updated_at`.

```ts
// Request body (all fields optional; omitted = unchanged)
{
  title?: string,
  ascendancy?: string,
  source_url?: string,
  build_links?: Array<{ site, external_key }>,
  items?: Array<{ position, kind, name, base?, trade_query_json, pick? }>
}
// Response
{ slug: string, updated_at: number }
```

### `DELETE /lists/:slug`

Soft-delete a list. **Requires auth + ownership.**

Sets `lists.deleted_at = now()`. Subsequent `GET /lists/:slug` returns `410 Gone`. Catalog queries exclude rows where `deleted_at IS NOT NULL`.

```ts
// Response
{ slug: string, deleted_at: number }
```

### `GET /lists`

Catalog query. Excludes soft-deleted lists (`deleted_at IS NULL` filter). Supports `?game=`, `?league=`, `?ascendancy=`, `?q=` (title text search via `LIKE`), `?cursor=` (id-based pagination), `?limit=` (capped at 50).

Returns newest first. Each row includes a precomputed `total_estimate` when all picks in the list agree on a single currency; otherwise `null`.

### `GET /build-links/lookup?site=&key=`

```ts
{
  matches: Array<{
    slug: string;
    title: string;
    game: "poe1" | "poe2";
    league: string;
    published_at: number;
  }>;
}
```

Newest first, capped at 10. Excludes deleted lists. Drives the injected "View shopping list" button.

---

## Extension UX on Trade Pages

The extension injects a fixed right-side sidebar on `pathofexile.com/trade/*` pages, mirroring the layout of the Better Trading extension. The sidebar is a mounted Vue 3 component (`TradeSidebar.vue`).

### Sidebar layout

```
┌─────────────────────────────────┐
│  [folder] Penance Brand Build ▾ │
│    ✓ The Grey Wind Spectral Axe ···│
│    ✓ Crown of Eyes Hubris …    ···│
│      Rathpith Globe Titanium … ···│
│      …                             │
│  [folder] Animate Guardian    ▾ │
│    ✓ Garb of the Ephemeral …   ···│
│      …                             │
│                                    │
│  [ + New Folder ]  [ Import ]      │
│  ┌──────────────────────────────┐  │
│  │   Register Current Trade    │  │  ← gold button
│  └──────────────────────────────┘  │
└─────────────────────────────────┘
```

### "Save This Search" flow

1. User runs a trade search; results are visible.
2. User clicks **Save This Search** in the sidebar.
3. A **"Save Search"** modal opens with a Name field pre-populated from the trade search bar text.
4. User edits the name and clicks **Save**.
5. On save, the content script calls `buildCapture(document, window.location.href)`, which reads all visible `.row[data-id]` elements and computes price statistics.
6. The item (name + tradeUrl + capture) is sent to the background via `draft:add-search`.

### Per-item `···` menu actions

| Action                | Behaviour                                                                |
| --------------------- | ------------------------------------------------------------------------ |
| Copy URL to clipboard | `navigator.clipboard.writeText(item.tradeUrl)`                           |
| Open search           | `window.open(item.tradeUrl)`                                             |
| Refresh price         | Re-runs `buildCapture` on current page and merges into the existing item |
| Mark as complete      | Toggles the checkmark on the item                                        |
| Edit                  | Inline rename of the item name                                           |
| Delete                | Removes item from draft                                                  |

---

## Extension Messaging

```
┌─────────────┐    mounts Vue component        ┌────────────────────┐
│ content-    │ ─────────────────────────────▶ │ TradeSidebar.vue   │
│ script      │                                │ (fixed right panel │
│ trade.ts    │                                │  on trade pages)   │
│             │ ──┐                            └────────────────────┘
└─────────────┘   │
                  │ chrome.runtime.sendMessage
                  ▼
          ┌──────────────────────┐
          │ Background worker    │
          │ - draft store        │
          │ - API client         │
          │ - dispatches to UI   │
          └──────────────────────┘
                  ▲
                  │ chrome.runtime.sendMessage
                  │
          ┌──────────────────────┐
          │ Popup / Options Vue  │
          └──────────────────────┘
```

**Message types** (discriminated `type` field, Zod in `@pkg/schema`):

- `draft:get` → returns current draft
- `draft:new` (from popup or sidebar) → creates a new named draft, returns it
- `draft:add-search` (from trade content script) → adds a new item (name + tradeUrl + optional `TradeCapture`) to the draft, returns updated draft
- `draft:update-search` (from "Refresh price" menu action) → replaces the `TradeCapture` on an existing item
- `draft:set-complete` → toggles completed state on a draft item
- `draft:delete` → removes an item from the draft
- `draft:publish` (from popup) → background reads JWT from `auth:v1`, calls `POST /lists` with Bearer token, returns slug + url
- `auth:login` (from popup) → background opens OAuth tab, awaits success redirect, stores JWT in `auth:v1`, returns `{ poe_account_id, display_name }`
- `auth:logout` (from popup) → background clears `auth:v1` from storage
- `auth:get` (from popup) → returns current session info or `null` if not logged in
- `list:patch` (from popup or website) → background calls `PATCH /lists/:slug` with Bearer token
- `list:delete` (from popup or website) → background calls `DELETE /lists/:slug` with Bearer token
- `follow:get` → returns all followed lists from storage
- `follow:add` (slug + metadata) → stores to `followed:v1`, returns updated list
- `follow:remove` (slug) → removes from `followed:v1`, returns updated list
- `build-link:lookup` (from injected-button content scripts) → background calls `GET /build-links/lookup`

Draft is persisted under `browser.storage.local` key `draft:v1` (via `@wxt-dev/storage`).
Followed lists are persisted under `browser.storage.local` key `followed:v1`.
Session JWT is persisted under `browser.storage.local` key `auth:v1` as `{ token, poe_account_id, display_name, exp }`.

---

## Content-Script Contract — `packages/trade-dom`

Lives in a shared package so it is unit-testable without a browser.

```ts
export interface RawListing {
  listingId: string;
  priceValue: number;
  priceCurrency: string;
}

export interface TradeCapture {
  tradeUrl: string; // window.location.href at capture time
  samples: RawListing[]; // every price-bearing visible listing
  aggregates: {
    min: number;
    median: number;
    avg: number;
    sampleSize: number;
    currency: string; // dominant currency across samples
  };
  capturedAt: number;
}

export function extractSamples(root: Document | Element): RawListing[];
export function buildCapture(root: Document, tradeUrl: string): TradeCapture;
```

There is no "picked listing" concept. Capture is triggered at the page level when the user registers a trade (see Extension UX below), not per result row.

### Selectors (confirmed against sample HTML)

All three trade-page layout variants (`.results`, `.results.compact`, `.results.compact.two`) share the same row DOM. The layout class is CSS-only.

| Data            | Selector                                                                          |
| --------------- | --------------------------------------------------------------------------------- |
| All result rows | `.resultset .row[data-id]`                                                        |
| Listing ID      | `row.dataset.id`                                                                  |
| Price wrapper   | `row.querySelector('[data-field="price"]')`                                       |
| Price amount    | first `<span>` child of price wrapper with textContent matching `/^\d+(\.\d+)?$/` |
| Currency        | `priceWrapper.querySelector('.currency-text img[alt]')?.getAttribute('alt')`      |

`.row-total` (results count header) and `.row.controls` (Load More footer) have no `data-id` and are automatically excluded.

### Currency normalization

- Stored verbatim as the string rendered by the trade page (`chaos`, `divine`, etc.).
- Aggregates are computed only across samples that share the dominant currency; samples in minority currencies are kept in `samples` but excluded from `min/median/avg` and `sampleSize`.
- Tie-break when two currencies share equal count: `chaos` > `divine` > alphabetical.

---

## Integration Hooks Per Site

Each site gets its own content script registered in WXT. Each exports `{ match, deriveKey, injectButton }`.

### pobb.in

- `match`: `https://pobb.in/*`
- Key: path segment after `pobb.in/` (the slug)
- Button anchor: near the existing "Open in PoB" control
- Selectors: TODO once live against current pobb.in DOM

### maxroll.gg

- `match`: `https://maxroll.gg/poe/build-guides/*`, `https://maxroll.gg/poe2/build-guides/*`
- Key: final path segment (the guide slug); `game` derived from `/poe/` vs `/poe2/`
- Button anchor: top of the build-guide header

### poe.ninja

- `match`: `https://poe.ninja/*/builds/character/*`
- Key: character URL (entire path)
- Button anchor: character header
- Note: poe.ninja character pages are React-rendered; content script must wait for hydration (pattern already used by `poe-build-pricer`). See that prototype's `content.js` for a DOM-readiness pattern to crib.

### poedb.tw

- `match`: `https://poedb.tw/us/*`
- Key: item or base name derived from the URL
- Behavior: **open question** (see PRD open question #1). Placeholder: disabled in v1, lookup-on-hover in v2.

---

## Spam & Abuse Control

- **PoE OAuth** is the primary gate — only authenticated PoE accounts can publish. No anonymous submissions.
- **IP rate limit** via Cloudflare Worker bindings on `/auth/callback` (20/IP/hour) and `POST /lists` (10/IP/hour).
- **Payload limits** — enforced by Zod: title 3..120 chars, items ≤ 100 per list, raw_samples ≤ 50 per pick, body ≤ 256KB.
- **Turnstile** — removed. OAuth provides stronger identity guarantees.
- **Takedown** — owner self-service via `DELETE /lists/:slug`. Admin-initiated delete uses a master JWT (`ADMIN_JWT_SECRET` Worker secret) that bypasses ownership check.

---

## PoE2 Forward-Compat

Nothing about the schema is PoE1-specific. The `game` column on `lists`, the `game` filter in the catalog query, and the `site` enum on `build_links` all anticipate both games. What ships PoE1-only in v1:

- `packages/trade-dom` selectors — only `pathofexile.com/trade/*`
- Trade query generation (no PoE2 query templates shipped in v1)
- Extension UI — league dropdown filtered to PoE1 leagues; PoE2 option disabled with a "coming soon" tooltip

When PoE2 support is added, no migration is required; only new content scripts, new query templates, and enabling the PoE2 option in the UI.

---

## Privacy

- **Author identity stored server-side:** `authors.poe_account_id` (PoE UUID) and `display_name` (account name) are stored in D1 and linked to every published list. This is disclosed in the `/privacy` policy page.
- **OAuth scope:** only `account:profile` is requested. No stash, characters, trade data, or personal contacts are accessed.
- **Session JWT:** stored only in the user's browser (`chrome.storage.local` key `auth:v1`); never sent to the website or third parties; expires after 24h.
- The only other outbound personal data a user sends to the backend:
  - Their picked trade listing (already public on the trade site)
  - The PoB code hash (not the code itself)
- Drafts live only in the user's browser (`chrome.storage.local`).
- The `/privacy` policy page must be updated at launch to reflect author storage and OAuth scope.

---

## Outstanding TODOs Blocking Implementation

1. **Decision on poedb.tw integration behavior** (PRD open question #1) before shipping the poedb content script.
2. **Rate-limit thresholds** (publishes/IP/hour, items/list cap) validated against real draft sizes once the extension is usable end-to-end.
3. **Register PoE OAuth application** at `https://www.pathofexile.com/developer/docs` — obtain `client_id` + `client_secret`; register the Worker's production `/auth/callback` URL as the allowed `redirect_uri`; store secrets in Cloudflare Worker environment (`wrangler secret put`).
4. **`JWT_SECRET` and `ADMIN_JWT_SECRET`** — generate strong random secrets; add via `wrangler secret put JWT_SECRET` and `wrangler secret put ADMIN_JWT_SECRET` before first deploy.
5. **Extension OAuth tab detection** — decide implementation: poll for tab URL change vs. use `chrome.tabs.onUpdated` listener in background worker to detect `<website>/auth/success?token=` redirect and extract JWT.

_Previously blocking: sample trade-page HTML — resolved. Three layout variants confirmed; selectors documented above. Fixtures ready to be committed under `packages/trade-dom/test/fixtures/`._
