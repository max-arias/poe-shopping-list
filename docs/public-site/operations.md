# Public-site operations and recovery

These procedures apply only to the static public site. They do not alter
extension operations, credentials, or store releases.

## Implemented delivery surface

`apps/web/wrangler.jsonc` is asset-first Cloudflare Workers Static Assets:
Worker name `poe-shopping-list-catalog`, compatibility date `2026-07-30`, and
assets directory `./dist`; it has no `main`, runtime API, or
`run_worker_first`. `.github/workflows/public-site.yml` validates PRs and
trusted `main`, uploads one verified artifact, and deploys that artifact
without rebuilding. Forks have no Cloudflare credentials.

The workflow's production environment names these exact protected values:

| Environment | Secrets | Variables |
| --- | --- | --- |
| `production` | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | `PUBLIC_SITE_URL`, `DEPLOYMENT_APPROVER`, `MANUAL_ACCESSIBILITY_EVIDENCE` |
| `public-site-preview` | `PREVIEW_CLOUDFLARE_API_TOKEN`, `PREVIEW_CLOUDFLARE_ACCOUNT_ID` | `PREVIEW_SITE_URL` |

These environments, credentials, account values, and URL are **not configured**
in this repository. The production URL must be canonical HTTPS. An unassigned
production owner, backup owner, Cloudflare account, or hostname is a launch
blocker; do not substitute a guessed value.

## Production artifact and evidence

The trusted `main` validation job runs the frozen install, `sync`, `check`,
`content:validate`, production `build`, `output:check`, `links:check`, and
`wrangler:validate` against one production `dist`, then packages it without
rebuilding. The resulting artifact
is named `public-site-production-<commit SHA>` and contains `dist.tar.gz`,
`dist.tar.gz.sha256`, and the sorted per-file SHA-256/size
`content-manifest.txt`. Successful validation evidence is named
`public-site-validation-<run ID>`.

Production and successful validation artifacts/evidence are retained 30 days;
validation-failure evidence is retained 14 days. Deployment evidence is
uploaded as `public-site-deployment-evidence-<run ID>` for 30 days.

Deployment downloads the exact artifact, extracts it into `apps/web/dist`, and
uses `wrangler deploy --config wrangler.jsonc`; it does not run Astro build.
Before smoke, the deployment job creates a record containing source SHA,
merged-PR reference, artifact ID/name/checksum, manifest reference, actor,
approver, timestamp, URL, environment, toolchain versions, run IDs, Wrangler
output, durable validation-evidence references, and a pending smoke status.
After smoke it updates the record with smoke status/details/timestamp and
archives the checksum and manifest. The protected approver and
`MANUAL_ACCESSIBILITY_EVIDENCE` values are required; missing either is an
explicit launch blocker. A failed smoke still updates and uploads evidence,
then fails the deployment.

## Requested preview

Preview is optional, post-review, non-production, and only a trusted
same-repository `main` push artifact may run it. Use **Actions → Public site →
Run workflow** with exactly:

- `preview_action`: `deploy`;
- `artifact_run_id`: the run ID of a successful `Validate and package public
  site` job from a same-repository `main` push;
- `artifact_name`: the exact `public-site-production-<SHA>` artifact from that
  run;
- leave `preview_worker_name` empty for deploy.

The job checks the run repository, branch, and event, then specifically requires
the successful `Validate and package public site` job and downloads its exact
artifact. It does not require production deployment success. It checks out the
artifact run's exact source SHA and derives the non-production Worker name
`poe-site-preview-<artifact_run_id>`. It requires protected
`PREVIEW_SITE_URL`, deploys with the dedicated preview credentials, and runs
manifest-wide HTTPS smoke plus contract-only validation of any Trade URLs.
The job reports the preview URL and a 72-hour expiry; never point it at the
production hostname.

To clean up, run **Actions → Public site → Run workflow** with
`preview_action: cleanup` and the exact derived `preview_worker_name` (for
example `poe-site-preview-123456789`). The workflow accepts only names with
the `poe-site-preview-` prefix and deletes the Worker with dedicated preview
credentials. Cleanup is bounded and should be run within 72 hours.

```sh
preview_worker_name=poe-site-preview-<artifact_run_id>
```

## Launch configuration and smoke

Before launch, assign owners and configure a least-privilege token in the
protected production environment. Configure the canonical Workers Custom
Domain and Universal SSL, then verify HTTPS, redirects, certificate validity,
and canonical-host behavior. Do not store tokens or sensitive account IDs in
tracked files.

The implemented `corepack pnpm --dir apps/web smoke` requires
`PUBLIC_SITE_URL` to be the canonical HTTPS origin root, checks `/` for HTTP
200 and truthful Catalog or card content, checks a known nonexistent path for
HTTP 404, fetches every file in `content-manifest.txt`, and compares each
deployed file's hash and size. It validates any Trade URLs against the official
Trade URL contract only; it does not fetch Trade services or claim their
availability. The manifest is the deployed-artifact identity check, not a
replacement for the protected manual accessibility gate.

## Cache and observability

Hashed static assets should use long-lived immutable caching. HTML/catalog
routes should use a shorter cache lifetime so content publications become
visible. Do not purge on every deploy. For confirmed staleness, obtain
maintainer approval and use Cloudflare targeted purge for only affected URLs or
paths; record reason, paths, operator, and result. Broad purge is incident-only.

Use Cloudflare Workers metrics for request volume, status/error rates, and
deployment health. Use targeted Worker logs or `wrangler tail` only while
diagnosing a known incident, not continuous verbose logging. Establish one
minimal external uptime check for the canonical homepage and one representative
content route, with a named owner; this check is not configured yet. Do not add
Analytics Engine or Logpush without a documented need.

## Rollback, mirror, and restore drill

Record UTC start time, affected routes, symptom, source SHA, Worker version,
artifact/checksum, and smoke/metric evidence. For a deployment regression,
rollback the prior known-good Worker version first. If unavailable, redeploy a
retained known-good Git artifact through the protected process without a fresh
unverified local build. For bad content, merge a reviewed revert PR. Re-run
smoke and record the recovered version/artifact and result.

Git is authoritative, but maintainers must create a read-only off-platform
repository mirror with access control and documented retention; never mirror
secrets. At launch and at least quarterly, restore the mirror into a clean
environment, verify history and lockfile, run the setup/build checks, identify
the known-good artifact, and record gaps. The mirror and restore schedule are
manual prerequisites and are not configured here.

## Manual accessibility evidence gate

Before first launch and after material template changes, a named maintainer
must manually review and record keyboard traversal, visible focus,
headings/landmarks, link names, 200% zoom/reflow, contrast in context, filter
reset, card actions, and Trade-link behavior. Automated checks do not replace
this gate. Store the review alongside protected release evidence and
record its location; reviewer and evidence location are currently unassigned,
so launch is blocked.
