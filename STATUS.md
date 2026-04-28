# PoE Shopping List — Implementation Status

Last updated: 2026-04-27

## Legend

- ✅ Done — complete and working
- 🔶 Partial — code exists, but incomplete or blocked
- 🔴 Todo — not started or fully stubbed

---

## Packages

| Package              | Status | Notes                                               |
| -------------------- | ------ | --------------------------------------------------- |
| `packages/schema`    | ✅     | All Zod types, message union, storage keys; `RecentPurchase` + `associatedUrls` added |
| `packages/trade-dom` | ✅     | DOM extraction, price aggregation, 13 passing tests |

---

## API (`apps/api` — Cloudflare Worker)

| Route                     | Status | Notes                                                  |
| ------------------------- | ------ | ------------------------------------------------------ |
| `GET /auth/callback`      | ✅     | PKCE exchange, JWT issue, rate-limit 20/IP/hr          |
| `GET /lists`              | ✅     | Catalog with game/league filters + cursor pagination   |
| `GET /lists/:slug`        | ✅     | Detail with items and picks                            |
| `POST /lists`             | ✅     | Publish with atomicity, rate-limit 10/IP/hr            |
| `PATCH /lists/:slug`      | ✅     | Owner-gated update                                     |
| `DELETE /lists/:slug`     | ✅     | Soft-delete                                            |
| `GET /build-links/lookup` | ✅     | Lookup by (site, external_key)                         |
| **Deploy**                | 🔴     | Secrets not set, wrangler.toml not configured for prod |

**Blockers before API can go live:**

- `POE_CLIENT_ID` + `POE_CLIENT_SECRET` — must register app at pathofexile.com/developer
- `JWT_SECRET` + `ADMIN_JWT_SECRET` — generate and `wrangler secret put`
- `VITE_API_BASE` env var — set in extension for prod build

---

## Extension (`apps/extension`)

### Infrastructure

| Item                              | Status | Notes                                                                                 |
| --------------------------------- | ------ | ------------------------------------------------------------------------------------- |
| Side panel opens on icon click    | ✅     | `setPanelBehavior` + enabled/disabled per tab                                         |
| Panel only on trade/build pages   | ✅     | `tabs.onActivated` + `tabs.onUpdated`; includes pobb.in + maxroll.gg                 |
| Content script (trade page)       | ✅     | Price capture relay, search bar text, recent-purchase tracking                        |
| Content script (build guide pages)| ✅     | pobb.in + maxroll.gg; FAB/ribbon injected via `build.content.ts`                     |
| Background `open-sidepanel` msg   | ✅     | Content scripts can request panel open (used by FAB click)                           |
| Component auto-imports            | 🔶     | Prod build requires explicit imports in each SFC — add imports when adding components |

### Features

| Feature                          | Flow | Status | Notes                                                                         |
| -------------------------------- | ---- | ------ | ----------------------------------------------------------------------------- |
| Create draft list                | A    | ✅     | New list button, name input, validation                                       |
| Save search as item              | B    | ✅     | SaveModal, buildCapture, price stats captured                                 |
| Mark item complete               | —    | ✅     | Toggle in ItemRow                                                             |
| Delete item / list               | —    | ✅     | KebabMenu + "More options" → "Delete this list" with item-count confirmation  |
| Bulk unmark all items            | F13  | ✅     | "More options" → "Unmark all" with confirmation; clears completed + captures  |
| Settings (theme, league, toggles)| —    | ✅     | SettingsPopover; `autoCapturePrice`, `openItemsInNewTab`, `enableRecentPurchases` |
| Follow / unfollow list           | F    | ✅     | `useFollowedLists`, max 50                                                    |
| Browse trending (in panel)       | E    | ✅     | TrendingTab fetches `GET /lists`                                              |
| View followed list detail        | —    | ✅     | DetailPanel + ChecklistView                                                   |
| Link build URL to draft          | —    | ✅     | "Link build URL" in More options; supports primary URL + associatedUrls array |
| Auto-open draft on build page    | —    | ✅     | App.vue checks active tab URL vs draft buildUrl/associatedUrls on load        |
| Recent purchases tab             | —    | ✅     | `useRecentPurchases`, `RecentPurchasesTab`; opt-in via settings; assign to list; clear all |
| Capture unavailable banner       | F15  | ✅     | Shows when DOM selectors fail                                                 |
| FAB / ribbon on build pages      | D/F11| 🔶     | pobb.in + maxroll.gg only; matches local drafts by URL (not API lookup); poe.ninja + poedb.tw missing |
| **Login with PoE OAuth**         | G    | 🔴     | `startOAuthFlow()` returns error stub — PKCE + tab detection not wired        |
| **Publish list**                 | C    | 🔴     | PublishSheet UI done; blocked on OAuth                                        |

### OAuth implementation checklist (Flow G — `background.ts`)

- [ ] Generate PKCE `code_verifier` + `code_challenge`
- [ ] Open PoE OAuth tab with correct params
- [ ] Detect redirect to `/auth/success?token=<jwt>` in `tabs.onUpdated`
- [ ] Decode + validate JWT in `handleAuthSuccess()`
- [ ] Store `AuthSession` under `local:auth:v1`
- [ ] Close OAuth tab after success

---

## Website (`apps/website`)

| Page            | Status | Notes                                                 |
| --------------- | ------ | ----------------------------------------------------- |
| `/` landing     | ✅     | Hero, 3 hardcoded featured builds, InstallCTA         |
| `/privacy`      | ✅     | Full privacy policy                                   |
| `/how-it-works` | ✅     | Feature doc page                                      |
| `/lists/[slug]` | 🔶     | Renders from fixture data (`data/builds.ts`), not API |
| `/catalog`      | 🔴     | Not started; API query ready, no Astro page           |
| List edit UI    | 🔴     | API PATCH done; no owner-gated edit form              |
| API integration | 🔴     | All pages use hardcoded fixtures                      |

---

## User Flows (PRD § Flows A–I)

| Flow | Description                    | Status                                                                  |
| ---- | ------------------------------ | ----------------------------------------------------------------------- |
| A    | Create draft list              | ✅                                                                      |
| B    | Save trade search to list      | ✅                                                                      |
| C    | Publish list                   | 🔴 Blocked on OAuth                                                     |
| D    | Injected button on build guide | 🔶 FAB/ribbon on pobb.in + maxroll.gg; poe.ninja/poedb.tw missing; uses local draft matching, not API lookup |
| E    | Browse catalog                 | 🔶 Extension has it; website missing                                    |
| F    | Follow a list                  | ✅                                                                      |
| G    | Login with PoE account         | 🔴 Stubbed                                                              |
| H    | Edit published list            | 🔶 API done; no UI                                                      |
| I    | Delete published list          | 🔶 API done; no UI trigger                                              |

---

## Tests

| Area                 | Status | Notes                         |
| -------------------- | ------ | ----------------------------- |
| `packages/trade-dom` | ✅     | 13 Vitest cases — all passing |
| `apps/api`           | 🔴     | No tests                      |
| `apps/extension`     | 🔴     | No tests                      |
| `apps/website`       | 🔴     | No tests                      |

---

## Deployment

| Target                     | Status | Notes                                     |
| -------------------------- | ------ | ----------------------------------------- |
| Cloudflare Worker (API)    | 🔴     | Secrets missing; not deployed             |
| Cloudflare Pages (website) | 🔴     | `astro.config.mjs` ready; not deployed    |
| Chrome Web Store           | 🔴     | Build works; not submitted                |
| Firefox Add-ons            | 🔴     | `wxt zip -b firefox` ready; not submitted |

---

## Suggested Next Steps

1. **OAuth flow** — implement Flow G in `background.ts` (unblocks publish + all auth-gated features)
2. **Set Worker secrets** — register PoE OAuth app, generate JWT secrets, deploy API
3. **Wire PublishSheet** — call `useApi().publishList()` once API is live
4. **Website API integration** — replace `data/builds.ts` fixtures with live `GET /lists/:slug`
5. **Add /catalog page** — Astro page with game/league filters, mirrors TrendingTab
6. **Complete Flow D** — wire FAB "View →" button to `GET /build-links/lookup`; add poe.ninja content script
7. **API tests** — at minimum, happy-path tests for each route
