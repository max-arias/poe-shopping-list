# PoE Shopping List — Implementation Status

Last updated: 2026-07-29

## v1 reset

The extension now targets a clean, local-only v1 model. Obsolete local data assumptions are not migrated. The only portable format is strict Shareable List v1 JSON; invalid or unsupported input is rejected.

## Current implementation

| Area | Status | Notes |
| --- | --- | --- |
| Local draft storage | ✅ | Drafts, settings, and current UI state use local storage |
| Shareable List v1 | ✅ | Strict JSON fields and rejection behavior are implemented |
| Independent imports | ✅ | New local IDs; imported items start incomplete |
| Local completion | ✅ | Completion is stored on the local Draft and is not exported |
| Accordion side panel | ✅ | One List collection; selected content expands in place |
| Register Current Trade | ✅ | Confirms the active supported Trade URL, accepts an editable title, and saves an incomplete local item |
| Trade-page scope | ✅ | Side panel and content script are limited to Path of Exile Trade hosts |

## Validation

The repository intentionally has no automated test suite. Use type checking,
formatting/lint checks, production builds, and the static public-site checks
where applicable. Browser-store release has not been submitted.

## Release

The current manifest version is `0.1.0`. A Chrome Web Store release has not been submitted.
