# PoB Build Pricing Handoff

Last updated: 2026-05-09

## Goal

Add a `Price this build` flow on `pobb.in` build pages:

1. Inject a button near pobb.in's existing `Copy / Web / Open` controls.
2. Read the on-page Path of Building code from the visible `<textarea>`.
3. Decode the PoB code to XML with `@max-arias/pob-codec`.
4. Parse build items/gems.
5. Show a page overlay modal where the user can choose item sets, skill groups, item inclusion, filter toggles, league, and item-match percentage.
6. Create a new local shopping list draft.
7. Price generated trade links automatically using one inactive background trade tab.
8. Store captured median prices on draft items; keep unpriced items in the list.

## Product decisions made

- **Initial supported site:** `pobb.in` only.
- **Button location:** next to `Copy / Web / Open` controls near the pobb.in textarea.
- **PoB code source:** textarea only, no `/:id/raw` fallback for now.
- **Decode dependency:** `@max-arias/pob-codec`.
- **UI host:** page overlay modal, not sidepanel.
- **Scope:** gear, jewels, flasks, and gems.
- **Build variants:** user can choose item sets and skill groups.
- **Defaults:** active item set + enabled skill groups.
- **Trade matching:** follow `docs/POB_TRADE_LINK_RESEARCH.md` / wanitzek behavior as baseline.
- **Stat index:** bundled offline `stat-index.json` from `C:\Users\max\Downloads\stat-index.json`.
- **League:** app settings default, editable in modal.
- **Match percent:** editable in modal, default `85%`.
- **Filter toggles:** off means omit from generated query.
- **List behavior:** always create a new draft before pricing starts.
- **Deduping:** by generated query hash / URL.
- **Automation:** one reusable inactive trade tab.
- **Capture timing:** old poe.ninja POC pattern plus readiness:
  - update inactive tab URL
  - wait for tab `complete`, max ~30s
  - wait ~1s settle
  - wait for trade rows / empty / blocked state
  - capture once
- **Retry:** no retry in v1.
- **Price metric:** median from existing `TradeCapture.aggregates.median`.
- **No results:** keep item as unpriced.
- **Worker tab cleanup:** always close at end/failure/cancel.
- **PoE support:** PoE1 only.

## External package fix

The initial GitHub tarball install of `@max-arias/pob-codec` failed because the package's `files` field only included `dist`, but `dist/` was gitignored and absent from the GitHub tarball.

Fixed in `D:\dev\pob-codec`:

- Commit pushed: `08ff4d9`
- Change summary:
  - removed `dist/` from `.gitignore`
  - committed built `dist/` artifacts
  - changed CI/release `Check` steps to `vp run check`
  - scoped package `check`/`format`/`lint` scripts to source/config/docs so generated dist files are not formatted by `vp check`
- Validation in `pob-codec` passed:
  - `vp run check`
  - `vp test`
  - `vp pack`

Current extension dependency is pinned to GitHub commit `08ff4d9` in `apps/extension/package.json` / `pnpm-lock.yaml`.

## Files added/changed in this repo

### Added

- `apps/extension/public/stat-index.json`
  - bundled offline stat mapping
  - currently ~1.6 MB in built extension
- `apps/extension/src/types/pobPricing.ts`
  - pricing plan/job/filter/source types
- `apps/extension/src/pob/decode.ts`
  - wraps `@max-arias/pob-codec` `decodePob()`
- `apps/extension/src/pob/parseXml.ts`
  - parses decoded PoB XML into item sets, skill groups, raw item entries, gem entries
- `apps/extension/src/pob/itemText.ts`
  - parses PoB item text into rarity/name/base/implicits/explicits/defenses/corruption/kind
- `apps/extension/src/pob/trade/statIndex.ts`
  - loads bundled `stat-index.json`
- `apps/extension/src/pob/trade/buildUrl.ts`
  - stable stringify, query hash, trade URL builder
- `apps/extension/src/pob/trade/buildQuery.ts`
  - rough item/gem trade query construction and filter toggling
- `apps/extension/src/pob/pricingPlan.ts`
  - turns parsed PoB entries + selections into pricing plan items
- `docs/POB_TRADE_LINK_RESEARCH.md`
  - research notes for wanitzek PoB → trade link behavior

### Changed

- `apps/extension/wxt.config.ts`
  - exposes `stat-index.json` and icons as web-accessible resources on `pobb.in`, `maxroll.gg`, and PoE trade hosts
- `apps/extension/src/entrypoints/build.content.ts`
  - replaced simple FAB-only build script with pobb.in pricing button + modal
- `apps/extension/src/entrypoints/background.ts`
  - added `csPobPricingStart` handler
  - creates draft and pricing job
  - opens sidepanel immediately during user gesture
  - runs background pricing with one inactive trade tab
  - updates draft items with captures/status
  - resumes queued/running pricing jobs on background start
- `apps/extension/src/entrypoints/trade.content.ts`
  - added targeted `csTradeCaptureWhenReady` handler
  - suppresses normal capture broadcasts and visit-history writes for `#poe-sl-pricing` worker tabs
- `apps/extension/src/utils/messages.ts`
  - added typed pricing start and targeted trade capture messages
- `apps/extension/src/types/draft.ts`
  - extended draft items with `queryHash`, `pricingStatus`, `pricingError`, `source`
- `apps/extension/src/types/index.ts`
  - exports pricing types
- `apps/extension/src/types/storage.ts`
  - added `pricingJobs` storage key
- `apps/extension/src/components/mine/ItemRow.vue`
  - avoids showing `0 chaos` for empty captures
  - shows `Pricing…` / `Unpriced` status pills
- `apps/extension/package.json`, `pnpm-lock.yaml`
  - added `@max-arias/pob-codec` GitHub dependency

## Current behavior

On `https://pobb.in/FHoiVhtpPYwr`:

1. `Price this build` appears near the pobb.in action buttons.
2. Clicking it reads the textarea, decodes XML, loads bundled stat index, and opens the modal.
3. The modal shows item sets, skill groups, generated item searches, and filter toggles.
4. Clicking `Start pricing` sends `csPobPricingStart`.
5. Background opens the sidepanel immediately to satisfy Chrome's user-gesture requirement.
6. Background creates a new draft and pricing job, then prices items in an inactive trade tab.

## Bugs fixed during manual testing

### 1. `Failed to fetch` on opening modal

Console showed:

```txt
Denying load of chrome-extension://.../stat-index.json. Resources must be listed in web_accessible_resources
Denying load of chrome-extension://.../icons/icon48.png. Resources must be listed in web_accessible_resources
```

Cause: `stat-index.json` and icons were loaded from page/content context but not exposed to `pobb.in`.

Fix: `wxt.config.ts` now includes:

```ts
web_accessible_resources: [
  {
    resources: ["icons/*.png", "stat-index.json"],
    matches: [
      "https://www.pathofexile.com/*",
      "https://pathofexile.com/*",
      "https://pobb.in/*",
      "https://maxroll.gg/*",
    ],
  },
]
```

### 2. `sidePanel.open()` user gesture error on Start pricing

Console showed:

```txt
Error: `sidePanel.open()` may only be called in response to a user gesture.
```

Cause: content script sent a second `csOpenSidepanel` after async work, outside Chrome's user gesture window.

Fix:

- `background.ts` opens sidepanel immediately at the start of `csPobPricingStart`, before async draft/job creation.
- Removed the follow-up `csOpenSidepanel` call from `build.content.ts`.

## Validation commands run

From `D:\dev\poe-shopping-list`:

```bash
vp run ext:check
vp run ext:typecheck
vp run ext:build
```

All passed after the latest fixes.

Build output includes:

```txt
.output/chrome-mv3/stat-index.json 1.6 MB
```

## Known limitations / follow-up work

### Trade query accuracy is still rough

`buildQuery.ts` is a first pass, not a full wanitzek clone. Missing or incomplete behavior includes:

- pseudo stat summing
- multi-line stat matching
- local defense filters
- mirrored false handling
- category filters for many item classes
- special unique cases like `Foulborn`
- flask-specific magic search behavior
- cluster/jewel category nuance
- more exact gem variant/alt-quality handling

`docs/POB_TRADE_LINK_RESEARCH.md` should guide this work.

### MV3 job robustness is basic

There is a persisted job store and startup resume for queued/running jobs, but this is still a simple implementation. Areas to harden:

- global lock so multiple pricing jobs cannot run concurrently
- cancel/pause UI
- retry unpriced items
- better job progress display in sidepanel
- avoid duplicate resumed workers if background wakes more than once

### Modal UX is functional but not polished

Current modal is raw content-script DOM/CSS. Needs design polish:

- clearer item grouping by gear/gems/jewels/flasks
- better filter summaries
- progress view after `Start pricing`
- error display instead of `alert()`
- sticky footer/header for large builds

### `PathOfBuilding2` handling

Parser currently allows `<PathOfBuilding2>` if `Build@targetVersion` is PoE1-compatible. If this assumption is wrong for real PoE2 exports, adjust detection.

### Worker tab detection

Worker trade tab URLs append `#poe-sl-pricing`. `trade.content.ts` uses this to suppress visit history and capture-status broadcasts. If PoE trade strips/replaces hash behavior, use another marker mechanism.

## Important architecture notes

- Keep the service worker as the central hub. Do not send content script ↔ sidepanel messages directly.
- Do not use existing `spCaptureRead` for automated pricing. It targets the active tab. Background pricing must use targeted `sendMessage(..., workerTabId)`.
- Do not store empty `TradeCapture` objects for unpriced items unless UI is changed. Empty captures look like `0 chaos`; use `capture: null` + `pricingStatus: "unpriced"`.
- `stat-index.json` is loaded through `browser.runtime.getURL("/stat-index.json")`, so it must remain web-accessible for content scripts.

## Suggested next steps

1. Manual test `https://pobb.in/FHoiVhtpPYwr` after reloading the extension.
2. Watch background service-worker console during pricing.
3. Verify draft creation and item status updates in sidepanel.
4. Compare generated trade URLs against `https://poe.wanitzek.com/` for the same build.
5. Improve `buildQuery.ts` to close gaps from `docs/POB_TRADE_LINK_RESEARCH.md`.
6. Add a sidepanel job/progress UI and cancel button.
