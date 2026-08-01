# Issue #6 — public-site testing and CI decision record

Decision record, updated 2026-07-30. This note resolves the public-site testing and delivery question; it is implementation guidance, not an implementation.

## 1. Scope and decision

- **In scope:** the future `apps/web` static Astro public site, its content catalog, pull-request validation, maintainer-requested previews, trusted deployment, and post-deployment smoke checks.
- **Explicitly out of scope:** browser E2E for the extension, a runtime API/auth/database, testing a nonexistent `apps/web`, and making a preview a required pull-request gate. Existing extension tests remain separate Vitest Node/jsdom coverage. Browser testing here is only for the future static public site.
- **Decision:** use risk-based validation: deterministic catalog/schema and semantic checks first, focused logic tests where logic exists, a production Astro build with link checks, a small browser integration suite against `astro preview`, limited axe checks, explicit manual accessibility review, and a deployment smoke check. Use one verified build artifact for deployment; do not rebuild during promotion.
- **Preview decision:** after a maintainer has begun review, a maintainer may request a preview. Preview is not automatic and is not a required PR gate. Untrusted forks run checks-only and must never receive Cloudflare credentials or deployment permissions.
- **Delivery decision:** a reviewed PR merged to `main` publishes the verified artifact through a trusted GitHub Actions environment. Reversion of the content commit rolls back the published catalog; retain the prior artifact for recovery.

The site is fully static Astro Content Collections content deployed with Cloudflare Workers Static Assets, as resolved by issues #2–#4. Astro collections validate entries with Zod ([Content Collections](https://docs.astro.build/en/guides/content-collections/)); Workers Static Assets serves the static output ([Cloudflare documentation](https://developers.cloudflare.com/workers/static-assets/)). There is therefore no runtime service or API test target.

## 2. Product invariants and deterministic fixtures

The test catalog must be small, committed, deterministic, and representative of the content contract from issue #2. It must include at least one valid published List with:

- exactly one primary Category;
- zero and multiple Tags represented across fixtures, with every submitted category/tag slug resolving against canonical taxonomy data;
- explicit Path of Exile game and league applicability;
- a publication that receives an automatically generated last-reviewed timestamp;
- flat, ordered, actionable items;
- each item containing a direct PoE Trade URL and quantity/variant, with rationale and qualitative free-text guidance exercised as optional fields.

Fixtures must also include invalid cases for missing or unresolved taxonomy references, missing applicability, malformed trade URLs, empty or reordered actionable items, invalid quantities/variants, and an author-supplied last-reviewed value that must not bypass the publication rule. Assertions must verify that no query-data, cache, or price fields are accepted or emitted. They should verify ordering explicitly rather than relying on filesystem or collection enumeration order.

Dynamic collection routes must use `getStaticPaths`, and collection ordering must use an explicit sort ([Astro route generation and ordering guidance](https://docs.astro.build/en/guides/content-collections/#generating-routes-from-content)). These are correctness checks, not assumptions encoded in a browser test.

## 3. Test layers and risk controls

### 3.1 Schema and semantic validation

Run Astro collection/schema validation and a repository-owned content-reference validator. `astro sync` generates collection types; `astro check` is intended for CI; `astro build` produces the production site ([Astro CLI reference](https://docs.astro.build/en/reference/cli-reference/)). The semantic validator must load canonical taxonomy data, resolve all submitted slugs, enforce issue #2 invariants, reject forbidden fields, and test timestamp behavior without depending on wall-clock output. It must fail closed on malformed content and produce actionable file/field errors.

### 3.2 Focused logic tests

Where catalog transforms, sorting, URL construction, timestamp normalization, or reference validation are implemented, test those functions directly with the deterministic fixtures. These tests are not a substitute for schema validation or rendered-site checks, and no extension test suite is to be moved into this layer.

### 3.3 Production build and link checks

Run `astro sync`, `astro check`, and a clean production `astro build`. Inspect the generated output for expected routes and links, then run an internal-link checker over the built static output. Check direct PoE Trade URLs as link targets without treating external availability or price data as a site runtime dependency; the contract is that each actionable item contains the direct URL.

The build must be deterministic enough to compare route/content manifests. Any generated timestamp must be normalized or asserted by format and provenance, not compared as an exact current time.

### 3.4 Browser integration against `astro preview`

Start the built site with `astro preview`, configure Playwright `webServer` and `baseURL`, and exercise only high-value static journeys: catalog landing/navigation, category/tag filtering or links if present, a List route, ordered actionable items, direct trade links, and a not-found route. Playwright documents this `webServer`/`baseURL` integration ([Playwright webServer](https://playwright.dev/docs/test-webserver)).

This is a static-site integration test, not a deployment test and not an extension browser suite. Avoid asserting incidental markup or visual styling. Upload the preview server log, Playwright report, screenshots, and traces on failure.

### 3.5 Accessibility

Run a limited axe scan on representative landing, catalog, and detail pages. Treat axe as a defect detector, not proof of accessibility: Playwright explicitly documents the limits of automated accessibility testing ([Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing)). A maintainer must manually review keyboard traversal, visible focus, headings/landmarks, link names, zoom/reflow, color/contrast in context, and the actionable-item/trade-link experience before the first public launch and after material template changes. Record that review with the CI/release evidence.

### 3.6 Deployment smoke

After trusted publication, request the deployed site URL and verify representative landing, List, taxonomy, direct-link, and not-found responses. Confirm the deployed route/content manifest matches the verified build artifact. Deployment smoke must not silently turn an untrusted PR into a deployment.

## 4. CI design: PR validation versus trusted deployment

### Pull requests

For same-repository PRs and untrusted forks, run checks-only validation with no Cloudflare secrets: install from the lockfile, validate content references and schema, run focused tests, build once, run link checks, serve that build with `astro preview`, run Playwright and limited axe checks, and upload reports/logs/artifacts on failure. The PR workflow must not publish, use protected deployment environments, or execute fork-controlled code with deployment credentials.

Maintainer-requested preview is a separate, explicit operation after review begins. It may use a trusted workflow/environment and the already verified build artifact, or a separately labeled/requested preview run with the same checks. Its URL and lifetime must be visible in the workflow result; preview availability is informative and never blocks an otherwise valid PR.

### Merge and publication

The trusted path runs for the reviewed `main` commit, repeats the required validation in a trusted context, and uploads exactly one immutable, versioned static-site artifact. Deployment consumes that artifact, not a fresh build. Protect the deployment environment with required reviewers and keep Cloudflare API credentials in protected GitHub environment secrets; do not expose them to fork workflows. GitHub environments provide deployment protections and secrets ([GitHub environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)).

The implementation should use GitHub Actions workflow jobs and artifacts for explicit handoff and retention ([workflow concepts](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows), [workflow artifacts](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts)). Cloudflare's Wrangler commands support local development, dry runs, and strict validation ([Wrangler Workers commands](https://developers.cloudflare.com/workers/wrangler/commands/workers/)); use those checks in the trusted deployment path as appropriate, without replacing the production build or smoke test.

The stale `.github/workflows/e2e.yml` references absent `apps/e2e`, `packages/schema`, `packages/trade-dom`, and `packages/tokens`. When the web implementation starts, replace it rather than extend it. Do not claim any of the following files or dependencies exist today.

## 5. Exact implementation surfaces to create

At implementation time, create or update only the following intended surfaces, with names finalized to match the actual Astro setup:

1. **Workflow:** replace `.github/workflows/e2e.yml` with `.github/workflows/public-site.yml`, containing separate checks/preview/deploy jobs, fork-safe conditions, artifact upload-on-failure, and the trusted deployment environment.
2. **Web package scripts:** create `apps/web/package.json` scripts for collection sync, check, production build, preview, link checks, focused tests, and Playwright/axe checks. Do not add scripts for tools that are not selected and installed by the web implementation.
3. **Astro configuration:** create `apps/web/astro.config.*` and the Content Collections schema/configuration under the location selected by the Astro version. Configure the static output and Workers Static Assets integration there, rather than inventing a runtime API.
4. **Validation and test code:** create the catalog semantic/reference validator, deterministic fixtures, focused tests, built-output link-check configuration/script, and Playwright configuration/tests under `apps/web` (or the repository's chosen web test directories), including `astro preview` `webServer`/`baseURL` settings.
5. **Deployment configuration:** create the Workers/Wrangler configuration required by the selected Cloudflare Static Assets deployment, with environment names and non-secret settings tracked; keep tokens and account credentials only in protected GitHub environment secrets.
6. **Evidence configuration:** define artifact names/retention and failure uploads for build output, validation reports, link reports, Playwright HTML report/screenshots/traces, axe results, logs, checksums or content manifest, and deployment smoke results.

These surfaces are a target inventory for implementation, not evidence that the files or dependencies currently exist.

## 6. Risks, rollback, and non-goals

- **Content contract drift:** schema-only validation could accept unresolved taxonomy or forbidden data. Mandatory semantic/reference checks and invalid fixtures mitigate this.
- **Static route omissions/order drift:** explicit `getStaticPaths`, sort assertions, built-output route manifests, and browser navigation checks mitigate this.
- **False accessibility confidence:** limited axe coverage is paired with recorded manual review.
- **Artifact mismatch:** one immutable artifact, checksums/content manifest, and no rebuild during deploy prevent promotion of untested output.
- **Credential exposure:** fork-safe checks-only jobs and a protected GitHub environment prevent Cloudflare secrets entering untrusted execution.
- **Deployment regression:** post-deploy smoke and retained prior artifacts support rollback. Revert the offending content commit and redeploy the previous known-good artifact when necessary; do not delete evidence.

Non-goals are server/API contract tests, authenticated-user flows, price/cache verification, extension browser automation, pixel-perfect visual regression, and guaranteed external PoE Trade availability.

## 7. Ordered implementation sequence and acceptance criteria

1. Implement the Astro static site and issue #2 content schema, canonical taxonomy references, deterministic fixtures, and semantic validator.
2. Add focused logic tests, explicit route generation/sorting, and built-output link checks; replace the stale workflow rather than extending it.
3. Add the production build artifact workflow, `astro preview` Playwright integration, limited axe checks, failure artifacts, and the documented manual accessibility review gate.
4. Add fork-safe maintainer-requested preview behavior without making preview a PR gate.
5. Add protected trusted deployment, Wrangler validation, artifact promotion without rebuild, deployment smoke, retention, and rollback evidence.
6. Run the complete path on a reviewed content PR, merge to `main`, and record the manual accessibility and deployment results.

**Acceptance criteria:** a valid deterministic catalog passes schema and semantic/reference checks; invalid and forbidden-field fixtures fail; `astro sync`, `astro check`, production build, route/order assertions, and link checks pass; representative pages pass Playwright and limited axe checks with manual accessibility review recorded; PRs and untrusted forks cannot access Cloudflare credentials; preview is maintainer-requested after review and non-blocking; `main` deploys exactly the verified artifact through a protected environment; deployment smoke passes; failure evidence and a prior artifact/rollback path are retained.
