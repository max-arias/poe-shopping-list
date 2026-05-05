# PRODUCT.md — PoE Shopping List

## Product Purpose

A browser extension for Path of Exile that lets players create, manage, and share shopping lists of trade searches. No account, no server, no API. Everything lives in the browser. Lists are shared via compressed text strings (import/export).

## Users

- **List Creator**: Knows a build well, curates trade searches for specific gear, shares the list with others via export string
- **Follower**: Receives a shared list string, imports it, loads all the trade searches into their sidebar in one click
- **Private Trader**: Curates searches for their own build, never shares, uses the extension as a personal trade tracker

## Register

**Product** — design serves usability. The extension is a tool, not a brand statement. Clarity, density, and speed over visual flair.

## Brand Personality

- **Direct and unadorned** — no marketing language, no onboarding carousels, no celebration animations
- **Void black and Unique amber** — the visual language of Path of Exile: dark foundations, warm neutrals, a single amber accent drawn from the Unique item rarity color for actions and prices
- **Compact and dense** — the sidebar is narrow (380px). Every pixel earns its place. Information density is a feature, not a bug
- **Trustworthy tool** — this sits alongside the official trade site. It must feel native, not bolted on. No flashy UI that distracts from the trade workflow

## Anti-References

- **SaaS landing pages** — no hero sections, no gradient CTAs, no "get started" carousels
- **Generic AI tool marketing** — no purple gradients, no glassmorphism, no neon accents
- **Light-first design** — the primary theme is dark (matching the trade site); light is a secondary option
- **Mobile-first design** — this is a desktop browser extension; mobile patterns (bottom sheets, swipe gestures) don't apply
- **Overly playful or gamified UI** — no confetti, no achievement badges, no progress bars with animations

## Key Features

| Feature                    | Description                                                                      |
| -------------------------- | -------------------------------------------------------------------------------- |
| Draft lists                | Create, rename, delete lists locally                                             |
| Save search                | Auto-fill item name from trade search bar, capture price data (min, median, avg) |
| Mark complete              | Check off items as you acquire them                                              |
| Edit items                 | Rename, change URL, refresh price                                                |
| Export/Import              | Share lists via lz-string compressed strings                                     |
| Build-site FAB             | Injected button on pobb.in and maxroll.gg                                        |
| Theme                      | Light, dark, or system-following                                                 |
| Game/league                | Switch between PoE1 and PoE2 leagues                                             |
| Capture unavailable banner | Shows when DOM selectors fail, guides user to check for updates                  |
| Bulk unmark all            | Clear all completion flags and price captures in one action                      |
| Divine rate display        | Fetched from poe.ninja for currency conversion context                           |

## Tone

- UI copy is terse and functional: "Save This Search", "Publish", "Copy", "Delete list"
- No exclamation marks in buttons or labels
- Error states are specific and actionable: "Trade capture unavailable. Selectors may be out of date. You can still save by name."
- Numbers and prices use monospace, no decoration

## Constraints

- Extension sidebar width: 380px fixed
- Must work alongside the official pathofexile.com/trade layout without disrupting it
- Chrome MV3 + Firefox MV2 from a single WXT codebase
- All data in `browser.storage.local` — no server, no sync, no accounts
- PoE1 first; PoE2 behind a feature flag
