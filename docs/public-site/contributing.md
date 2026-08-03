# Contributing Published Lists

Published Lists are authored from scratch in a reviewed Git PR. Do not
migrate extension drafts, run a seed or migration, publish fixtures, or add
generated samples/placeholders.
The Editorial Team chooses the initial topics; an empty Catalog is valid until
that work is approved.

## Content contract

Each Published List has:

- exactly one canonical primary Category;
- zero or more canonical Tags;
- explicit Path of Exile game and league applicability (or evergreen);
- ordered, actionable List Items;
- a direct official Path of Exile Trade URL for every item; and
- a variant for every item, plus optional item rationale and List
  Overview.

Do not add price, cache, query, account, completion, source, or author-supplied
`lastReviewed` data. Publication review derives review metadata from the
repository process. Preserve item order. Taxonomy values must resolve against
the repository's canonical taxonomy source; until that source is populated,
there is intentionally nothing to reference.

## Review process

1. Open a focused content PR using newly authored content and canonical
   references.
2. Run the local checks in [setup](./setup.md).
3. Manually open and review **every Trade URL** at review time. Record the
   reviewer, UTC date, and result in the PR or its release evidence; automated
   URL shape checks do not replace this review.
4. Maintainers review content correctness, taxonomy, applicability, ordering,
   and the export boundary, then approve and merge.
5. The trusted publication process promotes the already verified artifact.
   For a content defect, use a reviewed revert PR rather than a migration or
   hidden seed mechanism.

Fixtures, if used by validators, are test-only inputs and must never be copied
into publishable content. There is no seed, fixture publication, database seed,
or migration path, and no fixture should be added merely to populate the empty
Catalog.

## Export and extension boundary

Download and copy use only the strict, pricing-free Shareable List v1 JSON:
`{ format, version, title, overview?, items[] }`. Items may contain only
`title`, `tradeUrl`, `variant?`, and `note?`. Published List
Category, Tags, league, source, timestamps, and other catalog metadata must
not be exported. Import creates a new independent Personal Draft with every
item incomplete; copies do not synchronize.

Direct browser-to-extension handoff is deferred. Do not add messaging,
extension host permissions, or a new import protocol. This boundary and this
review process do not change extension operations. Do not make extension
operational changes as part of a public-site content PR.
