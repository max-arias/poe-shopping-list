# Public site

The public site is a static, Git-authored Published List Catalog. V1 has one
Catalog route and no runtime API, database, authentication, prices, or CMS.
An empty Catalog is valid and must say that no Published Lists are available;
seeds, migrations, sample content, and validation fixtures are never publication
inputs.

The implementation and publication surfaces now exist: `apps/web`,
`.github/workflows/public-site.yml`, and asset-first `apps/web/wrangler.jsonc`.
The workflow validates and packages one exact `dist` artifact on trusted `main`,
and promotes that artifact without rebuilding. It
also supports a maintainer-requested preview from a successful trusted main
validation job. Cloudflare account/domain setup and the
protected environments are not configured here; see [operations](./operations.md).

Read [contributing](./contributing.md), [setup](./setup.md), and
[operations](./operations.md). These procedures never change extension build,
release, store, browser-support, or credentials operations.

## Launch blockers (not configured)

Production still requires an assigned deployment owner and backup owner,
Cloudflare account access, a canonical HTTPS hostname, Custom Domain/TLS, and
protected GitHub environment values. No owner, domain, or hostname is invented
in this repository. The required secret/variable names and evidence gates are
documented so maintainers can configure them before launch.
