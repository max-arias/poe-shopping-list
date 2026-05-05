# Agent Instructions — PoE Shopping List

## Communication Between Extension Surfaces

**Prefer `@webext-core/messaging` over `chrome.storage` watch patterns** for real-time communication between content scripts, background worker, and sidepanel.

### When to use messaging (`@webext-core/messaging`)

- Sending data from content script → sidepanel (e.g., purchase history items, capture data)
- Requesting data from content script (e.g., `captureRead`, `searchBarGet`)
- Any cross-context communication that needs to be immediate

### When to use `chrome.storage.local`

- Persisting data that must survive across sessions (drafts, settings, purchase history)
- Initial load/hydration of state in composables

### Pattern

1. Content script sends data via `sendMessage("channelName", data)`
2. Sidepanel listens via `onMessage("channelName", handler)` in the relevant composable
3. Handler updates both the reactive ref AND persists to `chrome.storage.local`
4. On mount, composable hydrates from storage; on message, it updates reactively

See `src/utils/messages.ts` for the typed protocol map and `src/composables/usePurchaseHistory.ts` for a reference implementation.

## Tech Stack

- WXT 0.20, Vue 3 (Composition API + `<script setup>`), Pinia, Tailwind v4, Zod
- Build: `vp dev`, `vp build`, `vp check`
- E2E: Playwright (`npm run e2e` from root)

## Key Conventions

- All types use Zod schemas with inferred TypeScript types
- Storage keys defined in `types/storage.ts`
- Design tokens in `styles/tokens.css` (PoE gold/dark theme)
- Components organized by feature: `mine/`, `history/`, `detail/`, `settings/`, `shared/`
