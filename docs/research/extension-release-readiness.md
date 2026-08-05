# Issue #15 — extension release decision record

Decision record, updated 2026-07-30. This note is implementation guidance, not a store submission.

## 1. Scope and decision

- **In scope:** Chrome Web Store (CWS) and Firefox Add-ons (AMO) releases.
- **Explicitly out of scope:** Safari distribution.
- **Decision:** ship two target-specific WebExtension builds from the shared WXT/Vue codebase. Share the side-panel UI and domain logic where possible. Use WXT's native side-panel entrypoint for target-specific manifest generation, while keeping runtime panel control explicit per browser.
- **Hard gate:** no AMO shipment until Firefox-target manifest generation, runtime behavior, packaging, signing, and manual browser review pass. WXT's command reference documents `wxt zip` and `wxt zip -b firefox`: [WXT commands](https://wxt.dev/api/cli/wxt).

## 2. Current state retained

- WXT/Vue is configured in `apps/extension/wxt.config.ts`; root and extension scripts provide build, ZIP, check, and typecheck commands. No publish/release script exists.
- Versioning is inconsistent: package version `0.0.1` versus manifest version `0.1.0` (`apps/extension/package.json:2-4`, `apps/extension/wxt.config.ts:12-16`). This must be resolved before release.
- `apps/extension/src/entrypoints/sidepanel.html` is the existing WXT native cross-browser side-panel entrypoint (`apps/extension/src/entrypoints/sidepanel.html:1-66`). The current config additionally hard-codes Chrome `sidePanel`/`side_panel` values and the two Path of Exile trade host patterns (`apps/extension/wxt.config.ts:12-35`); the content script matches those hosts and reports URL/title only (`apps/extension/src/entrypoints/trade.content.ts:3-17`).
- Drafts/settings use WXT local storage; product documentation states no account, server, cloud sync, analytics, or remote synchronization (`apps/extension/src/types/storage.ts:3-32`, `docs/ARCHITECTURE.md:3-5`, `docs/PRD.md:44-46`). Privacy copy and disclosures still need verification against final behavior.
- No store metadata, privacy policy, release checklist, archive assertion, or release workflow is tracked. The existing workflow only builds and attempts E2E under paths that are absent from the current tree (`.github/workflows/e2e.yml:1-55`). No store release has been submitted (`STATUS.md:25-27`, `docs/ARCHITECTURE.md:63-65`).
- The documented Register Current Trade runtime URL/save path remains incomplete (`docs/ARCHITECTURE.md:50-52`, `docs/PRD.md:48-50`). Manual release review must cover the contract, side-panel workflows, browser lifecycle, and release artifacts.

## 3. Firefox compatibility gate

**Requirement:** the current Chrome-only runtime `sidePanel` API cannot be used in Firefox as-is. WXT already abstracts the manifest side: the existing `sidepanel.html` entrypoint drives Chrome `side_panel` plus `sidePanel` permission and Firefox `sidebar_action` output. This is documented by [WXT side-panel entrypoints](https://wxt.dev/guide/essentials/entrypoints#side-panel) and WXT's [manifest generation source](https://github.com/wxt-dev/wxt/blob/main/packages/wxt/src/core/utils/manifest.ts). The future implementation should remove the manually hard-coded Chrome-only `sidePanel`/`side_panel` values from `apps/extension/wxt.config.ts` and let the entrypoint drive that browser-specific output. HTML metadata should be added only when needed for supported WXT options such as title, icon, or open-at-install behavior.

Runtime control is not abstracted by WXT. `apps/extension/src/entrypoints/background.ts` must use explicit target selection with `import.meta.env.CHROME` / `import.meta.env.FIREFOX`: Chrome uses `chrome.sidePanel`, while Firefox uses `browser.sidebarAction` ([MDN Chrome incompatibilities — sidebar API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Chrome_incompatibilities#sidebar_api), [WXT environment variables](https://github.com/wxt-dev/wxt/blob/main/docs/guide/essentials/config/environment-variables.md)). Firefox's action-click/open semantics do not duplicate Chrome's `sidePanel.open` flow, so the product UX choice must be tested before shipment ([MDN sidebarAction API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/sidebarAction)).

**Required implementation decisions:**

1. Select the build target explicitly and generate/inspect separate Chrome and Firefox manifests. Remove the manually hard-coded Chrome sidebar manifest values; use the WXT side-panel entrypoint and only add appropriate HTML metadata if required.
2. Keep shared UI, storage, message contracts, and trade-page logic where possible; isolate only the target-specific background/sidebar runtime adapter.
3. Define and manually verify Firefox action-click/sidebar opening behavior. Firefox's action behavior does not duplicate Chrome's `sidePanel.open` flow; the UX choice (open/toggle sidebar, enable only on trade pages, or another supported flow) must be documented and pass a manual browser gate.
4. Inspect generated manifests for both targets and run the built extension in Chrome and Firefox before AMO shipment. A Chrome-only build passing is insufficient.

## 4. Build and package requirements

**Requirements:**

- Produce and archive a Chrome MV3 ZIP with `wxt zip` and a Firefox-target ZIP with `wxt zip -b firefox` ([WXT commands](https://wxt.dev/api/cli/wxt)).
- Inspect each ZIP's generated manifest, version, permissions, host permissions, icons, entrypoints, and target-specific sidebar keys. Reject a package containing the wrong target key/API assumptions.
- Produce the Firefox source/reviewer package required by AMO review, including the exact source/build instructions and dependency lockfile; confirm its contents against the submitted XPI/ZIP.
- Do not treat ignored local `.output/` or archive files as release evidence (`.gitignore:6-19`); CI must upload immutable, versioned artifacts.

**Recommendation:** add target-specific package scripts and a manifest inspection script rather than relying on ad hoc local commands.

## 5. Versioning, identities, signing, and distribution

**Requirements:**

- Choose one release version and use it in `apps/extension/package.json`, generated Chrome manifest, generated Firefox manifest, filenames, release notes, and store submissions. The current `0.0.1`/`0.1.0` mismatch is a blocker.
- Maintain two stable identities: the Chrome extension identity/listing and a Firefox `browser_specific_settings.gecko.id` stable ID. Do not reuse a target-specific identity accidentally or change the Firefox ID after AMO publication ([MDN browser-specific settings](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings)).
- CWS distribution requires a manually created listing initially; WXT documents `wxt submit` for subsequent automation ([WXT submit](https://wxt.dev/api/cli/wxt)). AMO distribution requires AMO signing/review and the target-specific reviewer materials; the AMO developer workflow is documented at [Extension Workshop — publish](https://extensionworkshop.com/documentation/publish/).

**Recommendation:** keep signing credentials outside the repository, use protected CI secrets, and promote exactly the tested archives rather than rebuilding during upload.

## 6. Store listing and privacy metadata

**Requirements for both stores:** provide name, description, icons, screenshots/promotional assets as applicable, support/contact information, versioned release notes, target-specific permissions rationale, and accurate data/privacy disclosures. Store copy must be checked against the final implementation, not only the PRD.

**CWS:** complete the listing and privacy practices/data-use declarations in the Chrome Web Store dashboard; see [CWS publish documentation](https://developer.chrome.com/docs/webstore/publish). Explain the narrowly scoped trade-host access, local storage, and user-triggered navigation/registration behavior.

**AMO:** provide the AMO listing, reviewer/source materials, Firefox-specific manifest identity, permissions explanations, and privacy policy/disclosures where requested; see [AMO publish documentation](https://extensionworkshop.com/documentation/publish/).

The intended product position is local-only, with no accounts/sync/analytics (`README.md:1-12`, `docs/PRD.md:44-46`), but **privacy copy and disclosures must be verified against final runtime behavior**, including any URLs/title data read from trade pages and any future changes.

## 7. Manual release workflow and rollback

**Required workflow:**

1. Run typecheck, lint/format checks, and target builds.
2. Generate both target packages and inspect their manifests.
3. Archive immutable Chrome ZIP, Firefox ZIP/XPI/source review package, manifests, checksums, and release notes.
4. A manual release approval promotes the exact archived artifacts to CWS and AMO; initial CWS listing creation and AMO review remain store operations, not assumed CI success.
5. After publication, install each store build in its target browser and verify action/sidebar opening, trade-page gating, local persistence, import/export, and Register Current Trade behavior.

**Browser gates:** Manually verify Chrome `side_panel`/`chrome.sidePanel`; Firefox `sidebar_action`/`browser.sidebarAction`, action-click behavior, and no Chrome-only manifest/API failure.

**Rollback requirement:** retain the prior known-good artifacts and manifest/checksum records; define the unpublish/roll-forward path for each store and document the version to restore. Do not delete archived artifacts.

## 8. Ordered implementation plan and acceptance criteria

1. Resolve version and identity decisions; add explicit Chrome/Firefox target selection.
2. Remove hard-coded Chrome sidebar manifest values, verify WXT-generated target manifests, and implement the `import.meta.env.CHROME` / `import.meta.env.FIREFOX` runtime sidebar adapter while preserving shared UI and logic.
3. Complete and manually verify Firefox action/sidebar UX, then resolve the documented Register Current Trade runtime gap.
4. Add package, generated-manifest, checksum, and browser smoke-check documentation as needed.
5. Add store listing/privacy/reviewer materials and a protected manual approval workflow.
6. Build, inspect, archive, manually install/review, and submit the exact artifacts; record rollback details.

**Release is accepted only when:** one agreed version is present everywhere; Chrome and Firefox generated manifests have been inspected and contain their correct identity, permissions, sidebar keys, and entrypoints; Chrome ZIP and Firefox ZIP/source package are reproducible/archived; manual browser review covers Chrome `sidePanel` and Firefox `sidebarAction` behavior; local-only/privacy statements match final behavior; CWS and AMO metadata/reviewer materials are complete; and prior artifacts plus rollback instructions are recorded. Safari is not an acceptance target.
