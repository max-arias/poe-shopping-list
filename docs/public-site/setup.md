# Public-site local setup

This page describes the implemented static site and its checks. Cloudflare
credentials are not needed for local validation.

## Prerequisites and install

Use the repository's Corepack-managed pnpm toolchain (`pnpm@10.28.0`). With a
supported Node installation:

```sh
corepack enable
corepack pnpm install --frozen-lockfile
```

The verified invocation in this workspace is `corepack pnpm`; use it even if a
standalone `pnpm` command is unavailable.

## Exact validation commands

Run these from the repository root:

```sh
corepack pnpm --dir apps/web sync
corepack pnpm --dir apps/web check
corepack pnpm --dir apps/web content:validate
corepack pnpm --dir apps/web test:focused
corepack pnpm --dir apps/web build
corepack pnpm --dir apps/web output:check
corepack pnpm --dir apps/web links:check
corepack pnpm --dir apps/web wrangler:validate
```

`sync` generates Astro collection types, `check` runs Astro type checks,
`content:validate` performs content/reference validation, `test:focused` runs
the deterministic Vitest suite, and `build` produces the static `dist`
artifact. `output:check` verifies the expected static routes/content and
`links:check` verifies built internal and direct Trade-link targets.
`wrangler:validate` is a static-assets dry run. These commands require no
Cloudflare credentials.

For the isolated non-publishable browser fixture output, the equivalent checks
are:

```sh
corepack pnpm --dir apps/web build:test-fixtures
corepack pnpm --dir apps/web output:check:test-fixtures
corepack pnpm --dir apps/web links:check:test-fixtures
```

Never copy `dist-test` into the production `dist` artifact.

Before the browser test, install the Playwright Chromium browser (and Linux
dependencies where applicable):

```sh
corepack pnpm --dir apps/web exec playwright install --with-deps chromium
```

Then run the fixture browser and limited axe checks. It builds isolated
`dist-test` output and previews it; it does not publish fixtures:

```sh
corepack pnpm --dir apps/web test:browser
```

For a local manual check after a successful build:

```sh
corepack pnpm --dir apps/web preview
```

The current repository intentionally contains no Published Lists and no
canonical taxonomy values. A successful empty build is not evidence of
published content. There are no seeds, fixtures, or migrations to run; any
fixtures used by tests are not publishable.

## CI and artifact behavior

`.github/workflows/public-site.yml` runs the same sync/check/content validation,
focused tests, build, output/link checks, Wrangler dry-run, and Playwright/axe
checks. CI installs Chromium first. A trusted `main` run packages exactly one
artifact named `public-site-production-<commit SHA>` containing `dist.tar.gz`,
`dist.tar.gz.sha256`, and `content-manifest.txt`. It is the exact production
`dist` output tested by browser/axe, output, link, and Wrangler checks; there is
no deployment-input artifact. The production artifact and successful validation
evidence (`public-site-validation-<run ID>`) are retained for 30 days.
Validation failure evidence is retained for 14 days; deployment evidence is
retained for 30 days. Deployment downloads, verifies, and extracts that
artifact and does not rebuild it. The manifest is the sorted SHA-256/size
inventory of every built file.
