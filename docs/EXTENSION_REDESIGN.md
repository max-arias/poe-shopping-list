# Extension Redesign Decision Record

**Status:** Approved direction; implementation-ready, no implementation included
**Scope:** Personal Shopping Companion browser extension
**Decision sources:** [Wayfinder map #9](https://github.com/max-arias/poe-shopping-list/issues/9), [issue #10](https://github.com/max-arias/poe-shopping-list/issues/10), and [issue #11](https://github.com/max-arias/poe-shopping-list/issues/11)
**Visual reference:** [approved extension side-panel reference](design/extension-side-panel.html)

> The visual reference path above is the approved reference location: `docs/design/extension-side-panel.html`.

## Decision

Recenter the extension as a focused **Personal Shopping Companion**. It helps a player use a List, open its trade links, mark items complete, and maintain a useful local copy. It is not a build planner, pricing tool, purchase history, analytics product, or synchronized collaboration service.

Lists support three deliberate sharing contexts:

- **Manual Lists:** a person can create and edit their own List locally.
- **Public Lists:** a curator can publish a List for people to browse and import.
- **Person-to-person sharing:** a person can pass a Shareable List to another person for import.

Every imported List becomes an independent editable local copy. There is no remote identity, ownership relationship, live update, or merge path between the source and the copy.

## Approved side-panel interaction

- Show **all local Lists** in one vertical **List Accordion**; do not split the primary workflow into separate list and detail views.
- Use the approved **Soft title bands** treatment: quiet title rows, a restrained selected state, and the expanded content visually continuing from its title. The title band is the List's control.
- Selecting a title expands that List in place and collapses the other List's content.
- The List overview is collapsible, so optional free-text guidance can be shown without displacing the item workflow.
- Items are simple, title-only, clickable, reorderable rows. Clicking the row follows its trade link; a checkbox tracks completion and a drag handle signals reordering. There are no per-item Trade, edit, or copy buttons.
- The expanded List keeps the primary **Register Current Trade** action close to the item rows, without imported/status badges or completion-summary copy.

### Register Current Trade

When the active tab is a supported Path of Exile Trade search page, **Register Current Trade** captures the current trade URL for the expanded List. Before saving, it presents the captured URL and a List Item title field. The user must confirm or edit the title, then explicitly save. The action is not an automatic or silent capture.

## Shareable List contract

There is exactly one portable format: a strict, versioned **Shareable List JSON** contract. The same contract is used for public imports and person-to-person sharing; there are no separate export formats or legacy fallbacks.

The canonical version-1 shape is:

```json
{
  "format": "poe-shopping-list",
  "version": 1,
  "title": "Frostblade essentials",
  "overview": "Weapon first, then solve resistances.",
  "items": [
    {
      "title": "The Pandemonius",
      "tradeUrl": "https://www.pathofexile.com/trade/search/Settlers?q=The%20Pandemonius",
      "variant": "optional variant or qualification",
      "note": "Optional item guidance"
    }
  ]
}
```

Contract rules:

- `format`, `version`, `title`, and `items` are required; `overview` is optional.
- Each item requires `title` and `tradeUrl`; `variant` and `note` are optional.
- The contract contains no prices, price history, purchase history, completion state, generated IDs, timestamps, account data, or synchronization metadata.
- Only the supported version and defined fields are accepted. Invalid or unsupported input is rejected rather than silently converted.
- A successful import always creates a new local Personal Draft. All imported items start incomplete, regardless of any source state.
- Import is intentionally allowed to be incomplete: a List may contain only the items and guidance currently known to the sender. It must not require pricing, build metadata, or purchase records to be usable.

## Explicit exclusions

The redesign does **not** include:

- pricing, price refresh, price history, currency conversion, or purchase history;
- build-planning or build-site integration;
- accounts, server persistence, cloud sync, collaborative editing, following, or notifications;
- analytics, telemetry, trends, recommendations, or a social feed;
- multiple portable formats, migration shims, or backward compatibility with prior data shapes;
- a recovery path that preserves old behavior after a clean reset.

The reset is clean: obsolete local state and obsolete format assumptions are removed rather than maintained as compatibility surface.

## Follow-up and release plan

### Unresolved tickets

- Resolve implementation details and acceptance criteria tracked in [issue #10](https://github.com/max-arias/poe-shopping-list/issues/10).
- Resolve the remaining interaction and visual questions tracked in [issue #11](https://github.com/max-arias/poe-shopping-list/issues/11).
- Keep [Wayfinder map #9](https://github.com/max-arias/poe-shopping-list/issues/9) as the decision trail and close or update it once the implementation work is accepted.

These tickets must not broaden the approved scope without a new decision record.

### Validation next steps

1. Verify valid v1 JSON, unknown fields, unsupported versions, malformed URLs, and incomplete imports through the existing validation workflow.
2. Verify every import produces an independent local copy with all items incomplete and no source-copy updates.
3. Exercise the accordion with multiple Lists, default-collapsed overviews, selection changes, completion, row clicks, and reorder persistence.
4. Manually verify Register Current Trade on a supported trade page, including title confirmation/editing, cancel, save, and unsupported-page behavior.
5. Run accessibility and keyboard checks for title bands, item rows, reorder controls, dialogs, and focus states.

### Release next steps

1. Implement the clean-reset storage migration and the single v1 contract.
2. Implement the approved side-panel flow against the [visual reference](design/extension-side-panel.html), without adding excluded features.
3. Complete the validation above, then perform a manual release candidate pass in supported browsers.
4. Publish release notes that call out independent imports, incomplete imported items, the clean reset, and the removal of excluded legacy behavior.
