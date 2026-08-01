# Issue #22 — public-site seed strategy decision record

Decision record, updated 2026-07-30. This is planning for the future public site; it does not claim that a web app, schema, catalog, or content currently exists.

## 1. Scope and decision

- Prepare the technical system now; the user/Editorial Team will add the initial **3–5 Published Lists** later through the reviewed Git-authored content workflow.
- Author those Lists newly from scratch. Do not migrate, bulk-convert, or seed from legacy extension drafts, local data, old exports, prior link research, placeholder fixtures, or generated sample content.
- When authored, the initial set should cover current-league and evergreen Path of Exile 1 needs across distinct Categories/Tags. The Editorial Team selects the exact topics and titles in the initial content PR; this record deliberately does not prescribe them.
- An empty Catalog is a valid pre-content state. It must truthfully say that no Published Lists are available yet, preserve filter/search usability, and provide no fictional recommendations. Do not create sample Lists to fill it.

The terms Published List, Catalog, Category, Tag, League Applicability, List Item, Editorial Team, and Shareable List follow [`CONTEXT.md`](../../CONTEXT.md). The content contract comes from [issue #2](https://github.com/max-arias/poe-shopping-list/issues/2), and the one-page Catalog behavior comes from [issue #16](https://github.com/max-arias/poe-shopping-list/issues/16).

## 2. System-ready state

Readiness means the future implementation has:

- Published List content schema/catalog behavior and canonical Category/Tag references;
- authoring instructions for one category, zero or more tags, game/league applicability, ordered actionable items, direct official Trade URLs, quantity/variant, optional rationale/guidance, and no price/cache/query data;
- schema and semantic validators plus deterministic fixtures that are clearly test-only;
- contributor/review guidance and the intentional empty Catalog state; and
- the Catalog's static build, link, browser, artifact, and deployment checks.

Fixtures are validation inputs only. They must never be published or presented as Published Lists. Readiness does not include editorial content, an editorially selected topic list, or a migration compatibility layer.

The initial content PR is the first production seed. It follows [issue #4](https://github.com/max-arias/poe-shopping-list/issues/4), [issue #6](https://github.com/max-arias/poe-shopping-list/issues/6), and [issue #16](https://github.com/max-arias/poe-shopping-list/issues/16): canonical taxonomy references resolve; schema/semantic checks, static build, link checks, and browser checks pass; maintainers review and approve; and the verified artifact is deployed without rebuilding. Every submitted Trade URL must be manually checked as current and valid during review. There is no special migration path and no legacy compatibility requirement.

## 3. First-content PR sequence

1. The Editorial Team chooses 3–5 newly authored List topics/titles, covering current-league and evergreen Path of Exile 1 needs across distinct Categories/Tags.
2. Authors create the content through the normal Git workflow, using only canonical taxonomy slugs and the resolved Published List contract.
3. Authors validate every Trade URL manually at review time and document any relevant qualitative guidance; no prices or generated sample content are added.
4. Automated checks validate references, schema/semantics, fixtures, static output, links, browser behavior, and the empty/non-empty Catalog behavior.
5. Maintainers review the content and approve the PR. On merge, deploy the verified production artifact and run the post-deploy smoke checks.
6. If content is wrong, use a reviewed revert PR; do not repair it through a migration or hidden seed mechanism.

## 4. Import boundary and non-goals

The existing Shareable List v1 contract remains the sole strict JSON import/export contract, as described in [issue #10](https://github.com/max-arias/poe-shopping-list/issues/10) and [`CONTEXT.md`](../../CONTEXT.md). It can support optional visitor import into the extension, but intentionally does not carry taxonomy, league, or source metadata; imports create independent incomplete Personal Drafts.

Direct browser-to-extension handoff remains deferred. This seed plan does not revise that boundary, add extension host permissions, or introduce browser messaging. Other non-goals are migrating legacy drafts/data, bulk URL research, placeholder or generated Lists, fictional empty-state recommendations, database/API seeding, and changing extension operations.

## 5. Intended future surfaces

These are planned surfaces, not current files or dependencies:

- future `apps/web` static Astro Content Collections schema/catalog and empty-state implementation;
- contributor and Editorial Team instructions for authoring, taxonomy references, manual Trade URL review, and approval;
- semantic/reference validators and deterministic test-only fixtures, with an explicit guard that fixtures cannot enter published content;
- checks and deployment surfaces governed by [issue #6](https://github.com/max-arias/poe-shopping-list/issues/6); and
- focused tests for empty-state behavior, usable filters/search with zero results, valid initial content, URL validity evidence, and the Shareable List v1 export boundary.

## 6. Ordered implementation plan and acceptance criteria

1. Implement and document the content/catalog readiness contract, canonical references, validators, test-only fixtures, and truthful empty Catalog.
2. Implement contributor/review guidance and the issue #2/#4/#6/#16 validation and deployment path without adding migration or legacy compatibility behavior.
3. Have the Editorial Team author and submit the first 3–5 Lists from scratch, selecting topics/titles at that time.
4. Review every Trade URL manually, complete automated checks and maintainer approval, deploy the verified artifact, and record smoke evidence.

**Acceptance criteria:** the system is useful and truthful with zero Published Lists; filters and search remain usable in that state; no fixture or fictional recommendation can publish; readiness exists without editorial content; the first PR contains 3–5 newly authored Lists covering selected current-league/evergreen needs and distinct taxonomy; every Trade URL is manually current/valid at review; issues #2/#4/#6/#16 checks and approval/deployment rules pass; no migration or legacy compatibility path is added; and Shareable List v1 remains optional visitor import without taxonomy/league/source metadata or direct browser handoff.
