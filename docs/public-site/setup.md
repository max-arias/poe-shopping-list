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
corepack pnpm --dir apps/web build
corepack pnpm --dir apps/web output:check
corepack pnpm --dir apps/web links:check
corepack pnpm --dir apps/web wrangler:validate
```

`sync` generates Astro collection types, `check` runs Astro type checks,
`content:validate` performs content/reference validation, and `build` produces
the static `dist` artifact. `output:check` verifies the expected static routes/content and
`links:check` verifies built internal and direct Trade-link targets.
`wrangler:validate` is a static-assets dry run. These commands require no
Cloudflare credentials.

For a local manual check after a successful build:

```sh
corepack pnpm --dir apps/web preview
```

The repository authors three Published Lists — `cws-chieftain`,
`manyshot-mercenary`, and `rf-essentials` — plus a craft notes route. Review the
normal catalog manually; there is no fixture catalog or separate browser build.

The same checks are available through the root workspace scripts as
`vp run web:sync`, `vp run web:check`, `vp run web:content:validate`,
`vp run web:build`, `vp run web:output:check`, and `vp run web:links:check`.

## Deployment (manual) and artifact behavior

There is no CI workflow: the one that validated, packaged, and promoted a
production artifact was removed in `5db5b7a`. Deploy from `apps/web` with
`corepack pnpm --dir apps/web deploy` (Wrangler static assets) after a successful
local validation run; `corepack pnpm --dir apps/web deploy:preview` uploads a
preview version instead.

`smoke.mjs` is the only remaining artifact-aware script: it verifies a deployed
site against a verified manifest and requires `PUBLIC_SITE_URL` (canonical HTTPS
origin root) plus `CONTENT_MANIFEST_PATH`. The manifest, packaging, and
deployment-record scripts were deleted with the workflow, so a restored promotion
path must rebuild that capability. Re-establishing it is a launch prerequisite,
not current behavior.
