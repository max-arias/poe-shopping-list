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

1. Export a List as strict Shareable List v1 JSON.
2. Share or paste the JSON through the import flow.
3. A successful import creates an independent Personal Draft with new local IDs and all items incomplete.

## Shareable List v1 contract

Required top-level fields: `format: "poe-shopping-list"`, `version: 1`, non-empty `title`, and `items`. Optional top-level field: `overview`.

Each item requires a non-empty `title` and HTTP(S) `tradeUrl`. Optional item fields are `variant` and `note`. The object is strict: unknown fields, unsupported versions, malformed JSON, invalid URLs, and invalid field values are rejected rather than converted. The portable data contains no completion state, IDs, timestamps, account data, or synchronization metadata.

## Local state and reset

Completion is local draft state and is not included in exports. Imported Lists are independent copies; changes do not flow back to the source.

The v1 reset discards obsolete local state and format assumptions. Storage is limited to the current draft, settings, and UI-position keys; old data shapes are not accepted or restored.

## Scope exclusions

The extension does not provide accounts, server persistence, cloud sync, collaboration, analytics, recommendations, or additional portable formats.

## Acceptance status

The current source contains the v1 schemas, strict JSON import/export, local draft completion, accordion workflow, narrowed trade-page permissions, and the explicit registration modal. The registration runtime signal and its save path remain incomplete in the current implementation.

## Test strategy

The v1 contract and side-panel workflows are verified with Vitest: pure contracts run in Node and Vue side-panel components run in jsdom. Browser E2E and browser lifecycle tests are not part of release validation.
