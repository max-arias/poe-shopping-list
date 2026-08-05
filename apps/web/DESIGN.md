---
name: Curated Path of Exile Catalogue
description: League Noticeboard — frank, experienced, generous notes for direct Trade searches and practical craft routes.
colors:
  base-100: "#FFFFFF"
  base-200: "#F5F7FB"
  base-300: "#D8DEE8"
  base-content: "#18202B"
  primary: "#0B4F9C"
  annotation: "#875900"
  warning: "#A23F32"
  muted-content: "#4B5563"
typography:
  body:
    fontFamily: "Outfit, Noto Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 300
    lineHeight: 1.6
  display:
    fontFamily: "Outfit, Noto Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(44px, 8vw, 86px)"
    fontWeight: 600
    lineHeight: 0.92
    letterSpacing: "-0.035em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 300
    lineHeight: 1.45
  navigation:
    fontFamily: "Outfit, Noto Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.1em"
spacing:
  xs: "8px"
  sm: "12px"
  md: "14px"
  lg: "18px"
  xl: "27px"
  section: "72px"
  gutter: "4vw"
components:
  text-action:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    padding: "0"
  navigation-link:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    padding: "0"
  manual-entry:
    backgroundColor: "{colors.base-100}"
    textColor: "{colors.base-content}"
    padding: "27px 0 14px"
---

## Overview

**Creative North Star: “The League Noticeboard”.** This is a frank, experienced, generous reference for Path of Exile players moving from a build need to an official Trade search or a practical craft. The page should feel like a useful note left by someone who has tested the route: direct, transparent, and immediately usable. Sparse ruled annotations explain decisions; they never become decorative community UI.

The catalogue leads with the action and keeps reasoning visible. White surfaces, sparse ruled notes, a cobalt action color, marigold practical annotations, brick-red risk notes, and direct text links create orientation without spectacle. The catalog uses a 940px header/main measure and the craft route an 800px measure, both with 4vw gutters. At 700px and below, catalog entries stack in the order title, rationale, items, Trade, and export; at 560px and below, craft lists become one column. Preserve the observed numbered markers, including category/list markers and craft route numbers, as content cues rather than introducing a new numbering doctrine.

Use smooth scrolling as the default for same-page movement. Under `prefers-reduced-motion: reduce`, remove smooth scrolling and reduce transition/animation duration so no instruction, copy action, or Trade route depends on motion.

## Colors

The site-level tokens in `catalog.css` are the source of truth for public surfaces: `#FFFFFF` for the page, `#F5F7FB` for quiet utility surfaces, `#D8DEE8` for rules, `#18202B` for content, `#0B4F9C` for official Trade/sourced actions, `#875900` for practical annotations, `#A23F32` for real risk, and `#4B5563` for supporting copy. These colors are chosen to maintain WCAG AA contrast on white and soft utility surfaces.

- **Base-100 / #FFFFFF:** page background and the quietest field.
- **Base-200 / #F7F7F7:** fixed action feedback and subtle operational surfaces.
- **Base-300 / #EFEFEF:** hairline dividers and section/list rules.
- **Base-content / #000000:** headings, item names, and strongest copy.
- **Cobalt / #0B4F9C:** official Trade links and sourced actions.
- **Marigold / #875900:** short factual annotations, category numbers, and practical decision cues.
- **Brick / #A23F32:** real warnings, skip guidance, and currency-risk notes only.
- **Muted text / #4B5563:** applicability, context, rationale, and supporting copy.

Color is functional, not atmospheric decoration. Keep the palette mostly quiet, preserve strong contrast, and use cobalt, marigold, and brick only where their meaning is clear.

## Typography

Use Outfit with the Noto Sans/system sans fallback for prose and headings: `"Outfit", "Noto Sans", ui-sans-serif, system-ui, sans-serif`. Use the source monospace stack for code, counts, contextual metadata, and numbered markers: `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`.

- Body copy is 15px, 1.6 line-height, weight 300. Craft intro is 17px/1.55; catalog intro is 18px.
- Catalog display heading is `clamp(44px, 8vw, 86px)`; crafts is `clamp(42px, 8vw, 76px)`. Both are weight 600 with `-.06em` tracking and `.92` line-height.
- Category and craft headings reach 42px; list titles reach 31px. Keep headings compact and editorial, not promotional.
- Navigation remains compact, but avoid stacking tiny all-caps eyebrows. Notes and rationale labels use ordinary readable text with short rules or color cues.
- Keep item titles and Trade links descriptive. External-link arrows are supporting cues and retain an accessible hidden label.

At narrow widths, let headings wrap naturally and keep body copy readable rather than shrinking type below the existing scale. Preserve focus visibility with a 2px primary outline and 4px offset.

## Elevation

The system is flat. Do not use shadows, gradients, floating cards, glass, or decorative depth. Structure comes from white surfaces, hairline rules, sparse ruled annotations, a 2px dark section rule, asymmetric whitespace, and document flow.

Use base-100 for the page, base-200 only where an operational message needs a quiet field, and base-300 for separators. List entries are open editorial rows, not cards. The fixed action feedback is the only element that leaves normal flow; it uses a 1px primary border and base-200 fill, with no shadow.

Interaction should remain quietly operational: text actions underline at rest, may change to content black on hover, and receive the existing visible focus outline. Reduced motion removes smooth scrolling and makes transitions/animations effectively instantaneous.

## Components

Document only the components present in the catalogue:

- **Navigation:** `.site-nav` and `.craft-nav` are border-bottom navigation rows. They contain direct text links; the craft route also shows the current “Field notes” label. Links have useful touch targets and use cobalt for sourced navigation.
- **Headings and route notes:** short plain-language notes orient the route; category/craft headings pair observed numeric markers with a heading and a 2px dark top rule. Subsequent sections are separated by asymmetric whitespace and hairlines.
- **List entries:** `.manual-entry` is an open two-column row: title, applicability/tags, overview, numbered items, official Trade actions, rationale, and export actions. At 700px it becomes one column in the order title, rationale, items, Trade, and export. Preserve the existing em dash marker and two-digit item markers exactly as observed; these are not a new numbering system.
- **Direct text-action buttons/links:** Download JSON, Copy JSON, Copy regex, official Trade searches, and route links remain text-first. They have no filled button treatment, pill, or invented icon container.
- **Fixed action feedback:** `#action-feedback` is a fixed, live status message for download/copy outcomes. It is brief, bordered, and never the only indication of an action result.
- **Craft route/regex helper:** craft steps use semantic ordered lists; route subsections use hairlines; the regex helper presents a code expression and a direct Copy regex action. This is a utility, not an input or card.

## Do's and Don'ts

**Do**

- Do lead with the official Trade search or practical craft step, then show concise reasoning and cheaper alternatives where they exist.
- Do keep links, export actions, and context visible on the page; use descriptive labels and semantic landmarks.
- Do use clean technical mono cues: monospace for numbers, regex, and metadata; Outfit/Noto Sans for prose and headings.
- Do use white surfaces, sparse ruled annotations, asymmetrical whitespace, direct text actions, and clearly differentiated accessible action colors.
- Do preserve strong contrast, keyboard focus, readable zoom behavior, and the existing 700px/560px responsive changes.
- Do respect `prefers-reduced-motion`; motion must never reveal instructions or copy a Trade query.

**Don't**

- Don’t make build-guide pages that bury Trade links beneath ads, video embeds, or broad aspirational advice.
- Don’t use slick SaaS patterns, marketing CTAs, or decorative dashboard metrics.
- Don’t use loot-splash spectacle, artificial urgency, or exaggerated rarity effects.
- Don’t make opaque recommendations that name an item without the actual search, context, or a cheaper alternative.
- Don’t invent inputs, cards, chips, pills, dashboards, shadows, gradients, or promotional hero treatments for this catalogue.
- Don’t replace direct text actions with filled controls or obscure the operational result behind animation.
