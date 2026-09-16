# Public-site operations and recovery

These procedures apply only to the static public site. They do not alter
extension operations, credentials, or store releases.

Verified against `main` at `059c446`.

## Current state

- `apps/web` builds static output to `apps/web/dist`.
- `apps/web/wrangler.jsonc` is asset-first Cloudflare Workers Static Assets:
  Worker name `poe-shopping-list-catalog`, compatibility date `2026-07-30`,
  `assets.directory: ./dist`, and no `main`, runtime API, or `run_worker_first`.
- **There is no CI workflow.** The workflow that validated PRs and trusted
  `main`, packaged one verified artifact, promoted it without rebuilding, and
  supported a requested preview was removed in `5db5b7a`. Deployment is manual.
- Only `scripts/check-output.mjs`, `scripts/check-links.mjs`, and
  `scripts/smoke.mjs` remain. The manifest, packaging, and deployment-record
  scripts were deleted with the workflow.
- No production owner, Cloudflare account, canonical hostname, protected
  environment, or accessibility review is configured. Launch is blocked on all
  of them.

## Manual deployment

From `apps/web`, after a successful local validation run
(see [setup](./setup.md)):

```sh
corepack pnpm --dir apps/web build
corepack pnpm --dir apps/web output:check
corepack pnpm --dir apps/web links:check
corepack pnpm --dir apps/web wrangler:validate
corepack pnpm --dir apps/web deploy
```

`wrangler:validate` is a dry run and needs no Cloudflare credentials. `deploy`
requires a least-privilege Cloudflare API token scoped to the required Workers
deployment and account resources; never use a personal global API key, and
never commit tokens or account identifiers to tracked files.

A manual deployment must still record, outside the repository or in the release
evidence the maintainer keeps: source SHA, the merged pull request, the built
artifact identity, the deployed Worker version, the actor and approver, the
timestamp, the site URL, and the smoke result. No script assembles that record;
write it by hand until the promotion path is restored.

## Requirements to re-establish automated promotion

A restored pipeline must:

1. Validate pull requests and trusted `main` with the frozen install, `sync`,
   `check`, `content:validate`, `build`, `output:check`, `links:check`, and
   `wrangler:validate` against one production `dist`.
2. Package that exact `dist` without rebuilding, named from the commit
   (`public-site-production-<commit SHA>`), with `dist.tar.gz`,
   `dist.tar.gz.sha256`, and a sorted per-file SHA-256/size manifest.
3. Deploy by extracting the downloaded artifact and running
   `wrangler deploy --config wrangler.jsonc` — never a fresh build on the
   deployment runner.
4. Retain production and successful-validation artifacts for 30 days and
   validation failures for 14 days.
5. Require protected production values: `CLOUDFLARE_API_TOKEN`,
   `CLOUDFLARE_ACCOUNT_ID`, `PUBLIC_SITE_URL`, `DEPLOYMENT_APPROVER`, and
   `MANUAL_ACCESSIBILITY_EVIDENCE`. Forks never receive them.
6. Support an optional, maintainer-requested preview from a successful
   same-repository `main` validation run, using separate preview credentials
   (`PREVIEW_CLOUDFLARE_API_TOKEN`, `PREVIEW_CLOUDFLARE_ACCOUNT_ID`,
   `PREVIEW_SITE_URL`), a non-production Worker name, a bounded lifetime, and a
   cleanup path. Preview never points at the production hostname.

## Smoke

`corepack pnpm --dir apps/web smoke` requires `PUBLIC_SITE_URL` to be the
canonical HTTPS origin root and `CONTENT_MANIFEST_PATH` to point at a verified
manifest. It checks `/` for HTTP 200 and truthful Catalog or card content, checks
a known nonexistent path for HTTP 404, fetches every file in the manifest, and
compares each deployed file's hash and size. It validates Trade links against the
official Trade URL contract only; it does not fetch Trade services or claim their
availability. The manifest is the deployed-artifact identity check, not a
replacement for the protected manual accessibility gate.

## Cache and observability

Hashed static assets should use long-lived immutable caching. HTML/catalog routes
should use a shorter cache lifetime so content publications become visible. Do
not purge on every deploy. For confirmed staleness, obtain maintainer approval
and use Cloudflare targeted purge for only affected URLs or paths; record reason,
paths, operator, and result. Broad purge is incident-only.

Use Cloudflare Workers metrics for request volume, status/error rates, and
deployment health. Use targeted Worker logs or `wrangler tail` only while
diagnosing a known incident, not continuous verbose logging. Establish one
minimal external uptime check for the canonical homepage and one representative
content route, with a named owner; this check is not configured. Do not add
Analytics Engine or Logpush without a documented need.

## Rollback, mirror, and restore drill

Record UTC start time, affected routes, symptom, source SHA, Worker version,
artifact/checksum, and smoke/metric evidence. For a deployment regression,
rollback the prior known-good Worker version first. If unavailable, redeploy a
retained known-good Git artifact through the protected process without a fresh
unverified local build. For bad content, merge a reviewed revert PR. Re-run smoke
and record the recovered version/artifact and result.

Git is authoritative, but maintainers must create a read-only off-platform
repository mirror with access control and documented retention; never mirror
secrets. At launch and at least quarterly, restore the mirror into a clean
environment, verify history and lockfile, run the setup/build checks, identify
the known-good artifact, and record gaps. The mirror and restore schedule are
manual prerequisites and are not configured.

## Manual accessibility evidence gate

Before first launch and after material template changes, a named maintainer must
manually review and record keyboard traversal, visible focus, headings/landmarks,
link names, 200% zoom/reflow, contrast in context, filter reset, card actions, and
Trade-link behavior. Automated checks do not replace this gate. Store the review
alongside protected release evidence and record its location; reviewer and
evidence location are currently unassigned, so launch is blocked.

## Launch blockers (not configured)

An assigned production deployment owner and backup owner, Cloudflare account
access, a canonical HTTPS hostname with Custom Domain and Universal SSL, a
least-privilege deployment token, a restored artifact-promotion process, and the
protected accessibility evidence. Verify HTTPS, redirects, certificate validity,
and canonical-host behavior before launch. No owner, domain, or hostname is
invented in this repository.
