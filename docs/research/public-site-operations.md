# Issue #7 — public-site operations and delivery decision record

Decision record, updated 2026-07-30. This is an implementation-ready operations, delivery, and documentation decision record; it is planning only and does not assert that the planned site or delivery surfaces currently exist.

## 1. Scope and decision

- **In scope:** operational ownership, Cloudflare delivery, production deployment, requested previews, domains/TLS, caching, observability, recovery, content backup, and contributor/operator documentation for the future public site.
- **Explicitly out of scope:** extension operations. This record does not alter the extension's build, test, release, store, or browser-support procedures.
- **Decision:** operate one production static site on Cloudflare Workers Static Assets. A preview may be created only when a maintainer requests it after review begins; no always-on staging service is required. Git is authoritative for content and source. Merged `main` publishes through the trusted process defined by issue #6; the verified immutable artifact is promoted without rebuilding.
- **Runtime decision:** there is no runtime API, authentication, database, storage, admin app, price service, query service, or content-management service. The published catalog is Git-authored static Astro Content Collections content: one Category, zero or more Tags, league applicability, ordered actionable items with direct Trade URLs, and no price/cache/query data.

The deployment target is Cloudflare Workers Static Assets ([Static Assets](https://developers.cloudflare.com/workers/static-assets/)). The tracked Wrangler configuration must use an `assets.directory` binding, asset-first routing, and no `run_worker_first` unless a later product requirement creates an actual Worker request path. Configuration syntax and behavior are documented by [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/) and [Static Assets binding](https://developers.cloudflare.com/workers/static-assets/binding/).

## 2. Environments, access, and release authority

### Production

Production is the only required persistent environment. It is deployed from a reviewed merge to `main`, after the validation, artifact handoff, protected approval, and smoke checks decided by issue #6. The deployment must record the site URL, source commit, artifact identifier/checksum or content manifest, Worker version/deployment identifier, actor, timestamp, and smoke-test result.

Use a dedicated least-privilege Cloudflare API token for this site, scoped to the required Workers deployment and account/zone resources only. Do not use a personal global API key. Store the token and account identifiers that are sensitive as protected GitHub environment secrets/variables, with deployment approval enforced by the production environment. Cloudflare documents GitHub Actions integration ([Cloudflare GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)) and token creation/scoping ([API tokens](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)). Fork-triggered checks must never receive this environment or its credentials.

### Requested preview

Preview is an optional, maintainer-requested operation after review begins. It is not a required PR gate and there is no required staging service. A preview may use a temporary or explicitly named non-production Worker/environment, with separate credentials and bounded lifetime, or the existing artifact-serving mechanism selected during implementation. It must be clearly labeled non-production, must not share the production domain, and must not become an implicit source of truth. Untrusted forks remain checks-only.

### Ownership

Assign a maintainer-owned production deployment owner and at least one backup owner in the implementation documentation. Contributors own content correctness in their PR; maintainers own approval, deployment, domain/account access, incident decisions, and artifact retention. No site operation grants access to extension release credentials.

## 3. Domain, TLS, and canonical delivery

Choose and record one canonical HTTPS hostname before launch. Configure the hostname as a Cloudflare Workers Custom Domain and verify that the site responds on it ([Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)). Verify Universal SSL is active for the hostname ([Universal SSL](https://developers.cloudflare.com/ssl/edge-certificates/universal-ssl/)), then test certificate validity, redirect behavior, and the canonical host from an external client.

If an alternate hostname exists, make its redirect/canonical behavior explicit and test it; do not allow duplicate public URLs to become the documented canonical address. The deployment smoke check must verify HTTPS, expected status/content on the canonical host, representative List routes, direct Trade links, and the not-found response.

Headers must remain bounded and static-site appropriate. Define only the headers needed for baseline security, content type, referrer behavior, and crawler/caching correctness in the selected static delivery mechanism. Do not introduce Worker-first routing merely to attach headers. If a required header cannot be provided by static asset configuration, document the concrete requirement and add a Worker route only then; otherwise retain asset-first routing and no `run_worker_first`.

## 4. Deployment evidence and artifact promotion

The implementation must produce a deployment record for every production publication containing:

- source commit SHA and merged PR;
- verified build artifact name, immutable artifact ID, checksum or generated content manifest;
- Astro/Node/package-lock or equivalent toolchain identity;
- Wrangler/Worker version and deployment ID;
- Cloudflare account/environment and canonical hostname;
- approving maintainer, deployment actor, UTC timestamp, and post-deploy smoke result;
- links to validation reports, manual accessibility evidence, and failure artifacts where applicable.

The workflow must promote the one verified artifact from issue #6 and must not rebuild while deploying. Keep successful artifact evidence for the documented retention period and preserve failed-run evidence long enough to diagnose the incident. GitHub Actions workflows and artifacts are the operational handoff mechanism ([workflows](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows), [workflow artifacts](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts)).

Content publication follows the upstream rule: a content PR requires maintainer approval and automated checks; merge to `main` publishes; a revert PR rolls back the content. A revert is preferred for content-only defects because it preserves an auditable Git history. A Worker rollback is the faster recovery path for a deployment/runtime regression.

## 5. Caching and invalidation

Use immutable, hashed asset filenames produced by the static build where the toolchain supports them. Cache those assets for a long lifetime. HTML/catalog routes must have a shorter, explicitly documented cache policy so a successful publication becomes visible without broad invalidation assumptions.

Do not purge cache on every content publication. If a route remains stale after a verified deploy, purge only the affected URL(s) or narrow path set using Cloudflare's targeted purge capability ([Cache purge](https://developers.cloudflare.com/cache/how-to/purge-cache/)). Record the reason, affected paths, operator, and result. A broad purge is an incident action requiring maintainer approval, not routine delivery behavior.

## 6. Observability and incident response

Observability is proportionate to a static site:

1. Use Cloudflare Workers metrics for request volume, status/error rates, and deployment health ([metrics and analytics](https://developers.cloudflare.com/workers/observability/metrics-and-analytics/)).
2. Use targeted Worker logs or `wrangler tail` only while troubleshooting a known incident; do not make continuous verbose logging a product feature. Cloudflare's observability documentation covers the available tools ([Workers observability](https://developers.cloudflare.com/workers/observability/)).
3. Add one minimal external uptime check for the canonical homepage and one representative content route, with a conservative alert and an owner. Do not build a broad synthetic monitoring system.
4. Do not add Analytics Engine or Logpush now. Reconsider only if a future, documented retention/compliance/diagnostic need cannot be met by metrics and targeted logs.

### Incident runbook

1. Record the UTC start time, affected hostname/routes, observed symptom, current source commit, Worker version, artifact ID, and smoke/metric evidence.
2. Classify the issue as content, build/artifact, routing/domain/TLS, cache, or Worker/platform failure. Check Cloudflare metrics and targeted logs only as needed; avoid treating external Trade availability as a site outage unless the site link contract itself is broken.
3. For a deployment regression, roll back to the prior known-good Worker version first. Cloudflare documents Worker rollbacks ([rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)).
4. If the prior Worker version is unavailable or unsuitable, redeploy the retained known-good Git artifact/commit through the protected process, without rebuilding an unverified artifact.
5. For a content defect, open/review/merge a revert PR and publish it through the normal path. For stale content, use a targeted purge only after confirming the deployment and route.
6. Re-run production smoke checks, record the recovery version/artifact and result, and notify the production owner and affected maintainers.
7. After recovery, preserve logs/evidence, identify the root cause, and make a small follow-up PR for prevention if the failure exposed a missing check or documentation step.

Recovery priority is therefore: **prior Worker version, then retained known-good Git artifact/commit**. Do not use an ad hoc local build as the recovery artifact.

## 7. Git-authoritative backup and restore

The repository is the source of truth for catalog content and site configuration. Normal Git hosting is not the sole recovery assumption: create a periodic read-only mirror of the repository on an approved off-platform backup location, with access control and retention defined by the maintainers. GitHub documents repository backup/mirroring considerations ([GitHub repository backup](https://docs.github.com/en/repositories/archiving-a-github-repository/backing-up-a-repository)). Do not store Cloudflare tokens, deploy credentials, or generated secrets in the mirror.

Perform a restore drill at launch and periodically thereafter: clone the mirror into a clean environment, verify commit history and the lockfile, run the planned validation/build, identify the last known-good commit/artifact, and record the result and any gap. A mirror that has never been restored is not accepted as recovery evidence.

## 8. Documentation deliverables

At implementation time, add documentation for:

- **Contributors:** content structure, Category/Tag taxonomy references, applicability, ordered actionable items, direct Trade URL and variant rules, optional rationale/guidance, prohibited price/cache/query fields, PR approval, and revert expectations.
- **Web setup:** prerequisites, install/lockfile commands, Content Collections/schema workflow, local build/preview, deterministic validation fixtures, and how to run the checks without Cloudflare credentials.
- **Deploy/recovery:** production approval, artifact promotion, requested preview, Cloudflare environment/token boundaries, deployment evidence, smoke checks, cache purge, Worker rollback, Git-artifact recovery, and incident contacts.
- **Ownership/evidence retention:** production and backup owners, domain/account ownership, protected environment ownership, artifact/log/report retention periods, manual accessibility evidence location, mirror schedule, and restore-drill schedule.

These documents must explain that the public-site procedures do not apply to or alter extension operations. They must also identify any planned file as planned rather than implying that a currently absent site exists.

## 9. Intended future files and configuration surfaces

The following are recommended implementation surfaces, not current repository facts:

1. Replace the stale `.github/workflows/e2e.yml` with `.github/workflows/public-site.yml`; do not extend its references to absent `apps/e2e`, `packages/schema`, `packages/trade-dom`, or `packages/tokens`.
2. Create `apps/web/astro.config.*`, Content Collections schema/configuration, static-site source, and `apps/web/package.json` scripts for local setup, validation, build, preview, and deploy handoff.
3. Create a tracked `apps/web/wrangler.toml` or `wrangler.jsonc` (choose the format supported by the selected Wrangler version) with non-secret account/name/compatibility settings, `assets.directory`, asset-first routing, and no `run_worker_first` absent a documented need.
4. Create the planned content-reference/semantic validation, deterministic fixtures, production output/link checks, and Playwright/preview checks described by `docs/research/public-site-testing-ci.md`.
5. Add the contributor, web setup, deploy/recovery, and ownership/evidence documentation in the documentation location selected when the site is implemented.
6. Add deployment evidence/manifest generation and smoke-check configuration; keep Cloudflare tokens only in the protected GitHub environment, never in tracked configuration.

## 10. Non-goals and operational boundaries

- No database, API, storage, or admin-app backups.
- No runtime API monitoring, authentication operations, user/session telemetry, or price/query/cache data operations.
- No Analytics Engine, Logpush, broad log retention, or continuous verbose runtime logging without a future retention requirement.
- No required staging service or automatic preview for every PR.
- No broad cache purge as routine release behavior.
- No Worker-first request routing or custom runtime solely to add speculative headers.
- No extension deployment, browser testing, store release, or extension documentation changes.

## 11. Ordered implementation plan and acceptance criteria

1. Implement the static Astro site contract and content workflow from issues #2–#4, then replace the stale workflow with the issue #6 validation/artifact flow.
2. Establish the Cloudflare account/site ownership, least-privilege token, protected GitHub production environment, canonical hostname, Custom Domain, and Universal SSL verification.
3. Add tracked Wrangler non-secret configuration with `assets.directory`, asset-first routing, bounded headers, and no unnecessary Worker-first routing.
4. Add production evidence records, artifact retention, requested-preview controls, deployment smoke checks, and the no-rebuild promotion handoff.
5. Add metrics/log troubleshooting guidance, minimal uptime checks, targeted purge procedure, rollback runbook, and known-good artifact retention.
6. Add the contributor, setup, deploy/recovery, ownership, mirror-backup, and restore-drill documentation; perform the first restore drill and record manual accessibility/deployment evidence.
7. Execute a reviewed content PR through validation, protected publication, canonical-host smoke, and evidence retention; test a controlled rollback/recovery path.

**Acceptance criteria:** production is the only required persistent environment; requested preview is post-review and non-blocking; the canonical HTTPS domain and TLS are verified; a dedicated least-privilege token is protected from forks; tracked Wrangler settings use static asset-first delivery without speculative Worker-first routing; every deployment records commit, artifact, Worker version, approval, and smoke evidence; hashed assets and targeted purges are documented; metrics, targeted troubleshooting logs, and minimal uptime checks work without Analytics Engine/Logpush; rollback and known-good Git-artifact recovery are documented and tested; the Git mirror restore drill succeeds; contributor/setup/deploy/recovery/ownership docs exist; and extension operations remain unchanged.
