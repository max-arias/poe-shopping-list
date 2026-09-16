# PoE Shopping List — Implementation Status

Last updated: 2026-09-16, verified against `main` at `059c446`.

## Surfaces

The repository holds three shipped surfaces and the shared contract they agree on.

| Surface           | Location                  | Role                                                                 |
| ----------------- | ------------------------- | -------------------------------------------------------------------- |
| Browser extension | `apps/extension`          | Local-only WXT/Vue side panel: create, edit, use, and complete Lists |
| Portable contract | `packages/shareable-list` | The one strict v1 Shareable List schema and its `psl1.` transport    |
| Static catalog    | `apps/web`                | Astro static site: Published List Catalog and craft notes            |

## Extension

| Area                   | Status  | Notes                                                                                              |
| ---------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| Draft storage          | Shipped | `local:drafts:v1`; the v1 reset deletes obsolete keys and never reads old shapes                   |
| List CRUD              | Shipped | Create, rename, delete, optional overview, optional icon or color appearance                       |
| Items and groups       | Shipped | Root items plus titled groups, drag reorder, move items between groups                             |
| Local completion       | Shipped | Stored per item on the Draft; never exported                                                       |
| Accordion side panel   | Shipped | One List collection; selecting a title band expands that List and collapses the others             |
| Import and export      | Shipped | Strict Shareable List v1 share code (`psl1.`), new local IDs, every imported item incomplete       |
| Register Current Trade | Shipped | Reads the active trade page through the background hub and requires title confirmation             |
| Trade-page scope       | Shipped | Side panel enabled only on `pathofexile.com/trade/*`; the content script reports URL and item name |
| Settings               | Shipped | `openItemsInNewTab`, stored under `local:settings:v2`                                              |

## Static catalog

| Area              | Status  | Notes                                                                           |
| ----------------- | ------- | ------------------------------------------------------------------------------- |
| Catalog route     | Shipped | `/` renders Published List Cards with per-list Download and Copy share codes    |
| Craft notes route | Shipped | `/crafts/`                                                                      |
| Content contract  | Shipped | `publishedListSchema`: flat `items` or titled `groups`, strict Trade URL shape  |
| Taxonomy          | Shipped | Categories and tags in `apps/web/src/domain/taxonomy.ts`                        |
| Validation        | Shipped | `content:validate`, Astro build-hook validation, route, link, and output checks |
| Published content | 3 Lists | `cws-chieftain`, `manyshot-mercenary`, `rf-essentials`                          |
| Deployment        | Manual  | Wrangler static-assets config; the CI workflow was removed in `5db5b7a`         |

## Not implemented

- Browser-store release. `apps/extension/package.json` is `0.0.1` while the manifest is
  `0.1.0`; there is no Firefox target validation, store metadata, or packaging evidence.
- Better Trading export import (issues #25–#27).
- Mercenary archetype coverage beyond the single Manyshot list (issue #24).
- Contributor Issue Form intake (issues #17–#21).
- Automated tests. The repository has no test suite by policy; see `AGENTS.md`.

## Validation

Validate extension changes with `vp run ext:typecheck`, `vp run ext:check`, and
`vp run ext:build`, then review the built panel in a supported browser. Validate
catalog changes with the commands in [`docs/public-site/setup.md`](docs/public-site/setup.md).
No release has been submitted to either browser store.
