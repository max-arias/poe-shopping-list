# Public site

The public site is a static, Git-authored Published List Catalog. It has two
routes — the Catalog at `/` and the craft notes at `/crafts/` — and no runtime
API, database, authentication, prices, or CMS. An empty Catalog is valid and
must say that no Published Lists are available; seeds, migrations, sample
content, and validation fixtures are never publication inputs.

The implementation now exists: `apps/web`, its content contract and validation
in `apps/web/src/domain`, and asset-first `apps/web/wrangler.jsonc`. Deployment
is **manual**: the CI workflow that validated, packaged, and promoted one exact
`dist` artifact was removed in `5db5b7a`, so the artifact promotion, preview,
and deployment-evidence procedures in [operations](./operations.md) are
requirements to re-establish, not implemented automation.

Cloudflare account/domain setup and protected environments are not configured
here; see [operations](./operations.md).

Read [contributing](./contributing.md), [setup](./setup.md), and
[operations](./operations.md). These procedures never change extension build,
release, store, browser-support, or credentials operations.

## Launch blockers (not configured)

Production still requires an assigned deployment owner and backup owner,
Cloudflare account access, a canonical HTTPS hostname, Custom Domain/TLS, and a
deployment process that records verified-artifact evidence. No owner, domain, or
hostname is invented in this repository. The required values, evidence gates, and
manual accessibility review are documented so maintainers can configure them
before launch.
