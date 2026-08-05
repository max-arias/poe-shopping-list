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

The repository includes authored Published Lists, including RF Essentials.
Review that normal catalog manually; there is no fixture catalog or separate
browser build to maintain.

## CI and artifact behavior

The publication workflow packages exactly one verified production artifact named
`public-site-production-<commit SHA>` containing `dist.tar.gz`,
`dist.tar.gz.sha256`, and `content-manifest.txt`. Deployment downloads, verifies,
and extracts that artifact without rebuilding it. The manifest is the sorted
SHA-256/size inventory of every built file.
