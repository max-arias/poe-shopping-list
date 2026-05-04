# PoE Shopping List — Implementation Status

Last updated: 2026-05-04

## Legend

- ✅ Done — complete and working
- 🔶 Partial — code exists, but incomplete or blocked
- 🔴 Todo — not started or fully stubbed
- ❌ Removed — stripped for local-only MVP

---

## Architecture Change (2026-05-04)

The project has been simplified to a **local-only extension MVP**. The API, website, and OAuth have been removed. Lists are shared via compressed text strings (import/export).

### Removed

| Component | Status | Notes |
|-----------|--------|-------|
| `apps/api` | ❌ | Cloudflare Worker + D1 — removed |
| `apps/website` | ❌ | Astro site — removed |
| `packages/schema` | ❌ | Inlined into `apps/extension/src/types/` |
| `packages/trade-dom` | ❌ | Inlined into `apps/extension/src/trade-dom/` |
| `packages/tokens` | ❌ | Inlined into `apps/extension/src/styles/tokens.css` |
| `infra/` | ❌ | D1 migrations — removed |
| OAuth flow | ❌ | Removed |
| Trending tab | ❌ | Removed |
| Following tab | ❌ | Removed |
| Recent purchases | ❌ | Removed |
| Publish sheet | ❌ | Removed |
| `ninja-poc.content.ts` | ❌ | POC removed |

---

## Extension (`apps/extension`)

### Infrastructure

| Item | Status | Notes |
|------|--------|-------|
| Side panel opens on icon click | ✅ | `setPanelBehavior` + enabled/disabled per tab |
| Panel only on trade/build pages | ✅ | `tabs.onActivated` + `tabs.onUpdated` |
| Content script (trade page) | ✅ | Price capture relay, search bar text |
| Content script (build guide pages) | ✅ | pobb.in + maxroll.gg FAB injection |
| Background `open-sidepanel` msg | ✅ | Content scripts can request panel open |
| Design tokens (light/dark) | ✅ | Tailwind v4 `@theme inline` + `data-theme` |

### Features

| Feature | Status | Notes |
|---------|--------|-------|
| Create draft list | ✅ | Name + build URL + creator |
| Save search as item | ✅ | SaveModal, price capture |
| Mark item complete | ✅ | Toggle in ItemRow |
| Delete item / list | ✅ | KebabMenu + confirmation |
| Bulk unmark all items | ✅ | "More → Unmark all" |
| Settings (theme, league, auto-capture) | ✅ | SettingsPopover |
| Link build URL to draft | ✅ | "More → Link build URL" |
| Auto-open draft on build page | ✅ | App.vue checks URL on load |
| Capture unavailable banner | ✅ | Shows when DOM selectors fail |
| FAB / ribbon on build pages | ✅ | pobb.in + maxroll.gg |
| **Export list** | ✅ | lz-string compressed, URI-safe string |
| **Import list** | ✅ | Paste string, Zod-validated, new IDs |
| Divine rate display | ✅ | Fetched from poe.ninja |

---

## Tests

| Area | Status | Notes |
|------|--------|-------|
| `trade-dom` (inlined) | 🔴 | Tests need to be re-added for inlined version |
| `apps/extension` | 🔴 | No tests yet |
| `apps/e2e` | 🔴 | Playwright setup exists, needs updating |

---

## Deployment

| Target | Status | Notes |
|--------|--------|-------|
| Chrome Web Store | 🔴 | Build works; not submitted |
| Firefox Add-ons | 🔴 | `wxt zip -b firefox` ready; not submitted |