# Plan: Automatic Shopping List Generator (poe.ninja)

## Context

Users view poe.ninja character build pages to copy gear setups. Currently they must manually open each item's trade link, capture prices, and add to a draft one by one. This feature adds a "Generate Shopping List" button injected into poe.ninja that automates the entire flow: it fetches all items from poe.ninja's character API, shows a checkbox preview, then walks through each item by opening a background trade tab, capturing prices silently, and producing a completed draft.

---

## Decisions Made

- **Data source**: Call poe.ninja's character API directly (for preview item list)
- **Trade URL generation**: Use poe.ninja's own trade UI — DOM-automate clicking their "Search on Trade" button per item, read the trade URL directly from the `<a href>` in the resulting modal (the full `?q={json}` query is embedded in the link — no fetch interception needed)
- **Modal dismiss**: `document.querySelector('button[aria-label="Dismiss"]').click()` — the 1×1px React Aria dismiss button IS the real close trigger (`.click()` works despite tiny size; Escape key does NOT work)
- **Capture**: Fully automatic background tabs (no user clicks on trade pages)
- **UX**: Preview checklist → Start → progress view → done
- **Output**: New draft auto-named `{characterName} gear`
- **Items**: Everything (gear, gems, flasks, jewels)

---

## Implementation Order

### 1. Schema (`packages/schema/src/index.ts`)
Add:
```ts
NinjaItemSchema       // raw item from poe.ninja character API
NinjaCharacterSchema  // full character response
```
New message types in `ExtMsg`:
- `generate:preview-ready` — ninja content → sidepanel
- `generate:start` — sidepanel → background
- `generate:progress` — background → sidepanel
- `generate:done` — background → sidepanel
- `generate:cancel` — sidepanel → background

### 2. Message Protocol (`apps/extension/src/utils/messages.ts`)
Add to `ProtocolMap`:
- `autoCaptureRead: () => TradeCapture | null` — auto-capture without user click
- `generate:preview-ready` — ninja content → sidepanel (item list for checklist)
- `generate:start` — sidepanel → background (returns `draftId`)
- `generate:progress` — ninja content → sidepanel (currentIndex, total, currentItemName)
- `generate:open-trade-tab` — ninja content → background (tradeUrl → returns `TradeCapture | null`)
- `generate:append-item` — ninja content → background (persist item + capture to draft)
- `generate:done` — ninja content → sidepanel
- `generate:cancel` — sidepanel → background (sets cancel flag, also signals ninja content)

### 3. ~~Page-World Interceptor~~ — NOT NEEDED
poe.ninja embeds the complete trade URL (with full `?q={json}` query including poe.ninja's mod selection) directly in an `<a href>` inside the modal. We read it from the DOM — no fetch interception, no `window.open` suppression required.

**POC-confirmed selectors and behavior:**
- Trade link: `a[href*="pathofexile.com/trade"][target="_blank"]` — watch document-wide with MutationObserver; backdrop renders before modal content, so the `<a>` may appear slightly after
- After capturing URL: `document.querySelector('button[aria-label="Dismiss"]').click()` → modal unmounts (Escape key does NOT work on this React Aria modal)
- Wait for the `<a>` element to leave the DOM (`el.isConnected === false`) before clicking the next item — otherwise `waitForElement` resolves immediately with the stale element
- Trade URL format: `?q={json}` → trade site redirects to `/trade/search/{league}/{searchId}` (normal, doesn't affect capture)

**Slot → grid-area mapping confirmed (31 buttons total):**
- `Ring`, `Ring2`, `Ring3` — separate grid areas (3 rings on this build)
- `BodyArmour`, `Helm`, `Gloves`, `Boots`, `Belt`, `Amulet`, `Weapon`, `Offhand` — single areas
- `Flasks` — all 5 flasks share one grid area; distinguish by DOM order within parent
- Buttons 16–30 (15 buttons, `grid-area="unknown"`) — gems/jewels; no grid-area parent, different DOM structure — **not yet handled**

**Background tab loop confirmed working:**
- `browser.tabs.create({ url, active: false })` + `tabs.onUpdated` wait + 2.5s delay + `autoCaptureRead` + `tabs.remove` works end-to-end for all 16 slots sequentially
- WXT messaging requires `{ type, timestamp: Date.now() }` — raw `{ type }` alone is rejected with "Unknown message format"
- `autoCaptureRead` returns no capture data for dead leagues (expected); needs a live league to validate prices

### 4. `trade.content.ts` — add autoCaptureRead handler
```ts
onMessage("autoCaptureRead", () => buildCapture(document, window.location.href));
```

### 5. Generator Pinia Store (`apps/extension/src/stores/generator.ts`) — NEW FILE
Holds reactive state for the entire generator flow:
```ts
type GeneratorPhase = "idle" | "loading" | "preview" | "running" | "done" | "error"
```
State: `phase`, `previewItems`, `capturedItems`, `currentIndex`, `total`, `currentItemName`, `pendingDraftName`, `pendingLeague`, `pendingGame`, `pendingBuildUrl`, `doneDraftId`.

### 6. UI Store (`apps/extension/src/stores/ui.ts`)
Extend `PanelView`:
```ts
| { type: "generator-preview" }
| { type: "generator-running" }
| { type: "generator-done"; draftId: string }
```
Add `openGeneratorPreview()`, `openGeneratorRunning()`, `openGeneratorDone(draftId)` actions.

### 7. Background (`apps/extension/src/entrypoints/background.ts`)
Add to `isSidePanelUrl`: poe.ninja character build URL pattern.

**Role shift**: Background is now a "capture helper" — the ninja content script drives the item loop; background only handles tab creation + capture on demand.

Add message listeners:
- `generate:start` → `bg_createDraft()` → sends `draftId` back; sets `activeGeneration = { cancel: false }`
- `generate:cancel` → `activeGeneration.cancel = true`
- `generate:open-trade-tab` → opens background tab, waits for capture, closes tab, returns `TradeCapture | null`
- `generate:append-item` → writes item + capture to draft in storage

**`generate:open-trade-tab` handler:**
```
async (payload: { tradeUrl: string }) => {
  const tab = await browser.tabs.create({ url: payload.tradeUrl, active: false })
  await waitForTabComplete(tab.id)   // onUpdated listener, 30s timeout
  await delay(2000)                  // trade XHR settle time
  const capture = await sendMessage("autoCaptureRead", tab.id).catch(() => null)
  await browser.tabs.remove(tab.id).catch(() => {})
  return capture
}
```

**Storage helpers** (direct reads/writes — no composable):
- `bg_createDraft(name, league, game, buildUrl): Draft`
- `bg_appendItem(draftId, itemId, name, tradeUrl, kind, capture): void`

`waitForTabComplete`:
```ts
function waitForTabComplete(tabId, timeoutMs = 30_000): Promise<void> {
  return new Promise(resolve => {
    const timer = setTimeout(resolve, timeoutMs);
    const listener = (_id, info) => {
      if (_id === tabId && info.status === "complete") {
        clearTimeout(timer);
        browser.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    browser.tabs.onUpdated.addListener(listener);
  });
}
```

### 8. `useShoppingGenerator` Composable (`apps/extension/src/composables/useShoppingGenerator.ts`) — NEW FILE
Mounted once in `App.vue`. Registers message listeners:
- `generate:preview-ready` → `generatorStore.setPreview(items)` + `ui.openGeneratorPreview()`
- `generate:progress` → `generatorStore.updateProgress(...)`
- `generate:done` → `ui.openGeneratorDone(draftId)`

Exposes `startGeneration(selectedItems)` which sends `generate:start` to background + calls `ui.openGeneratorRunning()`.

### 9. Vue Generator Components (`apps/extension/src/components/generator/`) — NEW DIR

**`GeneratorPreviewView.vue`**
- Lists all items with checkboxes (checked by default), grouped: Gear / Gems / Flasks / Jewels
- "Select all / None" toggle
- CTA: `Start (N items)` — reactive to checkbox count
- Cancel → `ui.openTabs()`

**`GeneratorProgressView.vue`**
- Progress bar: `currentIndex / total`
- Current item name
- List of already-captured items appearing as they complete
- Cancel button → `sendMessage("generate:cancel")`

**`GeneratorDoneView.vue`**
- Success message + item count
- "View Draft" → `ui.openDetail("mine", draftId)`

### 10. `App.vue` Wiring
Add generator views to routing block (same level as `<DetailPanel>`):
```vue
<GeneratorPreviewView v-else-if="ui.currentView.type === 'generator-preview'" />
<GeneratorProgressView v-else-if="ui.currentView.type === 'generator-running'" />
<GeneratorDoneView v-else-if="ui.currentView.type === 'generator-done'" />
```
Mount `useShoppingGenerator()` in `<script setup>`.

### 11. Ninja Content Script (`apps/extension/src/entrypoints/ninja.content.ts`) — NEW FILE
**Match**: `https://poe.ninja/*` — validate at runtime that path matches `/*/builds/*/character/*/*`.

**URL parsing:**
```ts
const parts = location.pathname.split("/").filter(Boolean);
// ["poe1", "builds", "Mirage", "character", "Account-123", "CharName"]
const game = parts[0];     // "poe1" | "poe2"
const league = parts[2];
const account = parts[4];
const charName = parts[5];
const timeMachine = new URL(location.href).searchParams.get("timemachine") ?? "";
```

**Two-step API fetch (for preview list):**
```ts
// 1. Get build index ID
const idx = await fetch(`/${game}/api/data/index-state`).then(r => r.json());
const buildId = idx.buildId; // verify field name in actual response

// 2. Fetch character items
const char = await fetch(
  `/${game}/api/builds/${buildId}/character?account=${account}&name=${charName}&overview=${league}&type=0&timeMachine=${timeMachine}`
).then(r => r.json());
```

**Interceptor injection (on script load, before button click):**
```ts
// Inject page-world script so fetch/window.open are wrapped before user clicks
const script = document.createElement('script');
script.textContent = NINJA_TRADE_INTERCEPTOR_CODE; // from ninjaTradeInterceptor.ts
document.documentElement.prepend(script);
script.remove();

// Listen for captured trade search IDs
window.addEventListener('message', (e) => {
  if (e.data?.type === '__poe_sl_trade_id') {
    pendingTradeResolve?.(e.data.searchId);
  }
});
```

**Button injection:**
- Wait for SPA render: `setTimeout` + retry until character item grid exists in DOM
- Inject `<button>` using `fab.ts` pattern (fixed-position ribbon)
- On click:
  1. Fetch character item data (API calls above)
  2. Open sidepanel: `chrome.runtime.sendMessage({ type: "openSidePanel" })`
  3. `sendMessage("generate:preview-ready", { items, draftName, league, game, buildUrl })`

**`generate:start` message handler (received from sidepanel):**
The content script drives the item loop (it must stay on the poe.ninja page throughout):

```
1. draftId = await sendMessage("generate:start", { draftName, league, game, buildUrl })
2. for each selected item at index i:
   a. if activeGeneration.cancel: break
   b. sendMessage("generate:progress", { currentIndex: i, total, currentItemName: item.name })

   // DOM automation: click poe.ninja's trade button for this item
   c. itemEl = findItemElementByIndex(i)  // by DOM order matching our items array
   d. tradeBtn = itemEl.querySelector('button[aria-label="Search on Trade"]')
   e. tradeBtn.click()

   // Wait for modal, then click its confirm/search button
   f. modalConfirmBtn = await waitForElement('button[aria-label="Search"]', 5000)
      // fallback: button containing text "Search on Trade" or similar — verify during impl
   g. modalConfirmBtn.click()

   // Wait for our fetch interceptor to capture the searchId
   h. searchId = await new Promise(resolve => { pendingTradeResolve = resolve; })
      // with 10s timeout fallback
   i. tradeUrl = `https://www.pathofexile.com/trade/search/${league}/${searchId}`

   // Background opens tab, captures, closes
   k. capture = await sendMessage("generate:open-trade-tab", { tradeUrl })

   // Persist
   l. await sendMessage("generate:append-item", { draftId, item, capture })

3. sendMessage("generate:done", { draftId })
```

**`findItemElementByIndex`:** Queries all `button[aria-label="Search on Trade"]` elements in DOM order. The index `i` into our items array should correspond to the same DOM order as poe.ninja renders them. This mapping needs to be validated — DOM order vs character API `items[]` order may not align perfectly. Fallback: match by item name using a tooltip or data attribute on the container.

---

## Critical Files

| File | Action |
|------|--------|
| `packages/schema/src/index.ts` | Modify — add Ninja schemas + message types |
| `apps/extension/src/utils/messages.ts` | Modify — add `autoCaptureRead` + generate messages |
| ~~`apps/extension/src/utils/ninjaTradeInterceptor.ts`~~ | ~~Not needed~~ — URL is in modal `<a href>` |
| `apps/extension/src/entrypoints/trade.content.ts` | Modify — add `autoCaptureRead` handler |
| `apps/extension/src/stores/generator.ts` | **New** |
| `apps/extension/src/stores/ui.ts` | Modify — add 3 generator PanelView types |
| `apps/extension/src/entrypoints/background.ts` | Modify — capture helper (open-trade-tab, append-item, create-draft) |
| `apps/extension/src/composables/useShoppingGenerator.ts` | **New** |
| `apps/extension/src/components/generator/GeneratorPreviewView.vue` | **New** |
| `apps/extension/src/components/generator/GeneratorProgressView.vue` | **New** |
| `apps/extension/src/components/generator/GeneratorDoneView.vue` | **New** |
| `apps/extension/src/entrypoints/App.vue` | Modify — routing + mount composable |
| `apps/extension/src/entrypoints/ninja.content.ts` | **New** — drives item loop + DOM automation |

---

## Verification

1. **Interceptor smoke test**: On a poe.ninja character page (extension loaded), open devtools console, manually click one item's magnifying glass, confirm modal, check for `window.postMessage` event with `__poe_sl_trade_id` in the console
2. **window.open suppressed**: After clicking Search in poe.ninja's modal, confirm no new tab opens
3. **autoCaptureRead message**: Open a trade page → devtools background console → `chrome.tabs.sendMessage(id, {type:"autoCaptureRead"})` → should return `TradeCapture`
4. **URL parsing**: On poe.ninja character page → content script console → verify `{ game, league, account, charName }` parsed correctly
5. **API fetch**: Click "Generate Shopping List" → network tab → verify two poe.ninja API calls succeed, preview panel shows item list
6. **DOM automation**: Trigger Start for 1 item → devtools → confirm correct button clicked, searchId captured, background tab opens/closes
7. **E2E**: Select 3-5 items in preview → Start → watch progress → verify draft in "Mine" tab with prices
8. **Cancel**: Click Cancel mid-run → verify no more tabs open, partial draft preserved
9. **Graceful degradation**: Item with no trade button (e.g. a gem slot) → skip gracefully, `capture: null` in draft

---

## Open Questions for Implementation

- **`buildId` field name**: Verify actual field name in `/poe1/api/data/index-state` — may be `buildId`, `id`, `snapshotId`, etc.
- **DOM order vs API item order**: The POC uses slot `grid-area` style to identify items; the real implementation should match API `inventoryId` to DOM `grid-area` rather than relying on index order. Flasks (all share `Flasks` area) need index-within-slot disambiguation.
- **Gems/jewels (buttons 16–30)**: 15 trade buttons with no `grid-area` parent — their DOM structure is unknown. Investigate separately; may live in a skills/gem grid section below the equipment grid.
- **`autoCaptureRead` on live league**: Confirmed message routing works; need a live league to verify price capture returns data
- **2500ms delay**: Used in POC and works; may tune down for production if trade results load faster

## POC Status

File: `apps/extension/src/entrypoints/ninja-poc.content.ts`

**Confirmed working:**
- ✅ 31 trade buttons found and classified by `grid-area` slot
- ✅ Modal opens on programmatic click, trade URL extracted from `<a href>`
- ✅ Modal dismissed via Escape key; `waitForElementRemoved` gates the next iteration
- ✅ 16 gear-slot URLs collected sequentially
- ✅ Background tab loop: open → waitForComplete → 2.5s delay → autoCaptureRead → close
- ✅ Trade URL `?q=` redirects to cached search ID (normal trade site behavior)
- ✅ All 16 slots processed end-to-end without errors

**Remaining:**
- ⬜ Fix `autoCaptureRead` message format (add `timestamp` field) — done in background.ts, not yet verified
- ⬜ Test capture on a live league to confirm prices are returned
- ⬜ Investigate gems/jewels DOM structure (buttons 16–30)
