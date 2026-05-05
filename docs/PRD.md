# PoE Shopping List — Product Requirements (MVP)

## Vision

A **local-only** browser extension for Path of Exile that lets players create, manage, and share shopping lists of trade searches. No account, no server, no API — everything lives in your browser.

## Personas

| Persona  | Description                                                                |
| -------- | -------------------------------------------------------------------------- |
| **Alex** | Follows build guides, wants to quickly set up trade searches each league   |
| **Sam**  | Creates build guides on pobb.in, wants to share a curated list of searches |

## Core Flows

### A. Create a draft list

1. Open side panel on any page
2. Tap "+ New List", enter a name and optional build URL
3. List is saved to `browser.storage.local`

### B. Save a trade search to a list

1. Navigate to `pathofexile.com/trade`
2. Run a search for an item
3. Tap "Save This Search" in the side panel
4. Item name auto-filled from search bar, price data captured
5. Item added to active draft list

### C. Export a list for sharing

1. Open a draft list, tap "More → Export list"
2. A compressed string is generated
3. Copy to clipboard and share (chat, forum, guide)

### D. Import a shared list

1. Tap "Import" or "More → Import list"
2. Paste the compressed string
3. List is recreated locally with new IDs and timestamps

### E. Build-site integration

1. Visit a pobb.in or maxroll.gg build guide
2. If a local draft matches the URL, a ribbon shows matching lists
3. If no match, a FAB button opens the side panel

## Features

| Feature                                      | Status | Notes                              |
| -------------------------------------------- | ------ | ---------------------------------- |
| Create draft list                            | ✅     | Name + build URL + creator         |
| Save search to list                          | ✅     | Auto-capture name + price          |
| Mark item complete                           | ✅     | Checkbox toggle                    |
| Edit item (name, URL, price refresh)         | ✅     | Edit sheet                         |
| Delete item / list                           | ✅     | With confirmation                  |
| Bulk unmark all                              | ✅     | Clears completed + captures        |
| Settings (game, league, theme, auto-capture) | ✅     | Persisted in browser.storage       |
| Export list as compressed string             | ✅     | lz-string, URI-safe                |
| Import list from compressed string           | ✅     | Zod-validated, new IDs             |
| Build-site FAB (pobb.in, maxroll.gg)         | ✅     | Matches local drafts by URL        |
| Trade page price capture                     | ✅     | DOM extraction, aggregates         |
| Divine rate display                          | ✅     | Fetched from poe.ninja API         |
| Chrome + Firefox                             | ✅     | WXT handles both from one codebase |

## Out of Scope (Future)

- OAuth / account system
- Server-side list publishing
- Trending / catalog browsing
- Following other users' lists
- Recent purchases tracking
- Website for browsing lists
