---
name: FinBuddy
description: One exact ledger for your own money and the money you share, read like a fare card at the gate.
colors:
  tint: "#4A4652"
  tint-dark: "#CFC8D6"
  on-tint: "#FFFFFF"
  on-tint-dark: "#1A1420"
  tint-wash: "#ECE9EF"
  tint-wash-dark: "#2E2935"
  on-tint-wash: "#2E2935"
  on-tint-wash-dark: "#E8E2EC"
  credit: "#1F7A4D"
  credit-dark: "#5FD39A"
  debit: "#1A1420"
  debit-dark: "#F6F2F7"
  attention: "#9A5B00"
  attention-dark: "#FFB857"
  attention-wash: "#FFF0D6"
  attention-wash-dark: "#4A2E00"
  danger: "#B3261E"
  danger-dark: "#FFB4AB"
  danger-wash: "#F9DEDC"
  danger-wash-dark: "#93000A"
  on-danger: "#FFFFFF"
  on-danger-dark: "#690005"
  ground: "#F5F3F6"
  ground-dark: "#121016"
  surface: "#FFFFFF"
  surface-dark: "#1C1922"
  surface-alt: "#F0ECF2"
  surface-alt-dark: "#1F1B25"
  fill: "#EFEAF1"
  fill-dark: "#2A2431"
  label: "#1A1420"
  label-dark: "#F6F2F7"
  label-secondary: "#5F5564"
  label-secondary-dark: "#B9AFBE"
  label-tertiary: "#726778"
  label-tertiary-dark: "#9A8FA0"
  separator: "#E4DEE6"
  separator-dark: "#332C3A"
  pressed: "rgba(26,20,32,0.08)"
  pressed-dark: "rgba(246,242,247,0.10)"
  bone: "#E9E4EB"
  bone-dark: "#2A252F"
  data-mark: "#857A8C"
  data-mark-dark: "#7F7585"
  line-violet: "#6D3FC8"
  line-violet-on: "#FFFFFF"
  line-violet-dark: "#7E53DD"
  line-violet-on-dark: "#FFFFFF"
  line-tangerine: "#E8620A"
  line-tangerine-on: "#1A1420"
  line-marigold: "#F2B705"
  line-marigold-on: "#1A1420"
  line-leaf: "#1F7A4D"
  line-leaf-on: "#FFFFFF"
  line-moss: "#6B7A1E"
  line-moss-on: "#FFFFFF"
  line-cocoa: "#7A4A2B"
  line-cocoa-on: "#FFFFFF"
  line-cocoa-dark: "#956344"
  line-cocoa-on-dark: "#FFFFFF"
  line-cobalt: "#1F4FD8"
  line-cobalt-on: "#FFFFFF"
  line-cobalt-dark: "#2F63ED"
  line-cobalt-on-dark: "#FFFFFF"
  line-teal: "#0F7B86"
  line-teal-on: "#FFFFFF"
typography:
  readout-xl:
    fontFamily: "MonaSans-Bold"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: "44px"
    fontFeature: "tnum"
  readout-l:
    fontFamily: "MonaSans-Bold"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: "32px"
    fontFeature: "tnum"
  readout-m:
    fontFamily: "MonaSans-SemiBold"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: "28px"
    fontFeature: "tnum"
  readout-s:
    fontFamily: "MonaSans-SemiBold"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: "22px"
    fontFeature: "tnum"
  display:
    fontFamily: "MonaSans-Bold"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: "41px"
  title:
    fontFamily: "MonaSans-SemiBold"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: "28px"
  headline:
    fontFamily: "system-ui"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: "22px"
  body:
    fontFamily: "system-ui"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: "22px"
  subhead:
    fontFamily: "system-ui"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "20px"
  footnote:
    fontFamily: "system-ui"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "18px"
  caption:
    fontFamily: "system-ui"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
rounded:
  card: "12px"
  row: "12px"
  input: "10px"
  tile: "8px"
  sheet-ios: "20px"
  sheet-m3: "28px"
  pill: "999px"
spacing:
  xs: "4px"
  s: "8px"
  m: "12px"
  l: "16px"
  xl: "24px"
  xxl: "32px"
  xxxl: "48px"
  gutter: "16px"
components:
  button-filled:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.on-tint}"
    typography: "{typography.headline}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 24px"
  button-tonal:
    backgroundColor: "{colors.tint-wash}"
    textColor: "{colors.on-tint-wash}"
    typography: "{typography.headline}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 24px"
  button-tonal-small:
    backgroundColor: "{colors.tint-wash}"
    textColor: "{colors.on-tint-wash}"
    typography: "{typography.subhead}"
    rounded: "{rounded.pill}"
    height: "36px"
    padding: "0 14px"
  button-destructive:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-danger}"
    typography: "{typography.headline}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 24px"
  hold-to-confirm:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.on-tint}"
    typography: "{typography.headline}"
    rounded: "{rounded.pill}"
    height: "56px"
    padding: "8px 24px 8px 8px"
  fab:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.on-tint}"
    typography: "{typography.headline}"
    rounded: "16px"
    height: "56px"
    padding: "0 24px 0 16px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.label}"
    rounded: "{rounded.card}"
    padding: "{spacing.l}"
  card-group:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.label}"
    rounded: "{rounded.card}"
    padding: "16px 16px 16px 22px"
  card-finbuddy:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.on-tint}"
    rounded: "{rounded.card}"
    padding: "{spacing.l}"
  line-chip:
    typography: "{typography.footnote}"
    rounded: "{rounded.pill}"
    padding: "3px 12px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.label}"
    typography: "{typography.subhead}"
    rounded: "{rounded.pill}"
    height: "36px"
    padding: "0 14px"
  chip-selected:
    backgroundColor: "{colors.tint-wash}"
    textColor: "{colors.on-tint-wash}"
    typography: "{typography.subhead}"
    rounded: "{rounded.pill}"
    height: "36px"
    padding: "0 14px"
  sample-chip:
    textColor: "{colors.label-secondary}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "1px 8px"
  status-chip-attention:
    backgroundColor: "{colors.attention-wash}"
    textColor: "{colors.attention}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  field:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.label}"
    typography: "{typography.body}"
    rounded: "{rounded.input}"
    height: "44px"
    padding: "10px 12px"
  field-amount:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.label}"
    typography: "{typography.readout-xl}"
    rounded: "{rounded.input}"
    height: "64px"
    padding: "10px 12px"
  list-group:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.row}"
  list-row:
    textColor: "{colors.label}"
    typography: "{typography.body}"
    height: "44px"
    padding: "12px 16px"
  readout:
    textColor: "{colors.label}"
    typography: "{typography.readout-xl}"
---

# Design System: FinBuddy

This file records the system as built in `apps/mobile` (source of truth: `apps/mobile/src/design/tokens.ts`, `theme.tsx` and the primitives beside them), after the finish review of October 2026. It follows `design/DIRECTION.md` as amended by `design/DECISIONS.md`; where the two differ, the build and the decision win and the difference is noted here.

## Overview

**Creative North Star: "The Fare Card and the Gate"**

Every balance is a gate readout: one exact number, in its own currency, that you can read in a second and settle with one hold. The world lends the app four things and no more: a palette, a type voice for figures, a density, and one signature ritual. Layout, navigation and controls stay native to each phone (the HIG on iPhone, Material 3 on Android), so the brand lives in the layer the platform leaves open: the large readouts, the white group cards with their line-colour band, the one graphite card on Home, and the hold that closes a ring before money moves.

The system is quiet. Surfaces are white and tinted grey; the single brand tint is Graphite, and it marks what you can act on rather than painting the screen. Density is low on purpose: one big number at a time, generous air around it, rows that read as sentences ("You owe Blake", "Avery owes you") with the figure beside the words. Honesty is a visual rule here, not a tone: owing is set in ink and never in red, being owed is green with the words, and red appears only for overdue, failure and destructive actions. Sample data always wears a "Sample" chip.

**The graphite decision (2026-10-11).** The direction chose Fare Magenta as the one tint. The founder replaced it with Graphite (tint `#4A4652` light, `#CFC8D6` dark) and asked for quieter surfaces: the tint appears only on the FinBuddy card, filled buttons, links, the active tab and the mark; group cards became white cards on the ground with the group's line colour as a 6 pt band on the leading edge and in the name chip; the line-colour set lost magenta (retired with the old tint, `#C2187A`) and graphite (now the tint) and gained cobalt and teal. Magenta does not appear anywhere in the build: not in the tokens, the mark, the app icons or the splash (`app.json` sets `#4A4652` for the adaptive icon and splash backgrounds). In the build the tint's list widened from that decision to the states of action: selection checks, focus, switches, header controls and the FAB (Colors lists every use). Data stays neutral: chart and proportion bars are the data-mark grey.

**Key Characteristics:**
- One tint, Graphite, used for action and selection, never for money state.
- Money is a readout: Mona Sans with tabular figures, one per currency, never summed, never truncated.
- Direction is carried by words first ("You owe", "You're owed"), colour second.
- Flat surfaces: no decorative shadows; the Material FAB is the one shadow in the app.
- Twelve-point card corners from the ID-1 card; capsules for every button and chip.
- Native shells: NativeTabs, iOS large titles and sheets, Material navigation bar and FAB.

## Colors

A graphite-on-grey neutral system with three meaning colours (green for owed to you, amber for attention, red for real trouble) and eight flat line colours that belong to groups, never to currencies. Every role has a dark value (the `-dark` keys); `theme.tsx` swaps the whole table by scheme, and the in-app appearance override also calls `Appearance.setColorScheme` so native alerts, sheets and pickers follow. Material dynamic colour is off: the static scheme is the Material theme.

### Primary
- **Graphite** (tint `#4A4652`, white on it 9.2:1; dark `#CFC8D6` with ink `#1A1420` on it): filled buttons, the Hold to confirm control, the FAB and the iOS "Add expense" accessory, links and the leading icon of action rows ("Add your first expense", "Set a budget"), the header's back control and text buttons (the navigation theme's primary), selection checks and checkbox fills, a selected category tile's border and badge, the focused field's border and caret, the on-state of switches, the selected month's bar in the Spending and category charts (a selection; the other months are the data mark), the active tab, the FinBuddy card on Home, and the mark.
- **Graphite Wash** (`#ECE9EF`, dark `#2E2935`) with **Deep Graphite** text (`#2E2935`, dark `#E8E2EC`): tonal buttons (every "Settle up" and "Confirm" in a list), selected chips and selected Material segments, person avatars outside a split.

### Secondary
- **Leaf Credit** (`#1F7A4D`, dark `#5FD39A`): money owed to you, as text and readouts only. Always beside the words "You're owed" or "owes you"; it never fills a surface.

### Tertiary
- **Attention Amber** (`#9A5B00`, dark `#FFB857`) on **Amber Wash** (`#FFF0D6`, dark `#4A2E00`): pending payments, due soon, budgets running ahead of pace, and insight warnings and notices (a triangle and a circle icon; the icon's shape and spoken label carry the severity).
- **Danger Red** (`#B3261E`, dark `#FFB4AB`) on **Danger Wash** (`#F9DEDC`, dark `#93000A`), with `#FFFFFF` / `#690005` text on it: overdue, a failed save, a budget exceeded, field errors and destructive actions. Nothing else.

### Neutral
- **Ground** (`#F5F3F6`, dark `#121016`): every screen's background (iOS systemGroupedBackground, M3 surface); also React Navigation's background and card colour, so no default grey shows through.
- **Surface** (`#FFFFFF`, dark `#1C1922`): cards, list groups, chips at rest, the Material navigation bar.
- **Surface Alt** (`#F0ECF2`, dark `#1F1B25`): a card inside a surface, the row being edited, neutral status chips.
- **Fill** (`#EFEAF1`, dark `#2A2431`): text field boxes, switch off-tracks, proportion-bar tracks, member initials on a group card.
- **Ink** (label `#1A1420`, dark `#F6F2F7`): all primary text, and the debit role (you owe) uses the same value on purpose.
- **Secondary Label** (`#5F5564`, 7.1:1 on surface; dark `#B9AFBE`): subtitles, section headers, the Sample chip, informational insight icons, the lock on the privacy screen.
- **Tertiary Label** (`#726778`, 4.8:1 on ground; dark `#9A8FA0`): placeholders, chevrons, inactive web tab labels.
- **Separator** (`#E4DEE6`, dark `#332C3A`): hairlines between rows, chip outlines, segmented borders.
- **Pressed** (`rgba(26,20,32,0.08)`, dark `rgba(246,242,247,0.10)`): the pressed overlay on rows, chips and outlined buttons.
- **Bone** (`#E9E4EB`, dark `#2A252F`): skeleton loading shapes.
- **Data Mark** (`#857A8C`, 4.1:1 on surface and 3.4:1 on fill; dark `#7F7585`, 4:1 and 3.4:1): marks that carry data, not action: the month bars in Spending and a category's chart (the selected month takes the tint), category and on-pace budget proportion bars (ahead of pace is amber, over is red), and the six-month sketch in This month, where the current month is ink.

`tokens.ts` also defines `surfaceRaised`, `creditWash` and a `callout` type role. No shipped screen uses them (only the dev gallery shows `creditWash`), so they stay out of the frontmatter until one does.

### Line colours
Eight flat colours, one per group, from a hash of the group id (`lineColorFor`) and changeable in the group's settings. Each ships with the one label colour that passes 4.5:1 on it: Violet `#6D3FC8`, Tangerine `#E8620A` (ink text), Marigold `#F2B705` (ink text), Leaf `#1F7A4D`, Moss `#6B7A1E`, Cocoa `#7A4A2B`, Cobalt `#1F4FD8`, Teal `#0F7B86` (white text unless noted). A group wears its colour as the 6 pt leading band of its card, as the fill of its name chip, as the 10 pt mark before its name in "Needs settling", and as the rings and arcs of its settle map (the rail under them is a separator-grey hairline). Drawn strokes that must reach 3:1 on the card (marigold does not, at about 1.8:1) are mixed toward the label colour by `graphicColor`; the band and chip keep the true colour.

In dark mode the three whose light fill falls under 3:1 on the dark surface `#1C1922` lighten along their own hue: Violet `#7E53DD`, Cocoa `#956344` and Cobalt `#2F63ED`, each 3.4:1 on the surface and 3.7:1 on the ground, still with white text at 5.0:1 or better. The other five clear 3:1 there and keep their light pair (Tangerine 5.1:1, Marigold 9.5:1, Leaf 3.3:1, Moss 3.7:1, Teal 3.5:1). Everything that draws a line colour (the band, the chip, the marks, the picker's swatches, the split and payer colours, the settle map) takes it from `lineSwatch(line, scheme)`.

### Named Rules
**The Graphite Rule.** The tint marks what you can act on or have chosen, plus the FinBuddy card and the mark. It never colours money state, and it never fills a screen.

**The Ink Debt Rule.** "You owe" is set in ink (`debit` equals `label`). Debts between friends are not alarms; red is for overdue, failure and destructive actions only.

**The Words-First Rule.** Every balance carries its direction in words ("You're owed", "You owe", "Settled up") and its currency in the figure; colour only supports the words, and screen readers hear the currency name.

**The Line Belongs to the Group Rule.** Line colours identify groups. They are never assigned to currencies, never used for state, and red and blue-for-links are absent from the set.

## Typography

**Display Font:** Mona Sans (static `MonaSans-Bold` and `MonaSans-SemiBold`, embedded by the expo-font config plugin and loaded with `useFonts` for Expo Go and the web preview)
**Body Font:** the platform face: San Francisco on iOS, Roboto on Android, the system UI stack on the web
**Label/Mono Font:** none; labels use the platform face

**Character:** A wide, sturdy grotesque with tabular figures carries every amount and the large titles, like the digits on a gate display; the platform face carries everything you read as language, so controls and body text feel native on each phone.

### Hierarchy
- **Readout XL** (Mona Sans 700, 40/44, tabular): the hero figure of a screen: the first currency on the FinBuddy card, the Settle up amount, Spending's month total, an expense's total, and the amount being typed in Add expense.
- **Readout L** (700, 28/32, tabular): the first figure on the Group detail header card, a category's month, the split editor's total.
- **Readout M** (600, 22/28, tabular): further currencies on the FinBuddy card, group-card positions, "This month" totals.
- **Readout S** (600, 17/22, tabular): amounts inside rows ("Needs settling", activity, expenses).
- **Display** (Mona Sans 700, 34/41): the iOS large navigation title.
- **Title** (Mona Sans 600, 22/28): screen-level empty-state headings and the FinBuddy card's "All settled up", the title of a detail screen (an expense, an insight), the welcome sentence.
- **Headline** (system 600, 17/22): button labels, the card's "FinBuddy" label, the hold control's label, insight titles, and the fact at the top of a section's empty card ("Nothing to settle").
- **Body** (system 400, 17/22): row titles and sentences.
- **Subhead** (system 400, 15/20): row subtitles, direction words above readouts, chip labels, small-button labels; Material section headers.
- **Footnote** (system 400, 13/18): list footers, field hints and errors, line-chip names, iOS section headers (uppercase, 0.4 tracking, the grouped-list convention).
- **Caption** (system 400, 12/16): Sample and status chips (set at 600), member initials.

Every role maps to an iOS Dynamic Type style through `dynamicTypeRamp` (largeTitle, title1, title2, headline, body, subheadline, footnote, caption1) and to a Material type role, and scales with the system text size.

### Named Rules
**The Tabular Rule.** Every readout sets `fontVariant: ['tabular-nums']`. Mona Sans ships proportional digits by default; tabular ones (600/1000 em, with a slashed zero) sit behind `tnum`, and without them digit columns jitter as values roll.

**The Never-Clip Rule.** Readouts follow the system text size up to 1.6x (`READOUT_MAX_SCALE`), with the size pre-multiplied so digits and symbols agree, then shrink to fit their row. An amount is never truncated.

**The Whole-Figure Fallback Rule.** If a formatted amount uses a glyph Mona Sans lacks (₫, ₱, ₽, ₴, fullwidth ￥, Arabic-script abbreviations), the whole readout switches to the platform face with tabular figures, never a stitched fallback glyph (`readoutFamilyFor`, `fontCoverage.ts`).

## Layout

A single phone column on the ground colour, with a 16 pt gutter (`SPACE.gutter`) and a 24 pt gap between sections (`SPACE.xl`), on a 4-point grid (4, 8, 12, 16, 24, 32, 48). Cards pad 16 pt; rows pad 12 pt vertically and 16 pt horizontally. Touch targets are at least 44 pt on iOS and 48 dp on Material, with 8 between adjacent targets; small 36 pt capsules (chips, compact buttons) sit inside a full-size pressable.

Home reads top to bottom: the FinBuddy card, "Needs settling" (one two-line row per transfer involving you, up to five, then "See all in Groups"), pending payments, "This month" (one readout per currency with the change in words), two insight rows, five activity rows. Lists are iOS inset grouped (12 pt corners, hairline separators inset 16) and full-width on Material.

Text size drives the layout. At font scale 1.35 (`STACK_FONT_SCALE`) or when the layout is narrower than 290 text units (`COMPACT_TEXT_WIDTH`), rows that put a readout beside words stack the readout and its control under the words, and Material segmented buttons stack into a column.

The FAB is docked, not floating: a Material screen with a FAB ends its scroll area above a strip of ground (16 + 56 + 16) that the FAB sits in, so it never covers a row or a Settle up control. On iOS 26 the "Add expense" bottom accessory floats above the tab bar and screens inset their content by 52 for it. The web preview, wider than 600, centres the app in a 440-wide phone column (`WEB_COLUMN`) with the ground filling the rest. iPhone only on iOS (`supportsTablet: false`); Android tablets currently receive the phone layout.

## Elevation & Depth

Flat by construction. iOS draws no shadows at all: depth comes from grouped surfaces on the ground, hairline separators, and the system materials (the native tab bar, the collapsing navigation bar's `systemChromeMaterial` blur, Liquid Glass on the iOS 26 accessory where `isLiquidGlassAvailable()`, a filled graphite capsule otherwise). Material uses tonal surfaces (ground, then white cards, then sheets) and exactly one shadow.

### Shadow Vocabulary
- **FAB lift** (shadow colour `#1A1420`, opacity 0.18, radius 16, offset 0/6, Android elevation 6): the Material extended FAB only.

### Named Rules
**The One Shadow Rule.** Nothing casts a shadow except the Material FAB. Cards, chips, sheets and the FinBuddy card are flat; separation is colour and hairline.

## Shapes

Corners come from the ID-1 fare card: 12 pt on cards and list groups (3.18 mm of 85.6 mm, at a 320-wide card). Inputs take 10, icon tiles and skeleton blocks 8, iOS sheets 20, Material bottom sheets 28. Every button, chip, segmented control and status label is a capsule. The Material FAB keeps its own 16 pt corner, and the brand mark is a 64-unit tile with 16-unit corners. A group card is at least 16:9 on phones (1.586, the ID-1 ratio, at 600 wide and up) and grows with its content rather than clipping it. The line-colour band is the one coloured edge in the system: 6 pt, on group cards only. The group mark in "Needs settling" is a 10 pt square with 3 pt corners.

## Components

### Buttons
Tactile capsules that press to 0.97 with a stiff spring and a selection haptic.
- **Shape:** capsule (999).
- **Filled:** graphite with white text (ink on light graphite in dark mode), 48 tall, 24 side padding, headline label; the one primary action on a screen.
- **Tonal:** graphite wash with deep graphite text. The small tonal capsule (36 tall in a 44/48 target, subhead label) is the list "Settle up" and "Confirm".
- **Outlined / Plain:** a graphite outline or graphite text on nothing; pressed adds the pressed overlay.
- **Destructive:** the same shapes in the danger role.
- **Disabled / Loading:** 0.45 opacity; loading swaps the label for an activity indicator in the button's text colour.
- **Link button:** subhead 600 in graphite with an 18 pt icon and a full-size target, for "Why am I seeing this" and similar.

### Hold to Confirm (the Gate)
The signature control for money actions (settle up, confirm a payment). A 56-tall graphite capsule with a 40 pt ring at its leading edge, a headline label naming the action and "Hold to confirm" under it. Touch and hold for 600 ms: a haptic at the start, the ring closes linearly (Skia on devices, an SVG stroke on the web), a success haptic at the gate, then the readout rolls to zero. Releasing early rewinds the ring in 160 ms. A screen reader, Reduce Motion, or the Settings choice "Confirm with a dialog instead of holding" turns it into a two-step confirmation with the same label and a check icon.

### Readout (Roll to Zero)
Money as a gate display. The figure comes from the engine's `formatMoneyToParts` with its currency; each digit is a column that rolls on a critically damped, overshoot-clamped spring over 560 ms, keyed from the right so £185.92 rolls down to £0.00 in place while leading columns fade out. Reduce Motion crossfades instead. A live readout announces its new value with the currency name on iOS and Android.

### Chips
- **Choice chip:** a 36 pt capsule on the surface with a hairline outline and a subhead label; selected, it fills with the graphite wash and shows a check mark, never colour alone.
- **Line chip:** the group's name on its line colour, footnote 600, in the label colour that passes on that colour.
- **Sample chip:** a hairline capsule in secondary label, caption 600, saying "Sample". On the FinBuddy card it takes the card's muted text colour.
- **Status chip:** one word ("Pending", "Archived") in caption 600; amber on the amber wash for attention, secondary label on surface alt, or a hairline ring. Never red.

### Cards / Containers
- **Corner Style:** 12 pt.
- **Background:** surface (white / `#1C1922`); surface alt for a card inside a surface; outlined (hairline, no fill) for quiet panels.
- **Group card:** white with the 6 pt line-colour band on the leading edge, the line chip, member initials, and your position as words over readouts, one line per direction. The same card is the list item and the Group detail header, so the eye follows one object between screens.
- **FinBuddy card:** the one card in the tint. "FinBuddy" and the Sample chip on top, then one readout per currency with its direction word above it, stacked largest first (Readout XL, then Readout M). Secondary text on it is the on-tint colour at 78 percent.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Internal Padding:** 16 pt (22 on the leading side of a group card, to clear the band).

### Inputs / Fields
- **Style:** a fill-coloured box with 10 pt corners, label above in subhead secondary label, at least 44/48 tall; the amount field is 64 tall and set in Readout XL with tabular figures.
- **Focus:** a 1.5 pt graphite border, the graphite caret and selection, plus a 2 pt graphite ring offset 2 on the web preview.
- **Error:** the border turns danger red and the error names the problem under the field in footnote, announced to screen readers.
- **Date (web preview):** a 48-tall fill box that shows the date the app's way (the caption's format, never the browser's), with the browser's own date input transparent over it: a click or Enter/Space opens the browser's picker and the arrow keys edit the date.

### Lists and rows
Rows are sentences: a body title, subhead subtitles in secondary label, a trailing readout or control, and a chevron on iOS navigation rows. Amounts in titles and subtitles are never truncated. "Needs settling" rows put the words and the amount on the first line, the group's line-colour mark and name under them, and the compact tonal Settle up beside both. "Pending payments" rows are the same two-line row with a compact Confirm; their second line names the group without the mark and puts the due state under the amount (overdue in red, due soon in amber).

### Navigation
Native on each OS: NativeTabs (UITabBarController with Liquid Glass on iOS 26, the Material 3 navigation bar on Android) with Home, Groups, Spending and Activity. Only the selected tab takes the tint; unselected stays the platform's grey. iOS uses large titles in Mona Sans Bold that collapse into the system material bar; Add expense and Settle up are form sheets on iOS and full-screen dialogs on Android. The web preview's JS tabs follow the Material bar (80 tall, wash indicator pill, tertiary-label inactive labels).

### Settle map (signature)
A group's debts in one currency drawn on its white card: members are stations on a 1.5 pt separator-grey rail, each a 10 pt ring with a 3 pt stroke in the group's line colour (yours filled), and every debt is a 3 pt arc with an arrowhead from payer to payee in the same colour, lifted to 3:1 by `graphicColor` where the true colour is too light. Each amount is a real text chip above the stations: caption with tabular figures on the fill colour, a 24 pt capsule with a 1.5 pt surface-coloured outline, placed per state so no chip touches another or a station. Names sit under the stations in footnote (yours in label at 600, others in secondary label). The segmented "All debts | Fewest payments" morphs between the engine's pairwise debts and its simplified plan over 600 ms from one shared progress value; the leaving chips fade out early and the arriving ones fade in late, so two sets of labels never share the map. Reduce Motion switches instantly; until Skia can draw, the map is a plain list of the same transfers.

### Switches and segmented controls
iOS keeps the system switch and UISegmentedControl. Material switches put the state in the thumb (secondary-label thumb on the fill when off, on-tint thumb on graphite when on); Material segmented buttons show the selection with the wash and a check mark, and stack at large text sizes.

## Do's and Don'ts

### Do:
- **Do** format every amount through the engine with its currency (`formatMoney`, `formatMoneyToParts`) and show one readout per currency; never add currencies together.
- **Do** put the direction in words beside or above every balance ("You owe", "You're owed", "Settled up"), with owed-to-you in credit green and you-owe in ink.
- **Do** keep the tint to action and selection (filled and tonal buttons, links, checks, focus, the active tab), the FinBuddy card and the mark.
- **Do** give every group a line colour and show it as the 6 pt card band, the name chip and the 10 pt mark, nowhere else.
- **Do** set every readout in Mona Sans with tabular figures, cap it at 1.6x and let it shrink to fit rather than clip.
- **Do** confirm money actions with Hold to confirm (600 ms) and route screen readers, Reduce Motion and the dialog preference to the two-step confirmation.
- **Do** label sample data with the Sample chip wherever it appears.
- **Do** dock the Material FAB in its own strip of ground so it covers nothing.

### Don't:
- **Don't** colour a debt red. Red is for overdue, failure and destructive actions only.
- **Don't** use Fare Magenta (`#C2187A`) anywhere; it was retired with the graphite decision.
- **Don't** fill a screen, a group card or a section with the tint or a line colour; group cards are white with a band.
- **Don't** add shadows to cards, chips or sheets; the FAB is the only shadow.
- **Don't** assign line colours to currencies or use them for state.
- **Don't** let colour carry meaning alone: selections show a check mark, insight severity an icon shape and a spoken label, balances their words.
- **Don't** set a caption or eyebrow above a title to announce its kind; the leading icon or the words carry it.
