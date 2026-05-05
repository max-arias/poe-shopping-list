---
name: PoE Shopping List
description: Browser extension for Path of Exile trade search management — dark-first, PoE-authentic palette, tool-first
colors:
  void-black: "#0D0B0E"
  dungeon-stone: "#2A2520"
  ash-grey: "#504840"
  bone: "#8C7B6A"
  pale-fog: "#C4B8A8"
  linen-white: "#F5F2EE"
  parchment: "#E8E0D5"
  aged-stone: "#CFC4B4"
  warm-grey: "#9E8E7A"
  dark-ink: "#4A4038"
  accent: "#AF6025"
  accent-edge: "#7A3F15"
  accent-ink: "#FFFFFF"
  accent-ink-strong: "#D4956A"
  accent-soft: "#3A2010"
  surface: "#1A1714"
  surface-tab: "#181510"
  chrome: "#2A2520"
  frame: "#080608"
  stroke-soft: "#3A3430"
  block: "#2A2520"
  warn: "#3A2010"
  warn-ink: "#E89070"
  warn-edge: "#7A4A20"
  good: "#1A2A24"
  good-ink: "#6EC4BE"
  good-edge: "#3A6A5A"
  error: "#2A1010"
  error-ink: "#E8A0A0"
  error-edge: "#7A3030"
  info: "#102030"
  info-ink: "#90C4DF"
  info-edge: "#3A5A7A"
  rarity-normal: "#C8C8C8"
  rarity-magic: "#8888FF"
  rarity-rare: "#FFFF77"
  rarity-unique: "#AF6025"
  rarity-skill: "#1BA29B"
  rarity-currency: "#AA9E82"
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
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
  button-primary-hover:
    backgroundColor: "{colors.accent-edge}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.dark-ink}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
  button-ghost-accent:
    backgroundColor: "transparent"
    textColor: "{colors.accent-ink-strong}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
  pill-neutral:
    backgroundColor: "{colors.block}"
    textColor: "{colors.warm-grey}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  pill-accent:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-ink-strong}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  input-field:
    backgroundColor: "{colors.linen-white}"
    textColor: "{colors.dark-ink}"
    rounded: "{rounded.sm}"
    padding: "8px 10px"
  tab-active:
    textColor: "{colors.accent-ink-strong}"
    borderBottom: "2px solid {colors.accent}"
  tab-inactive:
    textColor: "{colors.warm-grey}"
    borderBottom: "2px solid transparent"
---

# Design System: PoE Shopping List

## 1. Overview

**Creative North Star: "The Trade Bench"**

A workbench where every tool has its place. Functional, compact, no decoration beyond what earns its keep. The PoE Shopping List sidebar sits alongside the official trade site, and it must feel like it belongs there, not like a third-party overlay fighting for attention.

The palette is drawn directly from Path of Exile's own visual language. Dark mode uses the Void black and Dungeon stone foundations, with Unique amber as the single accent color. Light mode uses Linen white and Parchment, the same warm tones that echo PoE's trade site. The accent marks interactive elements and price data; everything else recedes.

The system is flat by default. Depth comes from tonal layering (surface vs. background, surface-tab vs. surface), not from shadows. The only shadow in the entire interface is a subtle ambient one on the panel container itself. Buttons feel pressed into the surface rather than raised above it. States are unambiguous but never loud.

**Key Characteristics:**

- PoE-authentic palette: Void black, Dungeon stone, Unique amber, Pale fog text
- Single accent color (Unique amber) used sparingly for actions and price data
- Flat surfaces with tonal layering for depth
- Compact density at 380px sidebar width
- Monospace for prices and data, system sans for everything else
- Sharp corners (2-3px radius), no rounded-pill shapes
- Uppercase labels with wide letter-spacing for section headers and pills
- Quiet components that recede until needed
- PoE rarity colors available for semantic states (Skill gem teal for success, Molten terracotta for warnings, Blood rose for errors, Cold sky blue for info)

## 2. Colors

The palette is split between dark and light themes, both drawn from Path of Exile's visual language. Dark is the primary theme (matching the trade site); light is a warm parchment alternative.

### Dark Theme (Primary)

- **Void Black** (#0D0B0E): Base background. The deepest surface. Not pure black; a hint of warmth prevents it from feeling sterile.
- **Dungeon Stone** (#2A2520): Chrome bar, block fills, elevated surfaces. The color of Wraeclast's walls.
- **Ash Grey** (#504840): Strong borders, dividers, and stroke lines. Warm grey with enough contrast to define edges.
- **Bone** (#8C7B6A): Muted text, metadata, timestamps. The color of "you don't need to read this unless you're looking for it."
- **Pale Fog** (#C4B8A8): Primary text. Warm cream on dark backgrounds. Never pure white.

### Light Theme

- **Linen White** (#F5F2EE): Base background. Warm, not clinical. The lightest surface.
- **Parchment** (#E8E0D5): Elevated surfaces, chrome bar, block fills. Aged paper.
- **Aged Stone** (#CFC4B4): Borders, dividers, stroke lines. Warm stone.
- **Warm Grey** (#9E8E7A): Muted text, metadata. The light-theme counterpart to Bone.
- **Dark Ink** (#4A4038): Primary text. Warm dark brown, never pure black.

### Accent

- **Unique** (#AF6025): The single accent color, taken directly from PoE's Unique item rarity. Used for primary buttons, active tab indicators, price values, league pills, and the checkbox fill. Not decorative. If it's amber, it's either clickable or it's a number you need.
- **Unique Edge** (#7A3F15): The darker border for accent elements. Provides definition without adding a second accent.
- **Unique Soft** (#3A2010 dark / #F0DDD0 light): Muted accent background for pills, badges, and toggle tracks. The accent at rest, not at action.

### Semantic (Atmosphere Mapping)

PoE's atmosphere colors mapped to UI semantic roles:

- **Molten** (warn): Terracotta orange. Capture-unavailable banners, validation warnings. Not red; PoE's danger is fire, not blood.
- **Skill Gem** (good): Mint teal. Success states, follow confirmations, completed items. Cool and distinct from the amber accent.
- **Blood** (error): Rose red. Destructive actions, delete confirmations, validation errors. Used sparingly.
- **Cold** (info): Sky blue. Links, informational states, secondary actions.

### Rarity (Available for Item Kind Display)

- **Normal** (#C8C8C8 dark / #DCDCDC light): Common items
- **Magic** (#8888FF dark / #B8B4F0 light): Magic items
- **Rare** (#FFFF77 dark / #F0E88A light): Rare items
- **Unique** (#AF6025 dark / #D4956A light): Unique items (also the accent color)
- **Skill Gem** (#1BA29B dark / #6EC4BE light): Socketed gems (also the good/success color)
- **Currency** (#AA9E82 dark / #C8BFA0 light): Orbs and shards

### Named Rules

**The One Accent Rule.** Unique amber is the only saturated color on the surface. It marks actions (buttons, active tabs) and data (prices, league pills). If something is amber, it's either clickable or it's a number the user needs. Everything else is ink or muted ink on parchment. No second accent color.

**The Warm Neutral Rule.** Every neutral is tinted toward amber. There are no cool grays, no blue-grays, no pure whites. Void Black is warm black, not neutral black. Pale Fog is warm cream, not white. The palette lives in the warm spectrum end to end.

**The Rarity-as-Semantic Rule.** PoE rarity colors double as semantic UI states: Skill Gem teal for success, Molten terracotta for warnings, Blood rose for errors, Cold sky blue for info. They're never used decoratively; they carry meaning.

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

The only shadow in the entire interface is on the panel container itself: `0 2px 8px rgba(0,0,0,0.08)` (light) / `0 2px 8px rgba(0,0,0,0.25)` (dark). This anchors the sidebar as a physical surface sitting alongside the trade page. Everything inside the panel is flat.

Depth is conveyed through background color steps:

**Dark theme** (dark = more recessed):

1. **Void Black** (#0D0B0E): Base background, item rows, empty space
2. **Surface** (#1A1714): Active list header, modal backgrounds, settings popover
3. **Surface Tab** (#181510): Tab bar background
4. **Chrome** (#2A2520): Top chrome bar
5. **Block** (#2A2520): Toggle tracks, placeholder blocks

**Light theme** (lighter = more elevated):

1. **Linen White** (#F5F2EE): Base background
2. **Surface Tab** (#EDE8E0): Tab bar background
3. **Surface/Parchment** (#E8E0D5): Elevated surfaces, chrome bar
4. **Block** (#E8E0D5): Toggle tracks, placeholder blocks

### Named Rules

**The Flat-by-Default Rule.** Surfaces are flat at rest. No card shadows, no floating panels, no drop shadows on list items. The only shadow is the panel container itself. If a component needs to feel elevated, use a tonal step (surface vs bg), not a shadow.

## 5. Components

### Buttons

- **Shape:** Sharp (2px radius). No rounded pills.
- **Primary (BtnAccent):** Unique amber background (#AF6025), white text on dark / dark ink on light, accent-edge border (#7A3F15). Inset highlight `inset 0 1px 0 rgba(255,255,255,0.15)` and bottom shadow `0 1px 0 rgba(0,0,0,0.3)`. Uppercase, 0.4px tracking. Sizes: sm (28px h), md (36px h), lg (44px h). Full-width by default.
- **Ghost (BtnGhost):** Transparent background, dashed stroke border, ink text. Used for secondary actions ("Cancel", "New list"). An accent variant uses solid accent-edge border with accent-ink-strong text for "Publish" and "Follow" CTAs.
- **Hover/Focus:** Primary buttons darken to accent-edge background. Ghost buttons get a solid border. Focus uses the accent ring (no outline, accent border shift).

### Pills / Tags

- **Shape:** 2px radius, 2px 6px padding, 10px font, 500 weight, uppercase, 0.3px tracking.
- **Neutral:** Block-fill background, ink-muted text, stroke border. Used for league badges, item counts.
- **Accent:** Accent-soft background, accent-ink-strong text, accent-edge border. Used for "DRAFT", "ACTIVE", league selector.
- **Warn:** Warn background, warn-ink text, warn-edge border. Used for capture-unavailable state.
- **Good/Success:** Good background, good-ink text, good-edge border. Used for follow counts, success indicators.

### Item Rows

- **Shape:** No border-radius on the row itself. Bottom border: 1px stroke-soft.
- **Layout:** Checkbox (14px) + name (flex-1) + price (right-aligned mono) + kebab (⋯). Gap: 10px.
- **Checkbox:** 14px square, 2px radius, stroke border. Checked: accent fill with accent-edge border and ✓ in accent-ink.
- **Price:** Monospace, 12px, 600 weight, accent-ink-strong color. Currency label at 10px, 0.7 opacity.
- **Completed state:** 0.6 opacity on the entire row, name gets line-through.
- **Kebab (⋯):** Ink-muted, 14px, no background. Opens a dropdown menu.

### Inputs / Fields

- **Style:** 1px stroke border, 2px radius, linen-white background (light) / void-black background (dark), 13px body text. Padding: 8px 10px.
- **Focus:** Border shifts to accent (#AF6025). No outline ring.
- **Labels:** 10px, uppercase, 0.6px tracking, ink-muted color. Positioned above the field with 4px gap.

### Navigation / Tabs

- **Tab bar:** Surface-tab background, 1px stroke bottom border. Tabs: "My Lists", "History". Each tab is flex-1, 11px, 600 weight when active, 400 when inactive.
- **Active tab:** Accent-ink-strong text, 2px accent bottom border.
- **Inactive tab:** Ink-muted text, 2px transparent bottom border. Hover: ink text.
- **Chrome bar:** 32px height, chrome background, frame bottom border. Contains: accent square icon (14px), "PoE Shopping List" title (12px, 600), league pill, settings gear icon.

### Modals / Bottom Sheets

- **Overlay:** `rgba(0,0,0,0.5)` backdrop.
- **Sheet:** Full-width bottom sheet with 2px accent top border. Surface background. Padding: 14px. Gap between fields: 12px.
- **Close:** ✕ in ink-muted, top-right.
- **No rounded corners on the sheet itself.** The accent top border is the only decoration.

### Settings Popover

- **Shape:** 260px wide, surface background, 1px stroke border, 3px radius, heavy shadow `0 8px 28px rgba(0,0,0,0.22)`.
- **Toggle switches:** 36px × 20px track, 14px circle knob. On: accent track with accent-edge border. Off: block-fill track with stroke border.

## 6. Do's and Don'ts

### Do:

- **Do** use Unique amber exclusively for interactive elements and price data. If it's amber, it's either clickable or it's a number the user needs.
- **Do** use tonal layering (surface vs. void-black) to create depth without shadows.
- **Do** use monospace for all numeric data that users compare across rows (prices, counts, totals).
- **Do** keep the sidebar at 380px width. Density is a feature.
- **Do** use uppercase labels with wide letter-spacing (0.6px) for section headers, field labels, and pills.
- **Do** use the PoE-authentic palette end to end. Void black, Dungeon stone, Pale fog, Unique amber. These are the game's colors, not invented ones.
- **Do** make the accent functional, not decorative. It marks actions and data, not decoration.
- **Do** use 2-3px border radius everywhere. Sharp corners, not rounded.
- **Do** let components recede until the user needs them. The content (items, prices, names) is the star.
- **Do** use Skill Gem teal for success states, Molten terracotta for warnings, Blood rose for errors, Cold sky blue for info. These map directly to PoE's atmosphere colors.

### Don't:

- **Don't** use border-left or border-right greater than 1px as a colored accent stripe on cards or list items. The amber accent belongs on buttons, prices, and active states, not on side stripes.
- **Don't** use gradient text (`background-clip: text` with a gradient). Prices are solid accent-ink-strong, not gradient.
- **Don't** use glassmorphism (blur + transparency) as a default. The capture-unavailable banner uses a solid warn background, not a frosted glass effect.
- **Don't** create hero-metric templates (big number, small label, gradient accent). Price displays are inline and monospace, not dashboard KPIs.
- **Don't** use identical card grids. Item rows are flat list items with a bottom border, not cards in a grid.
- **Don't** use modals as the first response. The save-search flow uses a bottom sheet because it's a continuation of the sidebar workflow, not an interruption.
- **Don't** use cool grays, blue-grays, or pure whites/blacks. Every neutral is warm-tinted. Void Black is #0D0B0E, not #000000. Pale Fog is #C4B8A8, not #FFFFFF.
- **Don't** add rounded-pill shapes (radius > 4px). The system is sharp and compact.
- **Don't** use celebration animations, confetti, progress bars with animations, or achievement badges. The extension is a tool, not a game.
- **Don't** use PoE rarity colors decoratively. Normal grey, Magic purple, Rare yellow, and Currency sand are available as tokens but should only appear when they carry semantic meaning (item kind, state type).
