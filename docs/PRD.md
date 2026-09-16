# PoE Shopping List — Product Requirements (v1)

## Vision

A local-only browser extension for Path of Exile. Players create, use, and share shopping Lists without an account, server, or remote synchronization.

## Core flows

### Create a List

1. Open the side panel on a supported trade page.
2. Select **New List** and enter a title and optional overview.
3. The List is saved locally.

### Use a List

1. Lists appear together in one vertical accordion.
2. Select a title band to expand it and collapse other List content.
3. Expand or collapse the overview as needed.
4. Click an item row to open its trade link, use the checkbox for local completion, and reorder rows with the drag handle.

### Register Current Trade

With a supported Path of Exile Trade search active, select **Register Current Trade** for the expanded List. The extension presents the current URL and a List Item title field. The user must review or edit the title and explicitly save; registration is never silent or automatic.

### Share a List

1. Export a List as the canonical `psl1.` share code for strict Shareable List v1.
2. Send that share code, or paste a received one into the Import sheet.
3. A successful import creates an independent Personal Draft with new local IDs and all items incomplete.

## Shareable List v1 contract

Required top-level fields: `format: "poe-shopping-list"`, `version: 1`, non-empty `title`, and non-empty `groups`. Optional top-level field: `overview`. Each group holds an optional `title` and its `items`.

Each item requires a non-empty `title` and HTTP(S) `tradeUrl`. Optional item fields are `variant` and `note`. The object is strict: unknown fields, unsupported versions, malformed payloads, invalid URLs, and invalid field values are rejected rather than converted. The portable data contains no completion state, IDs, timestamps, account data, or synchronization metadata. The canonical transport is a gzip/base64url share code prefixed with `psl1.`; see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Local state and reset

Completion is local draft state and is not included in exports. Imported Lists are independent copies; changes do not flow back to the source.

The v1 reset discards obsolete local state and format assumptions. Storage is limited to `local:drafts:v1`, `local:settings:v2`, and the `local:reset:v1` marker; the obsolete keys listed in [ARCHITECTURE.md](./ARCHITECTURE.md) are deleted rather than read.

## Scope exclusions

The extension does not provide accounts, server persistence, cloud sync, collaboration, analytics, recommendations, or additional portable formats.

## Acceptance status

The current source contains the v1 schemas, strict share-code import/export, local draft completion, the accordion workflow, narrowed trade-page permissions, and the registration modal wired to the active trade page through the background hub.

The extension has not been released: `apps/extension/package.json` is `0.0.1` while the manifest is `0.1.0`, the Firefox target has not been validated, and no store metadata exists. See [STATUS.md](./STATUS.md).

## Validation

This repository intentionally has no automated test suite. Validate the v1
contract and side-panel workflows through type checking, formatting/linting,
production builds, and manual review in supported browsers. Do not add test
files, runners, dependencies, or CI without an explicit maintainer request.
