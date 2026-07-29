# Issue tracker: GitHub

Issues and PRDs for `max-arias/poe-shopping-list` live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --repo max-arias/poe-shopping-list --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --repo max-arias/poe-shopping-list --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --repo max-arias/poe-shopping-list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --repo max-arias/poe-shopping-list --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --repo max-arias/poe-shopping-list --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --repo max-arias/poe-shopping-list --comment "..."`

## Pull requests and contribution policy

External pull requests proposing curated public List content are an accepted contribution path. They require maintainer review and automated checks before acceptance.

Code PRs are not an issue-triage request surface and follow normal code review.

## When a skill says “publish to the issue tracker”

Create a GitHub issue in `max-arias/poe-shopping-list`.

## When a skill says “fetch the relevant ticket”

Run `gh issue view <number> --repo max-arias/poe-shopping-list --comments`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body. Create it with `gh issue create --repo max-arias/poe-shopping-list --label wayfinder:map`.

- **Child ticket**: create an issue linked to the map as a GitHub sub-issue. Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Use labels `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling`, or `wayfinder:task`. Once claimed, assign the ticket to the driving dev.
- **Blocking**: GitHub's native issue dependencies are the canonical, UI-visible representation. Add an edge with `gh api --method POST repos/max-arias/poe-shopping-list/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric database id (`gh api repos/max-arias/poe-shopping-list/issues/<n> --jq .id`), not the `#number` or `node_id`. GitHub reports `issue_dependencies_summary.blocked_by` (open blockers only — the live gate). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Frontier query**: list the map's open children with `gh issue list --repo max-arias/poe-shopping-list --state open`, scoped to the map's sub-issues or task list; drop any with an open blocker (`issue_dependencies_summary.blocked_by > 0`, or an open issue in the `Blocked by` line) or an assignee. The first in map order wins.
- **Claim**: `gh issue edit <n> --repo max-arias/poe-shopping-list --add-assignee @me` — the session's first write.
- **Resolve**: `gh issue comment <n> --repo max-arias/poe-shopping-list --body "<answer>"`, then `gh issue close <n> --repo max-arias/poe-shopping-list`, then append a context pointer (gist + link) to the map's Decisions-so-far.
