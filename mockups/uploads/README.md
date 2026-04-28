# PoE Shopping List — Extension + Catalog

A browser extension and companion website for Path of Exile that lets anyone create and share a curated list of trade searches for a build, so followers can load those searches on the trade site without setting them up from scratch every league.

---

## Problem

Pricing and acquiring gear for a Path of Exile build means juggling several places at once:

1. **Build guides (pobb.in, maxroll.gg, poe.ninja)** — what items the build needs and why
2. **pathofexile.com/trade** — one search per item, each with its own URL and filter config
3. **League resets** — every ~3 months, everyone following the same build rebuilds the same searches

Existing tools like PoE Better Trade let you bookmark your own trade searches locally. What they don't do:

- **Share** a curated list of searches so the next person following the same build starts with them already configured
- **Follow** a build guide's search list and load it into the trade site sidebar in one click
- **Bridge** build-guide pages to an existing list with an injected button

This project adds those things on top of a Better-Trade-style workflow.

---

## What is it?

Three pieces that work together:

| Piece                            | Role                                                                                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Extension** (WXT + Vue)        | On the trade site: save searches to a named list, see followed lists in a sidebar, click any item to run that search. On build-guide pages: inject a "View shopping list" button when a list is linked. |
| **Website** (Astro)              | Browse published lists, filter by league/game/ascendancy. Each list shows its items and trade links. "Follow in extension" CTA.                                                                         |
| **API** (Cloudflare Worker + D1) | Thin storage: write lists on publish, serve them on read, look up lists by build-guide URL. No scraping, no scheduled jobs.                                                                             |

Lists are **immutable on publish**. Changing a list means publishing a new one with a new slug.

---

## Core Loop

```
Create a list on the trade site  →  publish with optional build URL
         ↓
Followers see the injected button on the build-guide page
         ↓
They follow the list  →  it appears in their trade sidebar
         ↓
Each league reset: open sidebar, click items, search
```

---

## Features

| Feature                                                                | Extension | Website      | API          |
| ---------------------------------------------------------------------- | --------- | ------------ | ------------ |
| Fixed sidebar on trade pages                                           | ✓         |              |              |
| "New List" + "Save This Search" — curate searches from the trade page  | ✓         |              |              |
| Draft list stored locally                                              | ✓         |              |              |
| Publish list (immutable slug, optional build URL)                      | ✓         |              | ✓            |
| Follow a list (stored in browser.storage.local)                        | ✓         | ✓ (CTA)      |              |
| Followed lists in trade sidebar                                        | ✓         |              |              |
| Read list by slug                                                      |           | ✓            | ✓            |
| Browse catalog, filter by game/league/ascendancy                       |           | ✓            | ✓            |
| Injected "View shopping list" button on pobb.in, maxroll.gg, poe.ninja | ✓         |              |              |
| Build-guide page → matching list lookup                                | ✓         |              | ✓            |
| Chrome + Firefox (same codebase via WXT)                               | ✓         |              |              |
| PoE1                                                                   | ✓ (v1)    | ✓ (v1)       | ✓ (v1)       |
| PoE2                                                                   | flag (v2) | schema ready | schema ready |

---

## Tech Stack

| Concern             | Choice                                                   | Rationale                                                        |
| ------------------- | -------------------------------------------------------- | ---------------------------------------------------------------- |
| Extension framework | [WXT](https://wxt.dev)                                   | MV3 + Firefox support from one codebase                          |
| Extension UI        | [Vue 3](https://vuejs.org)                               | Composition API + `<script setup>`                               |
| Website             | [Astro](https://astro.build)                             | Mostly static list pages, Cloudflare Pages friendly              |
| Backend             | [Cloudflare Workers](https://workers.cloudflare.com)     | Free tier (100k req/day) is comfortable                          |
| Database            | [Cloudflare D1](https://developers.cloudflare.com/d1/)   | SQLite, free tier, fits the shape                                |
| Hosting (website)   | Cloudflare Pages                                         | Sibling to Workers, zero-config                                  |
| Spam control        | Cloudflare Turnstile                                     | Free, on `POST /lists`                                           |
| Shared types        | Zod + TypeScript                                         | Validates API payloads on both sides                             |
| Toolchain           | [VitePlus](https://viteplus.dev) + [Bun](https://bun.sh) | Unified build/test/lint/format; Bun as runtime + package manager |

No Cron Triggers. No KV. No R2. No external queue.

---

## Monorepo Layout

Bun workspaces.

```
poe-shopping-list/
├── apps/
│   ├── extension/         # WXT + Vue (Chrome + Firefox)
│   ├── website/           # Astro, deploys to Cloudflare Pages
│   └── api/               # Cloudflare Worker + D1
├── packages/
│   ├── schema/            # Zod + TS types shared by all apps
│   └── trade-dom/         # Selectors + aggregate math for trade-results pages
├── infra/
│   └── d1-migrations/     # SQL migrations via `wrangler d1 migrations apply`
├── package.json           (root workspace)
└── README.md
```

---

## Integration Points

Each build-guide site gets a content script that injects a "View shopping list" button and calls `GET /build-links/lookup?site=&key=` to find matching published lists.

| Site       | URL pattern                                                               | Lookup key    | Button placement              |
| ---------- | ------------------------------------------------------------------------- | ------------- | ----------------------------- |
| pobb.in    | `https://pobb.in/<slug>`                                                  | pobb.in slug  | Next to "Open in PoB" control |
| maxroll.gg | `https://maxroll.gg/poe/build-guides/<slug>`, `/poe2/build-guides/<slug>` | guide slug    | Build-guide header            |
| poe.ninja  | `https://poe.ninja/<league>/builds/character/<id>/<name>`                 | character URL | Character header              |
| poedb.tw   | —                                                                         | —             | **Skipped v1** — behavior TBD |

`trade2.pathofexile.com` + `poe.ninja/poe2/*` integrations come in v2 behind a feature flag.

---

## Architecture (high level)

```
┌─────────────────────────────┐         ┌─────────────────────────┐
│         Extension           │         │       Website           │
│  (WXT + Vue, MV3/MV2)       │         │  (Astro, Pages)         │
│                             │         │                         │
│  - sidebar: save searches   │         │  - /lists/:slug         │
│  - sidebar: followed lists  │         │  - /catalog             │
│  - draft + follow storage   │         │  - /privacy             │
│  - injected buttons         │         │  - "Follow in ext" CTA  │
└────────────┬────────────────┘         └────────────┬────────────┘
             │ POST /lists                            │ GET /lists/*
             │ GET  /build-links/lookup               │
             ▼                                        ▼
       ┌───────────────────────────────────────────────────────┐
       │            API — Cloudflare Worker (Hono)              │
       │  POST /lists                 (Turnstile, immutable)    │
       │  GET  /lists/:slug                                     │
       │  GET  /lists                 (catalog query)           │
       │  GET  /build-links/lookup                              │
       └────────────────────────────┬──────────────────────────┘
                                    │ SQL
                                    ▼
                        ┌────────────────────────┐
                        │    Cloudflare D1       │
                        │  lists, list_items,    │
                        │  picks, build_links    │
                        └────────────────────────┘
```

Full schema, route bodies, and the DOM-extraction contract live in [`ARCHITECTURE.md`](ARCHITECTURE.md).

---

## Implementation Sequence

PoE1 path to a shipping v1, in dependency order:

1. **Scaffold monorepo** — Bun workspaces, `apps/*`, `packages/*`, TS config, VitePlus toolchain
2. **`packages/schema`** — Zod types for list, item, pick, build-link, draft, follow, messages
3. **`packages/trade-dom`** — DOM selectors + aggregate math, unit-tested against trade-page fixtures
4. **`apps/api`** — Worker + D1 migrations; all 4 routes; Turnstile + IP rate-limit on publish
5. **Extension base** — WXT config (Chrome + Firefox); background message dispatcher; storage
6. **Trade sidebar — create** — "New List", "Save This Search", item management, price capture, F15 banner
7. **Extension follow** — follow/unfollow lists; followed lists in sidebar; `browser.storage.local`
8. **Extension publish** — draft view, build URL association, Turnstile, publish flow
9. **`apps/website`** — list page, catalog with filters, privacy policy, "Follow in extension" CTA
10. **Injected button scripts** — pobb.in → maxroll → poe.ninja (poedb.tw deferred)
11. **Ship** — CI (VitePlus + Bun), Firefox artifact, Chrome artifact

---

## Verification Checklist

Once v1 is built:

1. `bun install && viteplus build` succeeds across the workspace
2. D1 migrations apply: `bunx wrangler d1 execute DB --local --file=infra/d1-migrations/0001_initial.sql`
3. Worker serves locally: `bunx wrangler dev` → `GET /lists` returns `{ lists: [] }`
4. Extension loads unpacked: `bunx wxt build -b chrome` → Load unpacked in `chrome://extensions`
5. Sidebar appears on `www.pathofexile.com/trade` AND `pathofexile.com/trade`
6. "New List" → name it → search an item → "Save This Search" → item saved in sidebar
7. Publish with a pobb.in URL → slug returned → `/lists/:slug` renders items with trade links
8. Visit that pobb.in page → injected button appears → click → opens list page
9. Follow the list → it appears in the trade sidebar under "Following"
10. Unfollow → disappears
11. `bunx wxt build -b firefox` → extension loads in Firefox without warnings

---

## References

- [PoE Better Trade (Chrome Web Store)](https://chromewebstore.google.com/detail/fhlinfpmdlijegjlpgedcmglkakaghnk) — feature inspiration
- [WXT](https://wxt.dev) — extension framework
- [VitePlus](https://viteplus.dev) — unified toolchain
- [Bun](https://bun.sh) — runtime + package manager
- [Vue 3](https://vuejs.org)
- [Astro](https://astro.build)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) · [D1](https://developers.cloudflare.com/d1/) · [Pages](https://developers.cloudflare.com/pages/) · [Turnstile](https://developers.cloudflare.com/turnstile/)

---

## Related Docs

- [PRD.md](PRD.md) — personas, user flows, feature specs, acceptance criteria, open questions
- [ARCHITECTURE.md](ARCHITECTURE.md) — D1 schema, Worker routes, content-script contracts, integration hooks
