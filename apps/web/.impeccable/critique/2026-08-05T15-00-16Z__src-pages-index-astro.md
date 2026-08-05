---
target: apps/web/src/pages/index.astro
total_score: 25
p0_count: 1
p1_count: 2
timestamp: 2026-08-05T15-00-16Z
slug: src-pages-index-astro
---
Method: dual-agent (A: des-1 · B: fix-3)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Copy/download feedback exists, but freshness and trade environment are unclear. |
| 2 | Match System / Real World | 2/4 | Categories and mixed environments do not explain what is safe or relevant to buy. |
| 3 | User Control and Freedom | 3/4 | Direct links work, but there is no way to narrow or collapse the long catalog. |
| 4 | Consistency and Standards | 3/4 | Visual language is coherent; navigation lacks current-location feedback. |
| 5 | Error Prevention | 2/4 | No warning for stale, Standard-only, or league-specific searches. |
| 6 | Recognition Rather Than Recall | 3/4 | Links are visible, but applicability and best-fit context require memory. |
| 7 | Flexibility and Efficiency | 2/4 | No search or filtering by league, tag, budget, or slot. |
| 8 | Aesthetic and Minimalist Design | 3/4 | Restrained system works, but hero space does not improve task completion. |
| 9 | Error Recovery | 2/4 | Copy failure gives no fallback action; stale destinations are not surfaced. |
| 10 | Help and Documentation | 2/4 | League, tags, price/budget, and buy-vs-craft choices lack short explanations. |
| **Total** |  | **25/40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

**LLM assessment:** Low-to-moderate AI slop. The field-manual direction avoids SaaS cards and gradients, but the slogan, arbitrary numbers, small uppercase labels, and broad whitespace can feel art-directed before the information architecture earns them. The current single-family Outfit usage matches the existing shipped identity, so the detector's `single-font` finding is valid evidence but not a mandatory font change.

**Deterministic scan:** 1 warning — `single-font` at `apps/web/src/pages/index.astro:28` (`Outfit` only). No false positive was identified by the evidence assessment; it is a low-priority concern because existing identity takes precedence.

**Visual overlays:** Browser preflight and detector injection passed. The overlay is visible in the **[Human]** browser tab; console output reported “No anti-patterns found.” A favicon request returned 404.

## Overall Impression

The page looks credible, calm, and intentionally unlike a build-guide funnel. Its biggest problem is not visual taste; it is that the page makes players interpret a large open catalog before it helps them find the right item, league, or cheap craft.

## What's Working

- Official Trade links are directly available instead of hidden behind cards, ads, or capture flows.
- The open editorial rows, semantic headings, ordered lists, focus indicators, and reduced-motion handling form a thoughtful baseline.
- Monochrome restraint fits a dependable field reference and keeps attention on item names and links.

## Priority Issues

### [P0] Make league and Trade-link validity unmistakable

**Why it matters:** A player can waste currency on the wrong league or stale search, breaking the catalog's trust promise.

**Fix:** Put an explicit environment/league label and freshness or verification status beside every list. Explain `Standard`, current league, evergreen, Allflame, and Mercenaries before the first action.

**Suggested command:** `/impeccable harden apps/web/src/pages/index.astro`

### [P1] Provide a fast route to the actual need

**Why it matters:** Finding common items or cheap crafts currently means linear scanning across more than 60 visible links.

**Fix:** Add search and filters for league, category, tag, budget, and item slot. Give “common items” and “start here” routes; link relevant crafts from applicable item rows.

**Suggested command:** `/impeccable shape catalog discovery`

### [P1] Reduce expanded-list decision burden

**Why it matters:** The 34-item Mercenaries list asks users to compare too many similar links at once.

**Fix:** Start each list with a short core set or ranked labels such as Core, Upgrade, and Optional; reveal the remainder through a deliberate “show all” action.

**Suggested command:** `/impeccable distill apps/web/src/pages/index.astro`

### [P2] Add decision-support content before export utilities

**Why it matters:** Players need budget and applicability context more than JSON controls.

**Fix:** Add compact budget bands, applicability summaries, and “buy this / craft instead” cues. Move export controls into a quieter list-level utility area.

**Suggested command:** `/impeccable clarify apps/web/src/pages/index.astro`

### [P3] Tighten secondary controls and small metadata

**Why it matters:** Metadata is easy to miss at zoom or on narrow screens, while JSON actions compete with core links.

**Fix:** Strengthen metadata legibility and spacing; visually demote export actions without hiding them.

**Suggested command:** `/impeccable typeset apps/web/src/pages/index.astro`

## Persona Red Flags

### Alex — time-poor player

- Cannot tell whether `defense`, `guardian`, `league-start`, or `budget` fits the current need.
- Receives no obvious first recommendation before they start parsing build names.
- May follow a Standard or stale search without noticing.

### Jordan — experienced trade optimizer

- Cannot filter by league, slot, price, or upgrade priority.
- Has no price ceiling, availability signal, or cheapest viable route.
- Must manually interpret duplicate or generic rare-gear rows.

### Sam — keyboard, screen-reader, or low-vision user

- Faces an extended linear scan of fully expanded lists.
- May find 10–13px muted metadata tiring at zoom.
- Has no skip link or compact catalog index; new-tab Trade behavior can be disorienting.

## Minor Observations

- “Buy with intent.” is polished but does not signal the cheap-craft promise.
- The hard-coded “Path of Exile 1” label risks confusion next to league-specific content.
- Category order numbers do not communicate player-facing meaning.
- The fixed feedback message is easy to miss when it disappears.
- Craft notes lack an active navigation state.

## Questions to Consider

1. Should the homepage be organized around player needs, slots, league, and budget rather than published list categories?
2. Is the sparse editorial treatment helping players find an answer, or primarily demonstrating the design direction?
3. Should the homepage recommend the cheapest, most common path first and make the full catalog secondary?
