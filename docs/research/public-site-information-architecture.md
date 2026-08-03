# Issue #16 — public-site information architecture decision record

Decision record, updated 2026-07-30. This is planning for the future public static site; it does not claim that `apps/web`, a Catalog, or any web implementation exists today.

## 1. Scope and decision

- **V1 is one public static Catalog page.** It is not a homepage plus Published List detail pages. Published Lists never receive their own page.
- The Catalog is a searchable, filterable collection of compact, read-only Published List Cards. This uses the domain terms in [`CONTEXT.md`](../../CONTEXT.md): Catalog, Published List Card, Category, Tag, League Applicability, List Item, List Overview, and Shareable List.
- The content model follows [issue #2](https://github.com/max-arias/poe-shopping-list/issues/2): one primary Category, zero or more Tags, game/league applicability, ordered actionable items, and official direct Trade URLs with variants and optional rationale or qualitative guidance. It contains no price, cache, or query data.
- **Non-goals:** homepage content, Published List routes, cart or completion state, pricing, accounts, comments, transactions, images, generated summaries/social cards, direct browser-to-extension handoff, and a collection of indexable filter/detail pages.

## 2. Catalog behavior

The single Catalog page provides these taxonomy controls:

- Path of Exile game;
- league or evergreen applicability;
- one or more Category/Tag selections, using the curated taxonomy; and
- keyword search over the Catalog's appropriate visible text.

Game, league, Category, and Tag selections are shareable URL state. Free-text search is local visitor state: it is not written to the URL and is not a shareable or indexable URL state. The page must make the active filters and their reset behavior clear. No filter combination creates a separately indexable page in V1.

Each result is a compact, read-only Published List Card. The card may show its name, applicable taxonomy, optional author `List Overview`, and its ordered List Items. Trade links lead the card: the initial view shows a short set of ordered links, with an in-card expand control revealing the remainder. The full order must be preserved. Every item exposes its direct official Trade URL, variant, and optional rationale/guidance where supplied.

Author free text/summary remains optional. V1 does not add a required summary field and does not derive a generated summary when the author omits one.

There are no images at launch: no per-List images, generated social cards, or image metadata requirement.

## 3. Import and extension boundary

Each Card offers both actions:

1. **Download** the existing versioned Shareable List JSON.
2. **Copy** that same JSON to the clipboard, with clear success/failure feedback.

The Shareable List v1 contract is the sole strict JSON import/export contract, as defined in [issue #10](https://github.com/max-arias/poe-shopping-list/issues/10) and [`CONTEXT.md`](../../CONTEXT.md). It is pricing-free and intentionally excludes Published List taxonomy, league, and source metadata. Import creates an independent incomplete Personal Draft; copies do not synchronize and do not carry over Published List identity or updates.

Direct browser-to-extension handoff is deferred. This is deliberate: [issue #13](https://github.com/max-arias/poe-shopping-list/issues/13) supports only Path of Exile Trade hosts. A handoff would require a separately specified public-site host permission and authenticated browser messaging protocol. This record does not revise issue #13.

## 4. URL, discovery, and SEO

Use one canonical Catalog URL. Apply basic site-level title, description, robots, and canonical metadata to that page. Do not add per-List social metadata, image metadata, or indexable filter/detail routes. Normal static sitemap and robots behavior applies only to the one public Catalog page until the route model grows.

Taxonomy selections may be represented in shareable URL state for visitors, but those states are not a second SEO information architecture. Free-text search remains local and must not become a query-indexing mechanism.

## 5. Accessibility and interaction expectations

- Filters use real labels, keyboard-operable controls, clear selected state, and a reliable reset-all action. Applying or clearing filters must expose an understandable result-count/status update without trapping focus.
- The in-card expansion control is a named button with an expanded/collapsed state, keyboard support, and a predictable focus order. Revealed Trade links remain in the document order shown to users.
- External Trade links are identifiable as external and have meaningful accessible names. They must not silently replace an unrelated interaction or imply an in-site transaction.
- Download has a meaningful accessible name and a usable filename/content type. Copy-to-clipboard reports success and failure through visible and programmatically available feedback; it must not rely on color or a disappearing visual cue alone.
- The Catalog, filter controls, Cards, links, and feedback must remain usable with keyboard navigation, zoom/reflow, and assistive technology. Manual accessibility review remains required; automated checks do not replace it.

## 6. Intended future implementation, documentation, and test surfaces

These are planning surfaces, not claims about current files or dependencies:

- A future `apps/web` Astro Content Collections schema/content surface for Published Lists, taxonomy references, and the single Catalog route.
- Catalog filter/search state, URL serialization, Card expansion, ordered Trade links, Shareable List JSON download, and clipboard behavior.
- Contributor documentation describing the issue #2 content rules and the Shareable List v1 boundary; web documentation describing the one-page information architecture and URL rules.
- Focused tests for taxonomy filtering, URL state, local search, stable item order, optional guidance, expansion, exact Shareable List JSON export, download, and clipboard success/failure.
- Static output/browser checks for the Catalog, accessibility interaction expectations, canonical metadata, robots/sitemap scope, external links, and no unintended List/detail routes.

## 7. Ordered implementation sequence and acceptance criteria

1. Define the future Catalog content/schema mapping to issue #2 and the existing Shareable List v1 contract; preserve optional author guidance and omit taxonomy/league/source metadata from exported JSON.
2. Implement the single Catalog page with game, league, Category, Tag, and local keyword-search behavior; serialize only taxonomy selections into shareable URL state.
3. Implement compact read-only Cards with short initial Trade-link sets, in-card expansion, optional guidance, download, and clipboard actions.
4. Add the one canonical Catalog metadata surface and verify that no per-List or filter/detail SEO routes are created.
5. Add focused, browser, and manual accessibility validation for the interactions and route constraints above; document the import boundary and deferred handoff.

**Acceptance criteria:** V1 has exactly one public Catalog page and no Published List pages; all four taxonomy dimensions filter the Catalog; taxonomy selections share through URL state while keyword search stays local; Cards are compact/read-only with ordered direct Trade links and in-card expansion; optional author text is preserved without generated or required summaries; no images or in-site transaction features exist; download and clipboard export the same versioned Shareable List v1 JSON; imports remain independent incomplete Personal Drafts; direct handoff remains deferred without changing issue #13; and canonical/robots/sitemap behavior is limited to the single Catalog page.
