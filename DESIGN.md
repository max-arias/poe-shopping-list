---
name: PoE Shopping List
description: Browser extension for Path of Exile trade search management — compact, warm-toned, tool-first
colors:
  parchment-cream: "#fdfaf3"
  warm-ink: "#231e16"
  warm-ink-muted: "#7a6f5c"
  trade-gold: "#b07e28"
  trade-gold-edge: "#7a561a"
  trade-gold-ink: "#1a1208"
  trade-gold-ink-strong: "#7a561a"
  trade-gold-soft: "#ecd9a6"
  surface-warm: "#f2ecdd"
  surface-tab: "#f5efe0"
  chrome-bar: "#eee7d8"
  frame-dark: "#1a1610"
  stroke: "#3a3226"
  stroke-soft: "#d9cfb6"
  line-muted: "#bfb49a"
  block-fill: "#e8e0c9"
  warn-amber: "#f5dfb0"
  warn-ink: "#7a4a0f"
  warn-edge: "#c18a38"
  good-sage: "#d9e7c5"
  good-ink: "#3d5a1c"
  good-edge: "#7a9a4a"
  dark-bg: "#15110b"
  dark-frame: "#0a0804"
  dark-chrome: "#1f1a12"
  dark-surface: "#1c1810"
  dark-surface-tab: "#1a160f"
  dark-ink: "#e8dcbe"
  dark-ink-muted: "#8a7e66"
  dark-stroke-soft: "#2a2418"
  dark-line: "#4a4030"
  dark-block: "#231e14"
  dark-gold: "#c28a2a"
  dark-gold-edge: "#5a3f10"
  dark-gold-ink: "#140e04"
  dark-gold-ink-strong: "#e0b15a"
  dark-gold-soft: "#3a2a10"
  dark-warn: "#3a2810"
  dark-warn-ink: "#e0a850"
  dark-warn-edge: "#7a5a20"
  dark-good: "#1f2a14"
  dark-good-ink: "#a8c87a"
  dark-good-edge: "#4a6a2a"
typography:
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.35
  mono:
    fontFamily: "ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.35
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "10px"
    fontWeight: 500
    letterSpacing: "0.6px"
    lineHeight: 1.35
  section:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    letterSpacing: "0.6px"
    lineHeight: 1.35
  chrome-title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.2px"
    lineHeight: 1.35
rounded:
  sm: "2px"
  md: "3px"
  lg: "4px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "14px"
  xl: "20px"
components:
  button-primary:
    backgroundColor: "{colors.trade-gold}"
    textColor: "{colors.trade-gold-ink}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
  button-primary-hover:
    backgroundColor: "{colors.trade-gold-edge}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.warm-ink}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
  button-ghost-gold:
    backgroundColor: "transparent"
    textColor: "{colors.trade-gold-ink-strong}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
  pill-neutral:
    backgroundColor: "{colors.block-fill}"
    textColor: "{colors.warm-ink-muted}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  pill-gold:
    backgroundColor: "{colors.trade-gold-soft}"
    textColor: "{colors.trade-gold-ink-strong}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  input-field:
    backgroundColor: "{colors.parchment-cream}"
    textColor: "{colors.warm-ink}"
    rounded: "{rounded.sm}"
    padding: "8px 10px"
  tab-active:
    textColor: "{colors.trade-gold-ink-strong}"
    borderBottom: "2px solid {colors.trade-gold}"
  tab-inactive:
    textColor: "{colors.warm-ink-muted}"
    borderBottom: "2px solid transparent"
---

# Design System: PoE Shopping List

## 1. Overview

**Creative North Star: "The Trade Bench"**

A workbench where every tool has its place. Functional, compact, no decoration beyond what earns its keep. The PoE Shopping List sidebar sits alongside the official trade site, and it must feel like it belongs there, not like a third-party overlay fighting for attention.

The palette draws from Path of Exile's own visual language: warm parchment backgrounds, dark ink for data, and a muted gold accent reserved for actions and prices. The gold is functional, not decorative. It marks the things you click and the numbers you care about. Everything else recedes.

The system is flat by default. Depth comes from tonal layering (surface vs. background, surface-tab vs. surface), not from shadows. The only shadow in the entire interface is a subtle ambient one on the panel container itself. Buttons feel pressed into the surface rather than raised above it. States are unambiguous but never loud.

**Key Characteristics:**

- Warm parchment tones, not cool grays or clinical whites
- Trade gold accent used sparingly for actions and price data
- Flat surfaces with tonal layering for depth
- Compact density at 380px sidebar width
- Monospace for prices and data, system sans for everything else
- Sharp corners (2-3px radius), no rounded-pill shapes
- Uppercase labels with wide letter-spacing for section headers and pills
- Quiet components that recede until needed

## 2. Colors

The palette is a warm parchment spectrum with a single gold accent. Neutrals are tinted toward amber, never gray. The gold marks interactive elements and price data; everything else is ink on parchment.

### Primary

- **Trade Gold** (#b07e28 / dark: #c28a2a): The single accent color. Used for primary buttons, active tab indicators, price values, league pills, and the checkbox fill. Not decorative. If it glows, it's clickable or it's a number you need.
- **Trade Gold Edge** (#7a561a / dark: #5a3f10): The darker border for gold elements. Used on button borders, pill borders, and the checkbox border when checked. Provides definition without adding a second accent.

### Neutral

- **Parchment Cream** (#fdfaf3 / dark: #15110b): The base background. Warm, not white. In dark mode, a deep warm brown, not pure black.
- **Warm Ink** (#231e16 / dark: #e8dcbe): Primary text color. Dark brown in light mode, warm cream in dark mode. Never pure black or pure white.
- **Warm Ink Muted** (#7a6f5c / dark: #8a7e66): Secondary text, metadata, timestamps, and labels. The color of "you don't need to read this unless you're looking for it."
- **Surface Warm** (#f2ecdd / dark: #1c1810): Elevated surface for section headers, active list headers, and modal backgrounds. One tonal step above the base.
- **Surface Tab** (#f5efe0 / dark: #1a160f): Tab bar background. Slightly warmer than surface to create a subtle zone boundary.
- **Chrome Bar** (#eee7d8 / dark: #1f1a12): The top bar background. The lightest neutral surface, framing the extension identity.
- **Frame Dark** (#1a1610 / dark: #0a0804): The outer border of the panel. Near-black in both themes.
- **Stroke** (#3a3226): Strong borders and dividers. Used for the panel outer border and section dividers.
- **Stroke Soft** (#d9cfb6 / dark: #2a2418): Item row separators, input borders, subtle dividers. The workhorse border color.
- **Line Muted** (#bfb49a / dark: #4a4030): Wireframe placeholder lines and skeleton content.
- **Block Fill** (#e8e0c9 / dark: #231e14): Placeholder blocks, toggle track backgrounds, and empty-state illustrations.

### Semantic

- **Warn Amber** (#f5dfb0 / dark: #3a2810): Capture-unavailable banner background. Warm amber, not red.
- **Warn Ink** (#7a4a0f / dark: #e0a850): Warning text. Dark amber in light mode, bright amber in dark mode.
- **Warn Edge** (#c18a38 / dark: #7a5a20): Warning border.
- **Good Sage** (#d9e7c5 / dark: #1f2a14): Success/follow pill background. Muted green, not neon.
- **Good Ink** (#3d5a1c / dark: #a8c87a): Success text.
- **Good Edge** (#7a9a4a / dark: #4a6a2a): Success border.

### Named Rules

**The One Accent Rule.** Trade Gold is the only saturated color on the surface. It marks actions (buttons, active tabs) and data (prices, league pills). If something is gold, it's either clickable or it's a number the user needs. Everything else is ink or muted ink on parchment. No second accent color.

**The Warm Neutral Rule.** Every neutral is tinted toward amber. There are no cool grays, no blue-grays, no pure whites. Parchment Cream is the lightest surface; Warm Ink is the darkest text. The palette lives in the warm spectrum end to end.

## 3. Typography

**Body Font:** System sans-serif stack (ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif)
**Mono Font:** System monospace stack (ui-monospace, SF Mono, Menlo, monospace)

**Character:** Functional and unstyled. The system font stack is chosen for native feel and zero load cost, not for personality. Typography earns its place through hierarchy and spacing, not through typeface choice. Prices and numeric data use monospace for alignment and scanability.

### Hierarchy

- **Section Header** (600, 10px, 0.6px tracking, uppercase): Section labels like "DRAFT", "FOLLOWING", "NAME", "LEAGUE". Always uppercase with wide letter-spacing. The quietest heading, not the loudest.
- **Chrome Title** (600, 12px, 0.2px tracking): The "PoE Shopping List" title in the top bar. One step above body weight, same size.
- **Body** (400, 13px, 1.35 line-height): Item names, descriptions, form field text. The default. Capped at the panel width (380px), which naturally keeps lines at 40-50ch.
- **Mono/Price** (600, 12px, monospace): Price values and currency labels. Right-aligned in item rows. The weight provides emphasis; the monospace provides alignment.
- **Label** (500, 10px, 0.6px tracking, uppercase): Pills, badges, metadata. Always uppercase. The smallest text tier, used for state indicators and secondary metadata.

### Named Rules

**The Monospace-for-Data Rule.** Any number that the user compares across rows (prices, counts, totals) uses the mono font. Prose text (names, descriptions, labels) uses the system sans. Never mix them within a single text element.

## 4. Elevation

Flat by default. The system uses tonal layering, not shadows, to convey depth.

The only shadow in the entire interface is on the panel container itself: `0 2px 8px rgba(0,0,0,0.08)`. This anchors the sidebar as a physical surface sitting alongside the trade page. Everything inside the panel is flat.

Depth is conveyed through background color steps:

1. **Parchment Cream** (#fdfaf3): Base background, item rows, empty space
2. **Surface Warm** (#f2ecdd): Active list header, modal backgrounds, settings popover
3. **Surface Tab** (#f5efe0): Tab bar background
4. **Chrome Bar** (#eee7d8): Top chrome bar
5. **Block Fill** (#e8e0c9): Toggle tracks, placeholder blocks

In dark mode, the order reverses: darker = more recessed, lighter = more elevated.

### Named Rules

**The Flat-by-Default Rule.** Surfaces are flat at rest. No card shadows, no floating panels, no drop shadows on list items. The only shadow is the panel container itself. If a component needs to feel elevated, use a tonal step (surface-warm vs bg), not a shadow.

## 5. Components

### Buttons

- **Shape:** Sharp (2px radius). No rounded pills.
- **Primary (BtnGold):** Gold background (#b07e28), dark gold-ink text (#1a1208), gold-edge border (#7a561a). Inset highlight `inset 0 1px 0 rgba(255,255,255,0.15)` and bottom shadow `0 1px 0 rgba(0,0,0,0.3)`. Uppercase, 0.4px tracking. Sizes: sm (28px h), md (36px h), lg (44px h). Full-width by default.
- **Ghost (BtnGhost):** Transparent background, dashed stroke border, ink text. Used for secondary actions ("Cancel", "New list"). A gold variant uses solid gold-edge border with gold-ink-strong text for "Publish" and "Follow" CTAs.
- **Hover/Focus:** Primary buttons darken to gold-edge background. Ghost buttons get a solid border. Focus uses the gold ring (no outline, gold border shift).

### Pills / Tags

- **Shape:** 2px radius, 2px 6px padding, 10px font, 500 weight, uppercase, 0.3px tracking.
- **Neutral:** Block-fill background, ink-muted text, stroke border. Used for league badges, item counts.
- **Gold:** Gold-soft background, gold-ink-strong text, gold-edge border. Used for "DRAFT", "ACTIVE", league selector.
- **Warn:** Warn-amber background, warn-ink text, warn-edge border. Used for capture-unavailable state.
- **Good:** Good-sage background, good-ink text, good-edge border. Used for follow counts, success indicators.

### Item Rows

- **Shape:** No border-radius on the row itself. Bottom border: 1px stroke-soft.
- **Layout:** Checkbox (14px) + name (flex-1) + price (right-aligned mono) + kebab (⋯). Gap: 10px.
- **Checkbox:** 14px square, 2px radius, stroke border. Checked: gold fill with gold-edge border and ✓ in gold-ink.
- **Price:** Monospace, 12px, 600 weight, gold-ink-strong color. Currency label at 10px, 0.7 opacity.
- **Completed state:** 0.6 opacity on the entire row, name gets line-through.
- **Kebab (⋯):** Ink-muted, 14px, no background. Opens a dropdown menu.

### Inputs / Fields

- **Style:** 1px stroke border, 2px radius, parchment-cream background, 13px body text. Padding: 8px 10px.
- **Focus:** Border shifts to gold (#b07e28). No outline ring.
- **Labels:** 10px, uppercase, 0.6px tracking, ink-muted color. Positioned above the field with 4px gap.

### Navigation / Tabs

- **Tab bar:** Surface-tab background, 1px stroke bottom border. Three tabs: "My Lists", "History" (current implementation). Each tab is flex-1, 11px, 600 weight when active, 400 when inactive.
- **Active tab:** Gold-ink-strong text, 2px gold bottom border.
- **Inactive tab:** Ink-muted text, 2px transparent bottom border. Hover: ink text.
- **Chrome bar:** 32px height, chrome-bar background, frame-dark bottom border. Contains: gold square icon (14px), "PoE Shopping List" title (12px, 600), league pill, settings gear icon.

### Modals / Bottom Sheets

- **Overlay:** `rgba(0,0,0,0.5)` backdrop.
- **Sheet:** Full-width bottom sheet with 2px gold top border. Surface-warm background. Padding: 14px. Gap between fields: 12px.
- **Close:** ✕ in ink-muted, top-right.
- **No rounded corners on the sheet itself.** The gold top border is the only decoration.

### Settings Popover

- **Shape:** 260px wide, surface-warm background, 1px stroke border, 3px radius, heavy shadow `0 8px 28px rgba(0,0,0,0.22)`.
- **Toggle switches:** 26px × 14px track, 10px circle knob. On: gold track, off: block-fill track.

## 6. Do's and Don'ts

### Do:

- **Do** use Trade Gold exclusively for interactive elements and price data. If it's gold, it's either clickable or it's a number the user needs.
- **Do** use tonal layering (surface-warm vs. parchment-cream) to create depth without shadows.
- **Do** use monospace for all numeric data that users compare across rows (prices, counts, totals).
- **Do** keep the sidebar at 380px width. Density is a feature.
- **Do** use uppercase labels with wide letter-spacing (0.6px) for section headers, field labels, and pills.
- **Do** use the warm neutral palette end to end. Every surface, every text color, every border is tinted toward amber.
- **Do** make the gold accent functional, not decorative. It marks actions and data, not decoration.
- **Do** use 2-3px border radius everywhere. Sharp corners, not rounded.
- **Do** let components recede until the user needs them. The content (items, prices, names) is the star.

### Don't:

- **Don't** use border-left or border-right greater than 1px as a colored accent stripe on cards or list items. The gold accent belongs on buttons, prices, and active states, not on side stripes.
- **Don't** use gradient text (`background-clip: text` with a gradient). Prices are solid gold-ink-strong, not gradient.
- **Don't** use glassmorphism (blur + transparency) as a default. The capture-unavailable banner uses a solid warn-amber background, not a frosted glass effect.
- **Don't** create hero-metric templates (big number, small label, gradient accent). Price displays are inline and monospace, not dashboard KPIs.
- **Don't** use identical card grids. Item rows are flat list items with a bottom border, not cards in a grid.
- **Don't** use modals as the first response. The save-search flow uses a bottom sheet because it's a continuation of the sidebar workflow, not an interruption. Inline states are preferred over modal interruptions.
- **Don't** use cool grays, blue-grays, or pure whites/blacks. Every neutral is warm-tinted.
- **Don't** add rounded-pill shapes (radius > 4px). The system is sharp and compact.
- **Don't** use celebration animations, confetti, progress bars with animations, or achievement badges. The extension is a tool, not a game.