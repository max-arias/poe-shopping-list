## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues for `max-arias/poe-shopping-list`; external pull requests proposing curated public List content are an accepted contribution path, subject to maintainer review and automated checks. Code PRs are not an issue-triage request surface and follow normal code review. See `docs/agents/issue-tracker.md`.

### Triage labels

The triage vocabulary is `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repository. See `docs/agents/domain.md`.

### Validation policy

This repository intentionally has no automated test suite. Do not add test files, test runners or dependencies, or test CI unless the maintainer explicitly requests them. Use the existing static and production validation instead: content validation, Astro check/build, generated-output and link checks, and smoke/manual review where applicable.

### UI design workflow

For non-trivial user-facing UI work, use the `designer` agent and the relevant frontend-design skill. Start from the established design system and product requirements when they exist; otherwise make a considered visual decision and implement it.

Do not require a direction-selection exercise before implementation. Offer multiple design directions, layout variants, or visual prototypes only when the maintainer explicitly asks to explore or redefine the visual direction. Present a runnable result for feedback and preserve the agreed visual intent through follow-up work.
