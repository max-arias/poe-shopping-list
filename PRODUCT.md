# PRODUCT.md — PoE Shopping List

Verified against `main` at `059c446`.

## Product Purpose

Two surfaces for the same job: keep a Path of Exile shopping List of Trade
searches, and get someone else's curated List into your own copy quickly.

- The **browser extension** is a Personal Shopping Companion. A player saves,
  imports, edits, follows, and completes Lists locally. No account, no server,
  no pricing, no sync.
- The **static catalog** publishes curated Published Lists and practical craft
  notes, each exposing the official Trade search and its reasoning, with a share
  code for import.

## Users

- **Curator** — knows where an item comes from and writes a Published List whose
  every item carries a real Trade search and a reason.
- **Player following a List** — imports or creates a List, works through it,
  opens Trade links, and checks items off.
- **Private trader** — keeps a personal List for their own upgrade path and
  never shares it.

## Register

**Product.** The extension sits beside the official Trade site and must feel
native to it; the catalog reads like a field note, not a build-guide funnel.
Clarity, density, and speed over visual flair.

## Brand Personality

- **Direct and unadorned** — no marketing language, no onboarding carousels, no
  celebration animations.
- **Warm dark ledger** — the extension is dark-only with one brass accent; the
  catalog is a light, high-contrast reference.
- **Compact and dense** — every pixel earns its place; information density is a
  feature.
- **Trustworthy tool** — every recommendation exposes the actual Trade search,
  so a reader can judge it rather than trust a claim.

## Anti-References

- **SaaS landing pages** — no hero sections, gradient CTAs, or "get started"
  carousels.
- **Build-guide funnels** — no ads, video-first pages, or advice that buries the
  actionable Trade link.
- **Loot spectacle** — no rarity splash effects, artificial urgency, or
  dashboard-style metric cards.
- **Gamified UI** — no confetti, achievement badges, or animated progress bars.

## Key Features

| Feature                  | Surface   | Description                                                                  |
| ------------------------ | --------- | ---------------------------------------------------------------------------- |
| Personal Drafts          | Extension | Create, rename, delete, and reorder locally stored Lists                     |
| Items and groups         | Extension | Title-only Trade rows, optional titled groups, drag reorder, item notes      |
| Mark complete            | Extension | Per-item local completion that never leaves the browser                      |
| Register Current Trade   | Extension | Capture the active Trade search with a confirmed, editable title             |
| Share code import/export | Extension | Strict v1 `psl1.` share code; imports create an independent, incomplete copy |
| List appearance          | Extension | One optional icon or color per List                                          |
| Published List Catalog   | Catalog   | Published List cards with their Trade links and reasoning                    |
| Download / Copy          | Catalog   | Per-list share code for import into the extension                            |
| Craft notes              | Catalog   | Low-cost crafting routes when buying is not the best answer                  |

## Tone

- UI copy is terse and functional: "New List", "Register Current Trade",
  "Import list", "Copy".
- No exclamation marks in buttons or labels.
- Error states are specific and actionable, and keep the user's input intact so
  it can be corrected.

## Constraints

- The extension is a Chrome MV3 side panel built from WXT; Firefox packaging is
  planned but not validated.
- All extension data lives in `browser.storage.local` — no server, no sync, no
  accounts, no analytics.
- Extension host permissions cover only the two Path of Exile Trade origins.
- The catalog is static output with no runtime API, database, or CMS.
- No pricing, price history, build importing, or purchase history on either
  surface.
