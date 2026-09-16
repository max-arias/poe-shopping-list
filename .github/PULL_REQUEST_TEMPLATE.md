# Content pull request

<!-- Content PRs are the only intake path for Published List changes. There is
no issue form and no contributor web editor. See docs/public-site/contributing.md.
If this PR is a code change rather than catalog content, delete this body and
follow normal code review. -->

## What changes

- List(s):
- Change type: new list / edit to an existing list / taxonomy addition
- Taxonomy values used (must already exist in
  `apps/web/src/domain/taxonomy.ts`):
- Applicability (exactly one league, or evergreen):

## Trade URL review (required)

- Reviewer:
- UTC date:
- Result:

<!-- Open and inspect every Trade URL in this PR at review time. Automated shape
checks in links:check do not replace this review. -->

## Checklist

- [ ] Every item has a direct official `https://www.pathofexile.com/trade/search/...` URL
- [ ] Every item has a variant; rationale and overview are optional
- [ ] Exactly one canonical Category and only canonical Tags
- [ ] Applicability states exactly one league or evergreen
- [ ] The list uses `items` or `groups`, never both, and source order is intentional
- [ ] No price, cache, query, account, completion, source, or author-supplied `lastReviewed` data
- [ ] No generated sample, seed, fixture, or placeholder content
- [ ] Local checks in `docs/public-site/setup.md` pass
- [ ] The PR contains no extension, workflow, dependency, or build changes

## Reviewer notes

<!-- Anything a reviewer must verify beyond the checklist. -->
