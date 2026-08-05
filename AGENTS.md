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

For every user-facing UI design or redesign, use a high-taste bespoke design process before implementation:

1. Produce five distinct design directions, each naming its aesthetic family, reference rationale, and proposed hero or primary-page composition.
2. Avoid generic AI patterns: no purple/blue gradients, Inter, generic card-grid treatment, 3D blobs, or templated SaaS styling unless the maintainer explicitly chooses an exception.
3. State the direction's guard rails (prohibited patterns and mandatory visual requirements) and wait for the maintainer to select a direction.
4. After selection, produce three concrete layout variants for that direction, high-fidelity image prompts where imagery is appropriate, and a development tweaks bar for real-time font, spacing, and color adjustment.

Use the `designer` agent and the relevant frontend-design skill for this work. Preserve the chosen visual intent through implementation.
