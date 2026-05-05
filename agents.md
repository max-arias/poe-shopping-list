# Agent Instructions — PoE Shopping List

## Communication Between Extension Surfaces

The service worker (background) is the **central hub** — content scripts and sidepanel never communicate directly. This avoids lifecycle mismatches (content scripts die on navigation, sidepanel may be closed).

```
Content Script  ←──→  Service Worker  ←──→  Side Panel
                           ↑
                      (Source of Truth)
                       WXT Storage
```

### Channel naming convention (`src/utils/messages.ts`)

| Prefix           | Direction                                           | Example                                                                      |
| ---------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| `cs*`            | Content Script → Service Worker                     | `csCaptureStatus`, `csPurchaseHistoryAdd`, `csSaveSearch`, `csOpenSidepanel` |
| `cs*` (handlers) | Service Worker → Content Script (via tab targeting) | `csCaptureRead`, `csAutoCaptureRead`, `csSearchBarGet`                       |
| `sp*`            | Side Panel → Service Worker (relayed to CS)         | `spCaptureRead`, `spAutoCaptureRead`, `spSearchBarGet`                       |
| (broadcast)      | Service Worker → all extension pages                | `captureStatusChanged`                                                       |

### When to use messaging (`@webext-core/messaging`)

- **Request/response** between sidepanel and content script (e.g., `spCaptureRead` → SW relays → `csCaptureRead`)
- **Fire-and-forget events** from content script to SW (e.g., `csCaptureStatus`, `csPurchaseHistoryAdd`)
- **SW broadcasts** to sidepanel (e.g., `captureStatusChanged`) — always `.catch(() => {})` since sidepanel may be closed

### When to use `wxt/storage` (`chrome.storage.local`)

- Persisting data that must survive across sessions (drafts, settings, purchase history)
- Initial load/hydration of state in composables
- **Cross-context state sync** — the SW writes purchase history to storage; the sidepanel picks it up via `storage.watch()` with no message listener needed

### Pattern: Sidepanel requests data from content script

1. Sidepanel calls `sendMessage("spCaptureRead")` (goes to SW)
2. SW handler finds the active tab and relays: `sendMessage("csCaptureRead", undefined, tabId)`
3. Content script handler returns the capture data
4. SW returns the result back to the sidepanel

### Pattern: Content script sends event to sidepanel

1. Content script calls `sendMessage("csPurchaseHistoryAdd", item)` (goes to SW)
2. SW persists the item to `chrome.storage.local`
3. Sidepanel's `usePurchaseHistory` composable picks up the change via `storage.watch()`

### Pattern: Content script triggers sidepanel action

1. Content script calls `sendMessage("csSaveSearch")` or `sendMessage("csOpenSidepanel")`
2. SW opens the sidepanel via `chrome.sidePanel.open()` and/or writes a trigger to storage
3. Sidepanel watches the storage key and reacts

### Key rules

1. **Never send messages directly from CS to SP** — always route through the SW
2. **Swallow errors on broadcasts**: `sendMessage("captureStatusChanged", data).catch(() => {})` — the sidepanel may not be open
3. **Use `storage.watch()`** for continuous state sync rather than polling or repeated messages
4. **Tab targeting**: when SW relays to a specific content script, use `sendMessage("csCaptureRead", undefined, tabId)`
5. **No raw `chrome.runtime.sendMessage`** — use the typed `sendMessage`/`onMessage` from `src/utils/messages.ts`

See `src/utils/messages.ts` for the typed `ProtocolMap` and `src/entrypoints/background.ts` for the SW relay handlers.

## Tech Stack

- WXT 0.20, Vue 3 (Composition API + `<script setup>`), Pinia, Tailwind v4, Zod
- Build: `vp dev`, `vp build`, `vp check`
- E2E: Playwright (`npm run e2e` from root)

## Key Conventions

- All types use Zod schemas with inferred TypeScript types
- Storage keys defined in `types/storage.ts`
- Design tokens in `styles/tokens.css` (PoE gold/dark theme)
- Components organized by feature: `mine/`, `history/`, `detail/`, `settings/`, `shared/`
