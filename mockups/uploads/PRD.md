# PRD — PoE Shopping List

Companion to [README.md](README.md) and [ARCHITECTURE.md](ARCHITECTURE.md). This doc covers the product side: who uses it, what they do, what "done" means per feature, and what is explicitly out of scope.

---

## Goals

1. Let anyone create a named collection of trade search queries for a build and publish it so followers don't have to set up those searches from scratch every league.
2. Capture the prices the user is already looking at in their trade tab with a single click per item, without any backend crawling.
3. Publish that list under an immutable, shareable slug with a running total and per-item "captured at" timestamps.
4. From any major build-guide page (pobb.in, maxroll.gg, poe.ninja), get the user to a matching published list in one click.

## Non-goals

- User accounts / login / profiles
- Edits after publish (changes = publish a new list)
- Whisper generation, auto-trading, bots, anything that mutates PoE trade state
- Server-side price crawling or scheduled re-pricing
- Cross-league or cross-currency price conversion in v1 (prices render in whatever currency the user captured)
- Mobile app
- PoE2 content-script integrations in v1 (schema supports PoE2; UI/content-scripts ship PoE1 first)
- **PoB code parsing or import** — lists are created by manually saving trade searches; no PoB decoding
- Firefox — **supported in v1** via WXT's built-in multi-browser build (`wxt -b firefox`)
- Regional / non-English trade sites in v1 (poe.game.daum.net, etc.; architecture must not break them either)
- XBOX / console trade platform (PC pathofexile.com only)
- Auto-fuzzy search injection (user controls search modifiers themselves)
- Cloud sync of drafts or follows in v1 (no accounts; local `browser.storage.local` only)

---

## Competitive Intelligence — Lessons from Better PoE Trading

Analysis of ~60 public Chrome Web Store reviews for the leading competitor extension, grouped by theme. Each item notes whether we already address it, must address it, or explicitly defer it.

### 1. Reliability: content scripts silently break after game patches

Multiple 1–3★ reviews spanning 2023–2025 report the extension simply stops working after PoE patches (league launches, site updates). Users have no feedback — it just disappears.

**Reviews:** Nizar NK (1★ Jun 2025), Steijn (1★ Jun 2025), Shane Phelan (3★ Mar 2025), Davy Heutmekers (2★ Feb 2025), Blank (2★ Feb 2025), wodzefag (1★ Aug 2025), Paulo Neto (3★ Jan 2023), Nadragh (2★ Aug 2023).

**Action:** F5 acceptance criteria must include a visible "capture unavailable" fallback when selectors fail to match. DOM selectors should live in a versioned config object (`trade-dom/selectors.ts`) so they can be updated without touching logic. Add a health-check fixture that runs in CI against the current trade site snapshot.

### 2. URL matching: www vs bare domain

Extension activates only when the user navigates from the official PoE homepage. Typing `pathofexile.com/trade` directly doesn't work; `www.pathofexile.com/trade` does.

**Review:** GigaVoltage (4★ Mar 2025) — eventually self-solved but lost a star over it.

**Action:** `manifest.json` `content_scripts.matches` must include both `https://www.pathofexile.com/trade/*` and `https://pathofexile.com/trade/*`. Cover both in the smoke-test matrix.

### 3. Firefox support

Seven reviews (1★ to 5★) explicitly request Firefox. Sentiment runs from mild preference to angry 1★ protest. The existing extension dropped Firefox support and directed users to an unofficial mirror — a major trust issue.

**Reviews:** Chris Sabella (1★ Dec 2025), Lulu Rainsong (1★ Dec 2020), Shaun yb (4★ Aug 2024), Tall Timbers (5★ Aug 2024), legion legion (5★ Aug 2024), IceLancer SR (4★ Jul 2024), Alexander Niemczyk (4★ Jun 2025).

**Action:** See Open Question 8.

### 4. Import/export reliability

Import flow silently fails for some users: paste code → folder appears → save → nothing happens.

**Reviews:** Andy Yiu (2★ Apr 2025), Nice Dick (1★ Aug 2023).

**Action:** F6 acceptance must include: import validates JSON structure and shows a specific error on malformed input; on save, the stored value is verified by reading it back before closing the modal; success/failure is always surfaced to the user.

### 5. Performance: CPU/memory spikes

Two reviews report 100% CPU usage and "out of memory" crashes in Chrome the moment the extension is enabled. The root cause is unknown but likely an unthrottled polling loop or a large DOM observer.

**Reviews:** leo rio (2★ Feb 2022), Manni (5★ Sep 2022).

**Action:** F5 implementation must use a single `MutationObserver` scoped to the results container — no `setInterval` polling. Profile with Chrome DevTools before shipping. Memory budget: extension content script idle overhead ≤ 5 MB.

### 6. Bulk list operations

Users want to "reset" a list for a new league (unmark all items at once) and delete folders outright instead of just renaming.

**Reviews:** Francisco Aceves (5★ Dec 2023) — "unmark all for league restarts"; Harshit (4★ Jul 2025) — "option to delete folders, not just rename".

**Action:** Add F13 (Bulk reset) and F14 (Delete draft) to Feature Spec below.

### 7. International trade sites

Korean trade site (`poe.game.daum.net`) and non-English users get no benefit. Extension URL matching excludes them entirely.

**Reviews:** kim xandarous (5★ Jul 2025), SoaT (4★ Jun 2025), Roman Ryzhkov (2★ Jan 2024), Pro Gamer (4★ Oct 2021), Пей Чай (1★ Aug 2022 — XBOX platform).

**Action:** Defer to post-v1 per Non-goals. Architecture note: avoid hardcoding `pathofexile.com` as a string constant; centralize the allowed-origins list so regional sites can be added with a config change.

### 8. Trust / perceived security risk

One review attributes an account lockout to installing the extension (likely coincidental). The competitor offers no privacy policy or explanation of what data is read, which feeds FUD.

**Review:** Nev Z (1★ Mar 2020).

**Action:** Publish a one-page privacy policy (`/privacy`) before launch. Popup footer links it. Policy states: extension reads trade page DOM only; no credentials, no account data, no external requests except to our own Worker on publish.

### 9. Onboarding / discoverability

First-time users don't understand what the extension does or how to start. The pin, sidebar, and bookmark features are invisible until stumbled upon.

**Reviews:** Артём Клименко (1★ Aug 2022), Omer O (5★ Dec 2020), Mad Man Moose (3★ Jan 2025) — sidebar "doesn't even load".

**Action:** Popup shows a "Get started" guide (3 steps, collapsible) until the user's first item is captured. See Open Question 9.

### 10. Positive signal worth preserving

High-rated reviews consistently cite: import/export sharing, bookmark organization, closing tabs, and the sidebar workflow. Cy Cza (5★ May 2024) gave a 500-word detailed review praising the folder/build model. These are the core differentiators — protect them in all redesigns.

## Success Metrics

- **Weekly published lists** — primary growth signal
- **% of published lists with ≥1 priced item** — quality of publish flow; low = extension friction
- **Extension installs**
- **Injected-button click-through rate** on build-guide pages — how well the cross-site bridge works
- **Median items per list** — are people pricing whole builds or abandoning mid-way

---

## Personas

| Persona            | Context                                                                               | Primary flow                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **List Creator**   | Knows a build well, wants to share a ready-to-use set of trade searches with others   | New list → save searches from trade site → optionally link build guide URL → publish → share slug    |
| **Follower**       | Reading a build guide, wants to load searches for that build without configuring them | Click injected button on build-guide page → view list → follow it → searches appear in trade sidebar |
| **Private trader** | Curating searches for their own build, never publishes                                | New list → save searches → uses draft locally forever, never hits Publish                            |

All three personas use flows A–B. Only List Creator uses C (publish). Only Follower uses D (cross-site) and E (browse). All can use F (follow).

---

## User Flows

### Flow A — Create List

1. User opens extension popup (or clicks "New List" in the trade sidebar).
2. User enters a list name and confirms.
3. An empty draft list is created and becomes the active list.
4. User is prompted to go to the trade site and save searches.

**Acceptance criteria**

- Name is required (1–80 chars); blank submit shows inline validation
- Creating a list when a draft already exists prompts to save or discard the existing draft first
- New draft persists in `browser.storage.local` across popup close and browser restart

### Flow B — Save a Search

1. User navigates to `pathofexile.com/trade` (sidebar auto-injects).
2. A fixed right-side sidebar shows: their active draft list, and their followed lists.
3. User configures and runs a trade search; results appear.
4. User clicks **Save This Search** (gold button at the sidebar bottom).
5. A **"Save Search"** modal opens. The name field is pre-populated from the trade search bar text. User edits if needed and clicks **Save**.
6. On save, the content script optionally reads all visible result rows and computes price statistics (min, median, avg, sample size, dominant currency) alongside the current trade URL.
7. The item (name + trade URL + optional price capture) is sent to the background and added to the active draft list.
8. The sidebar updates immediately, showing the newly saved item.

The user can re-run **Refresh price** from the item's `···` menu at any time to update the price data with the current page's results.

**Acceptance criteria**

- Sidebar is visible on all `pathofexile.com/trade/*` pages (both `www.` and bare domain) without disrupting the trade page layout
- "Save Search" modal name auto-fills from the trade search bar; user can override
- `sample_size` matches the number of price-bearing rows visible at the time of save
- If results include a non-chaos/divine currency, it is recorded faithfully (no conversion)
- `captured_at` is set to the moment the user clicks Save
- "Refresh price" overwrites the price data on an existing item without creating a duplicate
- The trade URL stored is the full current `window.location.href`

### Flow F — Follow a List

1. User finds a list — via the website catalog, via the injected button on a build-guide page, or via a shared URL.
2. User clicks **Follow** (on the website: a CTA that deep-links to the extension or directs to install; on the injected button: a secondary action).
3. The extension stores the list slug + title + league in `browser.storage.local` under `followed:v1`.
4. The followed list immediately appears in the "Following" section of the trade site sidebar.
5. Clicking any item in the followed list opens that item's trade URL in the current tab.
6. User can unfollow from the sidebar `···` menu or from the popup's "Following" tab.

**Acceptance criteria**

- Follow is instant — no network call needed (slug + metadata stored locally)
- Followed lists survive browser restart
- Unfollow removes the list from sidebar immediately without a page reload
- Maximum followed lists: 50 (soft cap with a warning at 45)
- Followed list items are fetched from `GET /lists/:slug` on first sidebar load; cached locally; refreshable via `···` → "Refresh list"

### Flow C — Publish

1. User opens the popup's draft view, reviews items + captured prices.
2. User enters a title and selects the league.
3. User clicks Publish. Turnstile challenge fires.
4. Extension POSTs the draft to `POST /lists`. Worker validates + inserts. Returns a slug.
5. Popup shows the share URL `https://<website>/lists/<slug>` and a "Copy" button.

**Acceptance criteria**

- Draft with zero priced items can still publish (unpriced items render as "no price yet")
- On publish, the local draft is cleared to a fresh empty draft
- Slug is URL-safe, short (8–10 chars), and collision-checked at insert
- Turnstile failure → clear error, draft preserved

### Flow D — Cross-site button

1. User is on a pobb.in / maxroll.gg / poe.ninja / poedb.tw page.
2. Content script reads a stable page identifier (pobb.in slug, maxroll guide slug, poe.ninja character URL, poedb item name).
3. Content script calls `GET /build-links/lookup?site=<site>&key=<key>`.
4. If ≥ 1 matching list exists, inject a "View shopping list" button. If > 1, open a small chooser.
5. Click → navigate to the matching list page on the website.

**Acceptance criteria**

- Button appears only when a match exists (no dead buttons)
- Lookup latency ≤ 200ms p50
- Injecting the button does not break the host page's layout on the current schema of each site

### Flow E — Browse catalog

1. User visits the website's `/catalog` page.
2. Filters: game (poe1/poe2), league, ascendancy, text query on title.
3. Each catalog card shows: title, game, league, ascendancy, item count, total estimate, freshest `captured_at`.
4. Click a card → `/lists/:slug` page renders the full list (items grouped by kind, prices + captured-at per item, total + overall freshness).

**Acceptance criteria**

- Catalog loads in ≤ 500ms for the initial page (top 30 by recency)
- Filters narrow without a full page reload
- List page is pre-rendered where possible (Astro SSG for `/lists/:slug`, revalidated on demand)

---

## Feature Spec

| #   | Feature                | Acceptance                                                                                                                                                                                                 |
| --- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F5  | DOM price capture      | Selectors + aggregate math in `packages/trade-dom`, unit-tested against three layout-variant fixtures; capture triggered by "Save This Search" modal save, not per-row interaction                         |
| F6  | Draft storage          | `browser.storage.local` via `@wxt-dev/storage`, per-browser, survives popup close and browser restart                                                                                                      |
| F7  | Publish (immutable)    | POST validates payload, inserts atomically, returns slug; no `PATCH` / `DELETE`                                                                                                                            |
| F8  | List page              | Renders items grouped by kind; per-item price + currency + captured-at; total when all currencies match                                                                                                    |
| F9  | Catalog                | Filters by game/league/ascendancy/text; server-side paginated                                                                                                                                              |
| F10 | Build-link lookup      | `GET /build-links/lookup?site=&key=` → array of matching lists, newest first                                                                                                                               |
| F11 | Injected buttons       | pobb.in, maxroll.gg, poe.ninja, poedb.tw; do not break host layout; hidden when no match                                                                                                                   |
| F12 | Spam control           | Turnstile on publish; IP rate limit at the Worker edge                                                                                                                                                     |
| F13 | Bulk reset draft       | "Unmark all" action on a draft clears all captured prices and completion flags in one click; confirmation required; undo not supported                                                                     |
| F14 | Delete draft / folder  | User can delete a draft entirely (not just rename); confirmation dialog shows item count; deletion is immediate and non-recoverable                                                                        |
| F15 | Selector versioning    | Trade DOM selectors isolated in `packages/trade-dom/selectors.ts`; when selectors fail to match, sidebar shows a "trade capture unavailable — check for updates" banner rather than silently doing nothing |
| F16 | Privacy policy page    | Static `/privacy` page on the website; linked from extension popup footer; covers data read (DOM only), data stored (local + our Worker), no credentials accessed                                          |
| F17 | Follow / Unfollow list | Slug + metadata stored in `browser.storage.local`; followed lists appear in trade sidebar; unfollow from sidebar or popup; max 50 followed; items fetched from API on first load and cached locally        |

---

## Open Product Questions

1. **Build-link matching on poedb.tw** — poedb is an item/base reference, not a build host. "List for this build" doesn't apply directly. Two options: (a) skip poedb.tw for v1, (b) reinterpret as "lists containing this item" — more of a reverse lookup. Decision deferred until the other three integrations are live.
2. **Build-link author declaration** — for pobb.in and maxroll, the automatic page-identifier match is straightforward. For poe.ninja character pages, lists should probably be linked by the author explicitly ("this list is for character X") rather than matched automatically, since characters change daily.
3. **Cross-device drafts** — without accounts, drafts don't sync across devices. Is that acceptable for v1? (Current plan: yes.)
4. **Unpriced-item UX on shared lists** — followers land on a list where half the items have no price yet. Render a "no price captured" pill, or hide unpriced items, or offer a "contribute a price" flow? (Contribute implies edits → contradicts immutability. A separate "price contribution" table is a v2 idea.)
5. **Currency diversity within a list** — most items priced in chaos/divine, but some picks may be alt / fusings / vaal orb currencies. List total is shown only when all items agree on currency; otherwise show per-currency subtotals. Confirm this is the desired behavior.
6. **PoE2 timeline** — PoE1 v1 first; PoE2 rolls out when the trade2 DOM stabilizes and PoE2 build hosts settle.
7. **Spam / abuse without accounts** — Turnstile + IP rate-limit is the v1 answer. Takedown flow (list-level report + manual Worker-admin delete) is unspecified; revisit once there is real traffic.
8. **Firefox support** — WXT natively supports both Chrome and Firefox from a single codebase. `wxt -b chrome` / `wxt -b firefox` produce separate artifacts; WXT automatically emits MV3 for Chrome and MV2 for Firefox (Firefox's MV3 is still partial). The `@wxt-dev/browser` package provides a unified promise-based `browser.*` wrapper that abstracts the `chrome.*` vs `browser.*` namespace difference. Background entrypoints are written once; WXT outputs a service worker for Chrome and a background script for Firefox. **Decision: ship Chrome + Firefox simultaneously from day one** — the cost is near-zero with WXT and the competitor's Firefox abandonment is a major acquisition opportunity.
9. **Onboarding UX** — Competitor reviews show users can't find the sidebar or understand the capture flow. We should design the empty state (no items yet) to actively guide the user through their first capture rather than showing a blank panel. Scope: in-popup and in-sidebar first-use prompt, collapsible after first item saved.
10. **Import validation UX** — Competitor has a silent import failure (modal closes, nothing saved). Our import must explicitly confirm success ("3 items imported") or surface an error with enough detail for the user to self-diagnose (bad JSON / wrong schema version / duplicate slug).
