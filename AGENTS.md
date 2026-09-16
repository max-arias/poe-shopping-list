# Agent Instructions — PoE Shopping List

Project documentation lives in [`README.md`](README.md). Read it before changing
code; this file covers only how agents operate in this repository.

## Validation policy

The repository intentionally has no automated test suite. Do not add test files,
test runners or dependencies, or test CI unless the maintainer explicitly asks.
Validate with the existing checks: `vp run ext:typecheck`, `vp run ext:check`,
`vp run ext:build` for the extension, the catalog commands in the README for
`apps/web`, and manual review in a supported browser where behavior changed.

This project is unreleased. Prefer clean forward-only changes over
backward-compatibility layers, aliases, or migration code unless the user
explicitly asks for them.

## UI design workflow

For non-trivial user-facing UI work, use the `designer` agent and the relevant
frontend-design skill. Start from the established design system (Trade Bench
tokens for the extension, the catalog tokens in `apps/web/src/styles/`) and the
product requirements in the README; otherwise make a considered visual decision
and implement it.

Do not require a direction-selection exercise before implementation. Offer
design directions, layout variants, or prototypes only when the maintainer asks
to explore or redefine the visual direction. Present a runnable result for
feedback and preserve the agreed visual intent through follow-up work.

## Issue tracker

Issues live as GitHub issues for `max-arias/poe-shopping-list`. Use the `gh` CLI:

- **Create**: `gh issue create --repo max-arias/poe-shopping-list --title "..." --body "..."` (heredoc for multi-line bodies).
- **Read**: `gh issue view <number> --repo max-arias/poe-shopping-list --comments`.
- **List**: `gh issue list --repo max-arias/poe-shopping-list --state open --json number,title,body,labels --jq '[.[] | {number, title, body, labels: [.labels[].name]}]'`.
- **Comment**: `gh issue comment <number> --repo max-arias/poe-shopping-list --body "..."`.
- **Labels**: `gh issue edit <number> --repo max-arias/poe-shopping-list --add-label "..."` / `--remove-label "..."`.
- **Close**: `gh issue close <number> --repo max-arias/poe-shopping-list --comment "..."`.

When a skill says "publish to the issue tracker", create an issue there; when it
says "fetch the relevant ticket", run `gh issue view <number>`.

External pull requests proposing curated public List content are an accepted
contribution path and the only content intake path; use
`.github/PULL_REQUEST_TEMPLATE.md` and the README's contributing section. Code
PRs are not an issue-triage surface and follow normal code review.

### Triage labels

| Role               | Label             | Meaning                                  |
| ------------------ | ----------------- | ---------------------------------------- |
| Needs triage       | `needs-triage`    | Maintainer needs to evaluate this issue  |
| Needs information  | `needs-info`      | Waiting on reporter for more information |
| Ready for an agent | `ready-for-agent` | Fully specified, ready for an AFK agent  |
| Ready for a human  | `ready-for-human` | Requires human implementation            |
| Will not action    | `wontfix`         | Will not be actioned                     |

### Wayfinding

Used by `/wayfinder`. The **map** is a single issue labelled `wayfinder:map`
holding the Notes / Decisions-so-far / Fog body.

- **Child tickets** are sub-issues of the map (fallback: a task list in the map
  body plus `Part of #<map>` at the top of the child), labelled
  `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling`, or
  `wayfinder:task`. Assign each claimed ticket to the driving dev.
- **Blocking** uses GitHub native issue dependencies:
  `gh api --method POST repos/max-arias/poe-shopping-list/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`,
  where `<blocker-db-id>` is the blocker's numeric database id
  (`gh api repos/max-arias/poe-shopping-list/issues/<n> --jq .id`), not the
  `#number` or `node_id`. Fallback: a `Blocked by: #<n>` line at the top of the
  child body. A ticket is unblocked when every blocker is closed.
- **Frontier**: the map's open children, dropping any with an open blocker
  (`issue_dependencies_summary.blocked_by > 0`) or an assignee. The first in map
  order wins.
- **Claim**: `gh issue edit <n> --repo max-arias/poe-shopping-list --add-assignee @me`.
- **Resolve**: comment the answer, close the issue, then append a context
  pointer to the map's Decisions-so-far.

## Vocabulary

Use the terms defined in the README's vocabulary section in issue titles,
refactor proposals, and test names; do not drift to synonyms. If a needed concept
is missing there, that is a signal — either you are inventing language the
project does not use, or there is a real gap worth recording.
