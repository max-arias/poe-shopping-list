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

Tickets live in the Obsidian vault, not GitHub Issues:

- Board: `/mnt/c/Users/max/Documents/Obsidian Vault/poe-shopping-list/Board.md`.
- Tickets: `/mnt/c/Users/max/Documents/Obsidian Vault/poe-shopping-list/tickets/PSL-<n>.md`.

Read `/mnt/c/Users/max/Documents/Obsidian Vault/Ticket System.md` for the format
and operations (create, read, list, comment, claim, resolve, frontier), triage
labels, and how `/wayfinder` maps, children and blockers work.

GitHub Issues are no longer used. Don't create issues with `gh`. When a skill
says "publish to the issue tracker", create a PSL ticket; when it says "fetch
the relevant ticket", read the PSL ticket note.

External pull requests proposing curated public List content are an accepted
contribution path and the only content intake path; use
`.github/PULL_REQUEST_TEMPLATE.md` and the README's contributing section. Code
PRs are not a ticket-triage surface and follow normal code review.

## Vocabulary

Use the terms defined in the README's vocabulary section in issue titles,
refactor proposals, and test names; do not drift to synonyms. If a needed concept
is missing there, that is a signal — either you are inventing language the
project does not use, or there is a real gap worth recording.
