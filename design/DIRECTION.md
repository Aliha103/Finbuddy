# FinBuddy design direction: the fare card

This is the design contract for FinBuddy's reinvention: the iOS and Android app built with Expo and the marketing site that sells it. It is written to be built from directly. Every value is exact, every screen is mapped to the engine functions it reads and the data actions it calls, and the riskiest pieces ship as type-checked code against the installed versions (Expo 57, React Native 0.86.3, Reanimated 4.5.1, Skia 2.6.2, Gesture Handler 2.32). It follows PRODUCT.md and the seven confirmed decisions, and it respects the impeccable and taste-skill guidance the team asked for: HIG on iPhone, Material 3 on Android, Dynamic Type and font scale, Reduce Motion, no fabricated proof.

## Assumptions

- One brand world serves both surfaces. The concept seed for the app (Operate mode) chose the world; the seed for the site (Persuade mode) chose the site's form inside that world. Both rolls ran degraded (no challengers), as expected in this environment, so no challenger raises appear in the contracts.
- There is no backend, so "sign-in" cannot authenticate anyone. Onboarding creates a local profile; the sign-in screen is designed and built as an honest placeholder that explains sync is coming, never a fake login.
- Group colours and in-app preferences (appearance, dismissed insights, reduce-motion override) are app-local settings in AsyncStorage. The shared model is not changed; the data layer gains additive actions only.
- The Expo web export is a review tool for the team, not a product surface. Decision 2 stands: the product runs natively only.
- "Sample data" means records with `isSample: true` from `createSampleData`; the UI labels them wherever they appear.

## 1. Direction contract

### How the world was chosen

FinBuddy's mechanism in one sentence: one exact ledger where splitting a dinner also updates your own spending picture, in every currency you use, with balances kept per person per currency and never blended. The audience's scene is a phone at a restaurant table, a checkout, a train abroad, a kitchen with roommates. The category always ships one of two pages: the neobank look (navy gradient cards, 3D coins, a glowing accent) or its opposite (cream paper, serif, "calm money"). Both are the rut and were kept out of the list.

Seven visual systems from the audience's world, ordered by resonance:

1. The restaurant receipt passed round the table (thermal paper, itemised column, the tear). The product's literal artifact; one slot, as the method allows.
2. Banknotes in a travel wallet (one saturated colour per currency, engraved numerals).
3. The roommate fridge whiteboard (marker tallies, names in columns).
4. The pocket cash book (ruled columns, the double rule under a settled total, the PAID stamp).
5. The transit fare card and the gate (one flat saturated colour on ID-1 card stock, a chip, the tap, the gate readout showing your balance for one second in big tabular digits).
6. Isotype pictorial statistics (a split as rows of repeated unit figures).
7. The split-flap departure board (digits that flip into place).

The seed (key `95fc5255`, mode operate) assigned index 5: the fare card and the gate. On an Operate surface the world lends exactly four things, type, palette, density and one signature move, and never the layout, the navigation or the controls. That limit is what makes the fare card the right world for a money app: it is sparse, it shows one big number at a time, it is coloured flat and honestly, and its ritual (tap, read the balance, pass through) is the settle-up ritual.

For the site, seven forms of that world were listed (the wallet fan, the gate, the departure board, the receipt that becomes a card, the page as one giant card, the live gate demo, the transit map). The seed (key `c9dfb288`, mode persuade) assigned index 6: the live gate demo, where the hero is the working split engine presented as a fare card.

### App contract (Operate)

**THESIS.** Every balance is a gate readout: one exact number, in its own currency, that you can read in a second and settle with one hold. It refuses the neobank dashboard (hero metric, ring chart, carousel of gradient cards) and the ledger spreadsheet (rows of tiny grey numbers).

**OWN-WORLD.** Fare Magenta `#C2187A` as the one tint, on tinted platform surfaces (`#F5F3F6` light, `#121016` dark), with eight flat "line colours" that each group wears like card stock. Readouts in Mona Sans Bold tabular figures at 40, 28, 22 and 17 pt; body in the system face. Twelve-point corners taken from the ID-1 card, capsule buttons, hairline separators, no decorative shadows. Owing is set in ink, being owed in Leaf green, overdue in red, and the words always carry the direction. With all content removed the screen is still recognisable: magenta tint, flat coloured cards, large tabular digits, generous air around one number.

**STORY.** The person opens the app at the table, reads "You owe ¥21,486" and "You're owed £185.92" as two separate readouts, adds the dinner in under ten seconds with the keypad already up, sees their own share land in their personal spending, and later holds the settle button until the gate ring closes and the readout rolls to zero. They believe the numbers because every one shows its currency, never mixes currencies, and explains itself when asked.

**FIRST VIEWPORT (Home, iPhone 16 and Pixel 9).** Large title "Home" with the profile avatar at the leading edge (iOS) or in the top app bar (Android). Directly under it, the FinBuddy card: a magenta ID-1 card, full width minus the 16 pt gutter, carrying one readout per currency with its direction word above it ("You're owed", "You owe"), stacked, largest first, and a "Sample" chip when the data is sample. Below the card, the "Needs settling" group: one row per transfer involving you, each with a Settle up control. Then "This month" as one readout per currency of your own share, then two insight rows, then five activity rows and "See all". On iOS 26 the "Add expense" bottom accessory sits above the tab bar; on earlier iOS a "+" button in the navigation bar; on Android a FAB bottom-trailing. Primary action: Add expense. Signature move: the readouts on the card roll when balances change.

**FORM.** The transit fare card and its gate, candidate 5 of 7 on the ordered list, assigned by concept seed `95fc5255` (operate, degraded roll, no challengers).

**SIGNATURE INTERACTION.** "Roll to Zero": money readouts whose digits roll like a gate display, and "the Gate": touch-and-hold for 600 ms on money actions while a ring closes, with haptics at the start and at the gate, after which the balance rolls to zero.

**MOTION GRAMMAR.** Feedback in 100 to 160 ms, state changes in 240, sheets and layout in 320 with Material's emphasized-decelerate curve, readouts in 560 ms critically damped and clamped (money never overshoots), the hold at 600 ms linear. Push, sheet and tab transitions are the platform's own. Reduce Motion replaces every roll with a crossfade and every hold with a two-step confirmation.

**FINISH.** Unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

### Site contract (Persuade)

**THESIS.** The site proves the product by running it: the hero is the real split engine from `packages/shared`, presented as a fare card you can type into. It refuses the template (headline, subcopy, two store badges, a phone mockup, a row of three feature cards, fake testimonials) and the painted poster (a page that is all world and no working parts).

**OWN-WORLD.** A full-bleed Fare Magenta field for the first viewport with a white ID-1 card set into it; below, alternating platform-white and graphite bands, never cream. Mona Sans Variable throughout, display at 110 percent width, tabular numerals everywhere money appears. Line colours only on the cards that represent groups. Capsule buttons, 12 px card corners, one brand ease. Sample data always wears a "Sample" chip.

**STORY.** A visitor sent here by a friend understands in five seconds that FinBuddy splits bills exactly, in any currency, and keeps personal and shared money together; believes it because they just split £100 three ways and watched the engine give someone the extra penny; learns plainly that the app is pre-launch and local-first; and either watches the GitHub releases or comes back at launch.

**FIRST VIEWPORT (1440 and 390 wide).** Magenta ground. Left (desktop) or top (phone): the headline in two lines, one sentence of copy under 20 words, and the two store buttons in their honest pre-launch state. Right (desktop) or below (phone): the white Split Card at 7 of 12 columns, holding a total with currency selector, up to six people chips, a split-method tab row, the live per-person readouts, and a Settle control with the Gate and Roll to Zero. The card is the primary action. Nothing else sits in the hero: no badges, no counts, no logo wall.

**FORM.** The live gate demo, candidate 6 of 7 on the site's ordered list, assigned by concept seed `c9dfb288` (persuade, degraded roll, no challengers).

**SIGNATURE INTERACTION.** The same two as the app, on the web: Roll to Zero via GSAP digit columns and the Gate via pointer hold with a stroked SVG ring, so a visitor has already used the app's signature before installing it.

**MOTION GRAMMAR.** One rehearsed hero sequence (SplitText lines, card rise, buttons) under 1.4 s; one pinned scroll scene (the card fan); DrawSVG and Flip for the settle diagram; everything else static. `prefers-reduced-motion` sets final states and keeps only opacity.

**FINISH.** Unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## 2. Brand identity

### The mark: a total, split evenly

The mark is a magenta ID-1-cornered tile carrying three white bars: one full bar above, and the same length divided into two equal bars below. Read quickly it is an equals sign, which is what a settled balance is. Read slowly it is the product: a total on top, split fairly underneath. It is drawn on a 64-unit grid, survives at 16 px (two bars of 2 px), prints in one colour, and contains no coin, no pie, no speech bubble and no currency symbol, because FinBuddy has no single currency.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-labelledby="fb-mark-title">
  <title id="fb-mark-title">FinBuddy</title>
  <rect width="64" height="64" rx="16" fill="#C2187A"/>
  <rect x="14" y="21" width="36" height="8" rx="4" fill="#FFFFFF"/>
  <rect x="14" y="35" width="16" height="8" rx="4" fill="#FFFFFF"/>
  <rect x="34" y="35" width="16" height="8" rx="4" fill="#FFFFFF"/>
</svg>
```

### The wordmark

"FinBuddy" is custom lettering, not a font: rounded geometric strokes at 18 units on a 100-unit cap height, so the asset is complete SVG that renders identically everywhere without a typeface. The dot of the i is a small magenta tile, the only colour in the wordmark, tying it to the mark. The strokes use `currentColor`, so the same file works on light and dark grounds. Minimum size: 96 px wide for the wordmark, 20 px for the mark. Clear space: one bar height (8 units of the mark's 64) on all sides.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 670 170" width="670" height="170" role="img" aria-labelledby="fb-word-title">
  <title id="fb-word-title">FinBuddy</title>
  <g fill="none" stroke="currentColor" stroke-width="18" stroke-linecap="round" stroke-linejoin="round">
    <!-- F -->
    <path d="M29 29V111M29 29H86M29 72H77"/>
    <!-- i -->
    <path d="M120.5 59V111"/>
    <!-- n -->
    <path d="M155 111V59M155 80C155 67 165 58 179 58C193 58 203 67 203 80V111"/>
    <!-- B -->
    <path d="M237 29V111M237 29H273C289 29 297 38 297 49.5C297 61 289 70 273 70H237M237 70H279C296 70 305 79 305 90.5C305 102 296 111 279 111H237"/>
    <!-- u -->
    <path d="M339 59V88C339 102 349 111 363 111C377 111 387 102 387 88V59M387 59V111"/>
    <!-- d -->
    <path d="M473 29V111"/>
    <!-- d -->
    <path d="M559 29V111"/>
    <!-- y -->
    <path d="M593 59L616 108M639 59L605 130C601 138 594 142 585 141"/>
  </g>
  <g fill="none" stroke="currentColor" stroke-width="18">
    <circle cx="447" cy="85" r="26"/>
    <circle cx="533" cy="85" r="26"/>
  </g>
  <!-- the dot of the i is the mark's split bar, set as a tile -->
  <rect x="111" y="20" width="19" height="19" rx="5" fill="#C2187A"/>
</svg>
```

### The lockup

Mark at 64, a 20-unit gap, wordmark scaled to a 64-unit cap height. Use the lockup on the site header and the onboarding welcome; use the mark alone as the app icon, favicon and tab-bar badge; never set the wordmark in a live font.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 96" width="540" height="96" role="img" aria-labelledby="fb-lockup-title">
  <title id="fb-lockup-title">FinBuddy</title>
  <g transform="translate(0 16)">
    <rect width="64" height="64" rx="16" fill="#C2187A"/>
    <rect x="14" y="21" width="36" height="8" rx="4" fill="#FFFFFF"/>
    <rect x="14" y="35" width="16" height="8" rx="4" fill="#FFFFFF"/>
    <rect x="34" y="35" width="16" height="8" rx="4" fill="#FFFFFF"/>
  </g>
  <g transform="translate(84 2) scale(0.64)" fill="none" stroke="#1A1420" stroke-width="18" stroke-linecap="round" stroke-linejoin="round">
    <path d="M29 29V111M29 29H86M29 72H77"/>
    <path d="M120.5 59V111"/>
    <path d="M155 111V59M155 80C155 67 165 58 179 58C193 58 203 67 203 80V111"/>
    <path d="M237 29V111M237 29H273C289 29 297 38 297 49.5C297 61 289 70 273 70H237M237 70H279C296 70 305 79 305 90.5C305 102 296 111 279 111H237"/>
    <path d="M339 59V88C339 102 349 111 363 111C377 111 387 102 387 88V59M387 59V111"/>
    <path d="M473 29V111"/>
    <path d="M559 29V111"/>
    <path d="M593 59L616 108M639 59L605 130C601 138 594 142 585 141"/>
    <circle cx="447" cy="85" r="26"/>
    <circle cx="533" cy="85" r="26"/>
    <rect x="111" y="20" width="19" height="19" rx="5" fill="#C2187A" stroke="none"/>
  </g>
</svg>
```

### App icons

iOS takes one 1024 square with no corner rounding (the system masks it). The mark's geometry is scaled 16 times, so the icon and the favicon are the same drawing.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect width="1024" height="1024" fill="#C2187A"/>
  <rect x="224" y="336" width="576" height="128" rx="64" fill="#FFFFFF"/>
  <rect x="224" y="560" width="256" height="128" rx="64" fill="#FFFFFF"/>
  <rect x="544" y="560" width="256" height="128" rx="64" fill="#FFFFFF"/>
</svg>
```

Android adaptive icons are three layers on a 108 dp canvas, of which only the central 66 dp circle is guaranteed visible. The bars are scaled by 1.4 so the group's corners stay 3.5 dp inside that circle under every launcher mask. The background layer is the flat magenta; the monochrome layer repeats the foreground in one colour for themed icons on Android 13 and later.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="1024" height="1024">
  <!-- Everything sits inside the 66 dp safe circle centred at (54,54). -->
  <rect x="28.8" y="38.6" width="50.4" height="11.2" rx="5.6" fill="#FFFFFF"/>
  <rect x="28.8" y="58.2" width="22.4" height="11.2" rx="5.6" fill="#FFFFFF"/>
  <rect x="56.8" y="58.2" width="22.4" height="11.2" rx="5.6" fill="#FFFFFF"/>
</svg>
```

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="1024" height="1024">
  <rect width="108" height="108" fill="#C2187A"/>
</svg>
```

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="1024" height="1024">
  <!-- Single colour; the launcher tints it. Same geometry as the foreground layer. -->
  <rect x="28.8" y="38.6" width="50.4" height="11.2" rx="5.6" fill="#FFFFFF"/>
  <rect x="28.8" y="58.2" width="22.4" height="11.2" rx="5.6" fill="#FFFFFF"/>
  <rect x="56.8" y="58.2" width="22.4" height="11.2" rx="5.6" fill="#FFFFFF"/>
</svg>
```

Expo takes PNGs for icons, so the build rasterises these SVGs once with `sharp` (dev dependency, see section 7) into `apps/mobile/assets/icon.png` (1024), `android-icon-foreground.png`, `android-icon-background.png` and `android-icon-monochrome.png`, and `app.json` sets `android.adaptiveIcon.backgroundColor` to `#C2187A`. The splash is the mark centred on magenta with `userInterfaceStyle` automatic.

### What is retired

The indigo/blue/teal palette, Poppins and Open Sans, `finbuddy_logo.png`, the seven feature PNGs in `apps/web/src/assets/images`, and the current `assets/icon.png` and `android-icon-*.png` in `apps/mobile`. None are references. The README tagline "Smarter Finances. Together." is not used; the site's headline carries the claim in plain words.

## 3. Design tokens

Everything below is in `apps/mobile/src/design/tokens.ts` (section 7) and mirrored as CSS variables in the site's `@theme` block. Values are exact; contrast figures were computed against the surface they sit on.

### Colour, with iOS and Material 3 roles

| Role | Light | Dark | iOS semantic colour | Material 3 role |
|---|---|---|---|---|
| ground | `#F5F3F6` | `#121016` | systemGroupedBackground | surface |
| surface | `#FFFFFF` | `#1C1922` | secondarySystemGroupedBackground | surfaceContainerLowest (light), surfaceContainerLow (dark) |
| surfaceAlt | `#F0ECF2` | `#1F1B25` | tertiarySystemGroupedBackground | surfaceContainer |
| surfaceRaised | `#FFFFFF` | `#2A252F` | sheet and popover background | surfaceContainerHigh |
| fill | `#EFEAF1` | `#2A2431` | tertiarySystemFill | surfaceContainerHighest |
| label | `#1A1420` | `#F6F2F7` | label | onSurface |
| labelSecondary | `#5F5564` (7.1:1) | `#B9AFBE` (8.0:1) | secondaryLabel | onSurfaceVariant |
| labelTertiary | `#726778` (4.8:1 on ground) | `#9A8FA0` (5.5:1) | tertiaryLabel, placeholder | outline as text |
| separator | `#E4DEE6` | `#332C3A` | separator | outlineVariant |
| tint | `#C2187A` (white on it 5.7:1) | `#FF66B8` (6.6:1 on surface) | tintColor | primary |
| onTint | `#FFFFFF` | `#3F0527` | text on tint | onPrimary |
| tintWash | `#FBE7F1` | `#7A0E4A` | tint at 10 percent | primaryContainer |
| onTintWash | `#5A0A3A` | `#FFD6EA` | | onPrimaryContainer |
| credit (owed to you) | `#1F7A4D` (5.3:1) | `#5FD39A` (9.0:1) | systemGreen role | tertiary |
| creditWash | `#D9F2E4` | `#123D28` | | tertiaryContainer |
| debit (you owe) | `#1A1420` | `#F6F2F7` | label | onSurface |
| attention (pending, due soon) | `#9A5B00` (5.4:1) | `#FFB857` | systemOrange role | secondary |
| attentionWash | `#FFF0D6` | `#4A2E00` | | secondaryContainer |
| danger (overdue, failed, destructive) | `#B3261E` | `#FFB4AB` | systemRed role | error |
| dangerWash | `#F9DEDC` | `#93000A` | | errorContainer |
| onDanger | `#FFFFFF` | `#690005` | | onError |
| pressed | `rgba(26,20,32,0.08)` | `rgba(246,242,247,0.10)` | highlight | state layer 8 to 10 percent |

Three rules carry the "honest money" principle: owing is never red (it is ink with the word "owe"), being owed is green but always with the words "owed to you", and red appears only for overdue, failure and destructive actions. Colour is never the only signal; every balance row carries its direction in words and the screen reader hears the currency name. On Android, Material dynamic colour is deliberately off: the magenta and the line colours are the brand, and a wallpaper-derived scheme would recolour money states. The static scheme above is the Material theme.

### Line colours

Eight flat card-stock colours, assigned per group from a hash of its id (`lineColorFor`) and changeable in the group's settings; never assigned to currencies. Each ships with the one label colour that passes 4.5:1 on it: magenta `#C2187A` (white), violet `#6D3FC8` (white), tangerine `#E8620A` (ink), marigold `#F2B705` (ink), leaf `#1F7A4D` (white), moss `#6B7A1E` (white), cocoa `#7A4A2B` (white), graphite `#3B3B46` (white). Red and blue are absent on purpose: red is the danger role and blue is retired.

### Typography

Packages: `@expo-google-fonts/mona-sans@0.4.1` on native (static weights `MonaSans_600SemiBold`, `MonaSans_700Bold`, loaded with `expo-font`'s `useFonts`), `@fontsource-variable/mona-sans@5.3.0` on the site (variable weight and width). Body, labels and controls stay on the platform face: San Francisco on iOS, Roboto on Android. Mona Sans carries the readouts, the large titles and the section titles, which is the layer the platform leaves open. Readouts set `fontVariant: ['tabular-nums']`; the first implementation step verifies the `tnum` feature in the shipped TTF and falls back to the system face for readouts if it is missing (section 8).

| FinBuddy role | Size / line (pt, sp) | Face, weight | iOS Dynamic Type style | Material type role |
|---|---|---|---|---|
| readoutXL | 40 / 44 | Mona Sans 700, tabular | largeTitle (scaled) | displaySmall |
| readoutL | 28 / 32 | Mona Sans 700, tabular | title1 | headlineMedium |
| readoutM | 22 / 28 | Mona Sans 600, tabular | title2 | titleLarge |
| readoutS | 17 / 22 | Mona Sans 600, tabular | headline | titleMedium |
| display | 34 / 41 | Mona Sans 700 | largeTitle | headlineLarge |
| title | 22 / 28 | Mona Sans 600 | title2 | titleLarge |
| headline | 17 / 22 | system 600 | headline | titleMedium |
| body | 17 / 22 | system 400 | body | bodyLarge |
| callout | 16 / 21 | system 400 | callout | bodyLarge |
| subhead | 15 / 20 | system 400 | subheadline | bodyMedium |
| footnote | 13 / 18 | system 400 | footnote | bodySmall |
| caption | 12 / 16 | system 400 | caption1 | labelSmall |

All roles scale with the system text size. Readouts cap at 1.6 times and shrink to fit before they clip (an amount is never truncated); rows with a readout beside text stack vertically at font scale 1.35 and above. Nothing is set below 12 pt except badges at 11.

### Spacing, radii, elevation, materials

Spacing is a 4-point grid: 4, 8, 12, 16, 24, 32, 48; screen gutter 16; card padding 16; row minimum height 44 (iOS) and 48 (Android) with 8 between adjacent targets. Radii: cards and list groups 12 (the ID-1 card corner, 3.18 mm of 85.6 mm, at a 320-wide card), inputs 10, icon tiles 8, buttons and chips capsule, iOS sheets 20, Material bottom sheets 28. Elevation: iOS draws none (grouped surfaces and hairlines; blur comes from the native tab bar, the `headerBlurEffect`, and `expo-glass-effect`'s `GlassView` for the floating Add accessory where `isLiquidGlassAvailable()`); Android uses tonal surfaces (level 0 ground, level 1 cards, level 2 menus, level 3 sheets) and one shadow for the FAB: `0 6 16 rgba(26,20,32,0.18)`, elevation 6. The site uses the same tinted shadow on the Split Card only.

### Motion tokens

Durations in ms: instant 100, quick 160, standard 240, slow 320, readout 560, hold 600, focal 800. Easings: standard `cubic-bezier(0.2, 0, 0, 1)`, emphasized-decelerate `cubic-bezier(0.05, 0.7, 0.1, 1)` (also the site's `gate` CustomEase), emphasized-accelerate `cubic-bezier(0.3, 0, 0.8, 0.15)`. Reanimated springs: press `{ damping 22, stiffness 420, mass 0.7 }`, sheet `{ damping 28, stiffness 240, mass 1 }`, gate `{ damping 18, stiffness 200, mass 1 }`, roll `{ duration 560, dampingRatio 1, overshootClamping true }`. Every config carries `reduceMotion: ReduceMotion.System`, so Reanimated itself skips the travel when the OS asks, except the hold timer, which is progress rather than motion and keeps running. Exits run at 0.75 of their entrance.

## 4. App information architecture, navigation and every core screen

### Navigation per platform

Four sections in a native tab container, the same four on both platforms: Home, Groups, Spending, Activity. Insights live one level under Home (and are reachable from Spending); Profile and settings open from the avatar. Add expense is an action, never a tab.

| | iPhone (HIG) | Android (Material 3) |
|---|---|---|
| Container | `NativeTabs` from `expo-router/unstable-native-tabs`: UITabBarController, Liquid Glass on iOS 26, `minimizeBehavior: 'onScrollDown'`, SF Symbols icons | `NativeTabs`: Material navigation bar on surface, Material Symbols icons (`md`), labels always shown |
| Primary action | iOS 26: `NativeTabs.BottomAccessory` "Add expense" (a `GlassView` capsule). Earlier iOS: "+" button in each root navigation bar | One FAB per screen, never two: "Add expense" on Home and Group detail, "New group" on Groups; no FAB elsewhere |
| Hierarchy | Native stack per tab, large titles on tab roots collapsing on scroll, inline titles on detail screens, edge-swipe back always alive | Native stack per tab, top app bar with title, system and predictive Back honoured (`predictiveBackGestureEnabled: true`) |
| Add expense modality | Form sheet, detents 0.92 and 1.0, grabber, corner radius 20, swipe to dismiss with a discard guard once an amount exists | Full-screen dialog with Close and Save in the top app bar, Back asks to discard once an amount exists |
| Settle up | Form sheet, `fitToContents` | Full-screen dialog |
| Settings | Modal stack from the avatar, Done closes | Pushed screen from the avatar |
| Pickers | System segmented control for split method, system date picker (`@react-native-community/datetimepicker`), action sheets for destructive choices, context menus on rows | Material segmented buttons, Material date picker, Material dialogs, swipe actions on rows plus a long-press menu |
| Feedback | Haptics, inline status text, alerts only for decisions | Snackbars with Undo where reversible, dialogs only for decisions |
| Lists | Inset grouped lists, hairline separators, uppercase group headers | Full-width list items on surface, group titles in titleSmall |
| Iconography | SF Symbols via `expo-symbols` `SymbolView` (`name.ios`) | Material Symbols via the same `SymbolView` (`name.android`) |

The `SymbolView` from `expo-symbols@57.0.3` takes `{ ios, android }` names, so one `Icon` component gives each OS its native set with no web icon font in the app.

### Route map

```
apps/mobile/src/app/
  _layout.tsx                     fonts, ThemeProvider, startDataStore, root Stack
  onboarding/index.tsx            welcome: start fresh or look around with sample data
  onboarding/profile.tsx          name, default currency, number format preview
  onboarding/signin.tsx           honest placeholder for the future account
  (tabs)/_layout.tsx              NativeTabs (code in section 7)
  (tabs)/(home)/index.tsx         Home
  (tabs)/(home)/insights/index.tsx, [insightId].tsx
  (tabs)/(groups)/index.tsx, new.tsx, [groupId]/index.tsx, [groupId]/settings.tsx
  (tabs)/(spending)/index.tsx, category/[categoryId].tsx, budgets.tsx
  (tabs)/(activity)/index.tsx
  add/_layout.tsx, index.tsx, split.tsx, payers.tsx, currency.tsx, category.tsx
  settle.tsx                      ?groupId&from&to&currency
  expense/[expenseId].tsx
  settings/_layout.tsx, index.tsx, currency.tsx, appearance.tsx, privacy.tsx, data.tsx
```

Shared UI lives in `src/design` (tokens, theme, primitives, Readout, HoldToConfirm, Icon, Card, Row, Chip, Field, Skeleton), feature code in `src/features/*`, and `src/data` stays as it is with the additive actions listed in section 7.

### State rules that apply to every screen

Loading: the store's `status === 'loading'` lasts a few hundred milliseconds; every screen shows skeleton bones in its own final layout (no spinner), and the bones crossfade into content. Error: `status === 'error'` replaces the tab content with "Saved data could not be read" and one action, Reset sample data (`resetSampleData`), plus the error text in footnote. Offline: the app is local-first, so every screen works identically offline; the only network-aware elements are the future rates line in Spending and the future sync row in Settings, which say "Needs a connection" rather than spinning. Storage refused (`persistent === false`): a thin attention-coloured bar under the title on Home and in Settings, "Changes won't be saved on this device", explained in Privacy. Sample: every record with `isSample` shows a "Sample" chip in labelSecondary, and while the profile itself is sample a one-line banner sits under the Home title, "You're looking at sample data", with "Start with your own". Empty: each screen below names its empty state and the one action that fills it.

### Onboarding and sign-in

Welcome is the lockup on magenta with one sentence, "Shared costs and your own spending, one exact ledger", and two actions: "Start with your own money" (primary) and "Look around with sample data" (secondary). Profile asks for a display name and a default currency in a searchable list (`CURRENCY_CODES` with `Intl.DisplayNames`), and previews a readout in the device locale so the person sees their decimal separator before they type an amount. Sign-in is reachable from Settings, not from the flow: it states "Your data stays on this phone. Accounts and sync arrive with the online service", with no fields. Nothing pretends to authenticate (the old web app's fake login is explicitly not carried over). Reads: none. Actions: `startFresh({ displayName, defaultCurrency, locale })`, which wraps `createPerson`, `createProfile` and `repository.replaceAll` on an empty snapshot; `keepSampleData()`, which only sets the app-local `onboarded` flag. States: the default currency list shows the device region's currency first; an empty name shows the error under the field; the sample path lands on Home with the banner.

### Home

Layout, top to bottom: large title with avatar; sample banner when applicable; the FinBuddy card with direction word and readout per currency (`readoutXL` for the first, `readoutM` for the rest), "All settled up" when both lists are empty; "Needs settling" rows (transfer sentence, group name, Settle up control, three at most, then "See all in Groups"); "Pending payments" rows with Confirm payment; "This month" readouts of your own share per currency with a small six-bar sparkline of the last six months drawn in Skia; two insight rows with severity icon and "Why" link; five activity rows; the primary action per platform. Reads: `useProfile`, `useOverview` (`personalOverview`), `useMySettleUps` (`balancesByGroup`, `simplifyDebts`), `useMyPendingSettlements`, `useSpending(6)` (`spendingByMonth`, `spendingByCategory`), `useInsights` (`generateInsights`), `useActivity`, `useGroups`. Actions: `settleTransfer`, `confirmSettlement`, `resetSampleData`. Empty: new profile with nothing logged shows the card reading "Nothing to settle" and one row, "Add your first expense", opening Add with the keypad up. Readout changes roll (section 5).

### Add expense, with splitting and currency

The fastest flow, designed for the table. The sheet opens with the amount field focused and the decimal keypad up; the amount is the readout itself (`readoutXL`, `inputMode="decimal"`), with the currency code as a capsule chip beside it that opens the currency screen. Under it: description (optional, category name used when empty), then a "Who" row of chips, "Just me" and each active group, defaulting to the group the sheet was opened from. For a group: "Paid by" (you, by default, or "Several people"), the split summary row ("Equally, 3 people, you pay £40.00") that opens the split editor, category chips (15 defaults, drawn icons), date (Today, Yesterday, or the system picker). Save sits in the header on iOS and the app bar on Android. The form state and its `evaluate()` move from `src/preview/add-expense/form.ts` to `src/features/expense/form.ts` unchanged, gaining the `adjustment` method. Reads: `useProfile`, `useGroups`, `usePeople`, `useToday`, `useDeviceLocale`; engine `parseMoneyInput`, `getNumberSeparators`, `formatMoneyForInput`, `validateSplit`, `validatePayers`, `resolveSplit`, `allocateMinor`, `CURRENCY_CODES`, `minorUnits`, `DEFAULT_CATEGORIES`. Action: `addExpense` (`buildExpense` inside, with the group's `memberIds`). States: amount errors appear under the readout only after blur or on Save, in the engine's words ("JPY has no decimals"); a currency different from the group's currency shows a footnote, "Balances in this group will show JPY separately"; save failure keeps the sheet open with the messages mapped from `ExpenseIssue` codes; Save shows "Saving" and disables; success announces "Saved Dinner, 48 British pounds", closes, and the Home readouts roll. Currency screen: search by code or name, suggested first (group's, yours, recently used), then all `CURRENCY_CODES`; minor units shown as "no decimals" or "3 decimals" so KWD and JPY are not surprises.

### Split editor

A pushed screen inside the add stack. Segmented control (iOS) or segmented buttons (Android): Equally, Exact, Percent, Shares, Adjust. Below, the split bar (section 5): one horizontal bar in the group's line colour, divided into each person's segment, with avatars and their resolved share (`readoutS`) under it, updating live from `resolveSplit`. Under the bar, one row per person with the method's input: a checkbox for Equally, an amount field for Exact, a percent field, a shares stepper, or a signed adjustment field. The running total line comes from `evaluate()` ("£70.00 of £120.00 assigned, £50.00 left"). "Several payers" has the same rows with amount fields and its own running line (`validatePayers`). Reads and engine as above. States: invalid rows show the message under the field; the bar shows a hatched remainder segment while amounts do not sum; Done is disabled until `draft` is non-null, with the first problem announced.

### Personal spending and analytics

Large title "Spending". A currency segmented row when more than one currency has spending (profile currency first; currencies are never summed). Then this month's readout of your own share with the change against last month from `monthOverMonth` ("up 38 percent, £312 more"), a six-month bar chart in Skia with the current month hatched (partial) and a marker on any month the engine flagged as a spike, then "By category" as horizontal proportional bars (largest first, count and total, tap to open the category screen), then "Budgets" rows with pace text from the `budget_pace` insight and a Set budget action, then an Insights row. Reads: `useSpending(6)` (`spendingByMonth`, `spendingByCategory`, `monthOverMonth`), `useBudgets` (new hook over `snapshot.budgets`), `useInsights`. Category screen: `spendingRecords` filtered by category and currency (new selector `selectCategoryRecords`), listed newest first. Actions: `setBudget` (`createBudget` or `budgets.put`, `budgets.delete`). States: no spending in the window shows "Nothing logged yet this month" with Add expense; a currency with only one month hides the change line; a budget in a currency other than the spending currency shows the engine's `excludedCurrencies` note verbatim in meaning: "Spending in JPY is not counted, currencies are never mixed".

### Groups list

Large title "Groups". A vertical stack of fare cards, one per group in its line colour, 1.586:1 on wide screens and 16:9 on phones, each with the name, member initials, and your net per currency as `readoutM` with the direction word (two currencies shown, "+1 more" beyond), "Settled" when zero, archived groups last with an "Archived" chip and reduced opacity. The primary action on this screen is New group (toolbar on iOS, FAB on Android becomes "New group" here). Reads: `useGroups` (`balancesByGroup`, `simplifyDebts`). Actions: `createGroup`, which wraps the `createGroup` factory and `addPerson` for members without the app. Empty: one outlined card, "Make a group for a trip, a flat or a dinner", with New group.

### Group detail

The group's card at the top as the header (name, currency, members), then "Balances" as one row per member per currency with the member sentence ("Casey is owed £758.76", "You owe £57.55", "Blake is settled up"), then "Settle up" with the plan from `simplifyDebts` (one row per transfer, the ones involving you first, a Settle up control on each) and a "Show direct debts" disclosure that lists `pairwiseDebts` instead, then "Pending" settlements with Confirm, then expenses grouped by month with the paid-by summary, then Invite. Invite has no backend: it opens the system share sheet with a plain-text summary of balances (a real, honest action) and says that in-app invites arrive with accounts. Reads: `useGroup` (`balancesByGroup`, `simplifyDebts`, `pairwiseDebts`, expenses and settlements newest first). Actions: `settleTransfer`, `recordSettlement`, `confirmSettlement`, `updateGroup` (validated with `groupUpdateIssues`), `archiveGroup`. States: multi-currency groups show a currency header per block; a group whose every member is settled shows "Everyone is settled up" in place of the plan; a missing group (after a reset) shows "This group no longer exists" with Back.

### Settle up

A sheet for one transfer: the two people, the amount as `readoutXL` in its currency, a method segmented row (cash, bank transfer, card, mobile payment, other), the date, an optional note, and two ways to finish: "Record as pending" (a normal button) for a payment that still has to be made or confirmed by the other person, and "Paid, settle now" as the Gate control. Partial amounts are allowed: editing the amount below the plan's figure records a partial payment and the plan recomputes. Reads: `useGroup`, `usePeople`. Actions: `recordSettlement` (pending), `confirmSettlement`, `settleTransfer`. States: an amount above what is owed warns inline; a zero amount disables both actions; success rolls the readout to zero, announces "Settled. You no longer owe Casey 57.55 British pounds", and closes.

### Activity

Large title "Activity", a filter chip row (All, Personal, each group), then rows grouped by day: expenses with description, category icon, paid-by summary and total in `readoutS`; settlements with the settlement sentence and a Pending or Confirmed chip. Reads: `useActivity`, `useGroups`. Row tap opens Expense detail, which shows the total, the payers, every resolved share from `expense.splits`, the stored `split` spec in words ("Split by percentage: 40, 30, 30"), and the actions Edit and Delete. Actions: `updateExpense` (rebuilds with `buildExpense` and keeps the id), `deleteExpense` (checked with `deletionIssues`). States: the empty feed says "Everything you log appears here" with Add expense; a filter with no matches says "Nothing for Flat share yet".

### Insights

A list sorted by the engine (warnings first). Each row: severity icon (warning in danger, notice in attention, info in tint), the title and the filled body in FinBuddy's copy, a Dismiss swipe action, and a "Why" disclosure that lists the `basis` rows with labelled values ("This month so far £312.00, average of the months before £118.40, months compared 3"). The detail screen adds the subject link: category to Spending, expense ids to Expense detail, settlement id to Settle up. Final copy per kind: `category_spike` "Food & dining is 2.6 times your usual this month"; `unusual_expense` "New laptop is 18 times your typical shopping expense"; `recurring_expense` "Train pass looks monthly, about £142.50, next around 1 Nov"; `settlement_overdue` "Your £200.00 to Casey was due 3 days ago"; `settlement_upcoming` "£45.00 from Devon is due in 2 days"; `budget_pace` "£312.00 of your £200.00 food budget, 16 days left". The footer states the truth: "Worked out on your phone from your own entries. Nothing is sent anywhere." Reads: `useInsights` (`generateInsights`, deterministic). Dismissals are app-local, keyed by the stable `insight.id`. States: no insights says "Nothing to flag. Keep logging and this fills in"; an insight whose subject was deleted hides itself.

### Profile and settings

A grouped list. Profile: name, default currency (search list), number and date format (read from the device, shown as a preview readout, with a note that it follows the system language). Appearance: System, Light, Dark; "Reduce motion in FinBuddy" (on top of the OS setting); haptics on or off. Privacy and data: "Your data stays on this phone" with the facts (no account, no server, no analytics); Export your data (`serializeSnapshot` to a JSON file shared through the system share sheet); Delete all data (the Gate in destructive intent, then onboarding). Sample data: Reset sample data, Remove sample data. Sign-in: the placeholder described above. About: version, licences, the GitHub link. Reads: `useProfile`, `useDataStatus`. Actions: `updateProfile` (`profiles.put`), `exportData`, `deleteAllData` (`replaceAll(emptySnapshot())`), `resetSampleData`, theme `setAppearance`, `setReduceMotionOverride`. States: storage refused shows the attention bar here with the explanation; export failure shows the error inline, never silently.

## 5. Signature moments

Each moment names its libraries, its budget on a mid-range Android phone (a 2023 Snapdragon 6-class device at 60 Hz, 16.6 ms per frame, target under 8 ms of UI-thread work per frame so the JS thread stays free), and its Reduce Motion rendition. There are five; they are related, not scattered, and nothing else in the app animates beyond platform transitions and feedback.

### Roll to Zero (the readout)

Every money figure is a `Readout` (code in section 7). `formatMoneyToParts` produces the characters, so symbol position, grouping and minor units are the engine's; each digit becomes a clipped column of ten glyphs that Reanimated translates to the new digit with the `roll` spring (critically damped, `overshootClamping`), on the UI thread via `useAnimatedStyle`. Columns are keyed from the right, so when £185.92 becomes £0.00 the surviving columns roll in place and the leading ones fade out through a layout transition. Budget: a Home card with three readouts is at most 24 animated columns, each one transform, under 2 ms per frame; no layout work during the roll because every column has a fixed height and tabular width. Reduce Motion: `ReduceMotion.System` makes the spring instant and the column dips to 20 percent opacity and back over 240 ms, a crossfade with no travel. Screen readers hear the final value once through the live region.

### The Gate (hold to confirm)

Money actions use `HoldToConfirm` (section 7): a Gesture Handler `LongPress` with `minDuration 600` drives a Reanimated progress value from 0 to 1 that a Skia `Path` reads as its `end`, closing a 56-point ring around the label; `expo-haptics` fires a light impact when the hold begins, a success notification at the gate, a selection tick if it is released early. Releasing early rewinds the ring in 160 ms. The gesture callbacks run as worklets and hop to JS only at the gate (`scheduleOnRN` from `react-native-worklets`). Budget: one Skia canvas of 56 by 56 points with two stroked arcs, redrawn only while the hold runs, under 1 ms per frame on the GPU. Reduce Motion and screen readers: the control becomes a standard button that opens the platform's two-step confirmation (`Alert`, which is a Material dialog on Android), with the same label and summary. Switch Control and keyboard users therefore never need a timed gesture.

### The split bar

In the split editor one bar shows every person's share as a segment of the group's line colour at full and reduced opacity, with the hatched remainder when amounts do not sum. In Exact mode the boundaries between segments are draggable (`Gesture.Pan` with `activeOffsetX`), moving money between two neighbours in whole minor units with a haptic tick every unit of the currency's major amount; the fields under the bar update through the same `evaluate()` and the engine's `validateSplit` keeps the sum exact. Budget: the bar is a Reanimated-animated `View` layout of at most six segments; drags update one shared value and six widths, under 3 ms per frame; no Skia needed. Reduce Motion: the drag is direct manipulation, not motion, so it stays; segment widths snap instead of easing. Accessibility: each boundary is an adjustable element with increment and decrement actions, and the fields remain the primary input for screen reader users.

### Fare cards

Group cards press with the `press` spring to 0.97 and release, and the card on the list is the shared element that becomes the header of Group detail: on iOS the push keeps the card's position through `react-native-screens`' native transition with the header card rendered at the same size, and on Android the card expands with Material's container transform rendered as a `fade_from_bottom` push over a 240 ms crossfade. The card's line colour, corner radius and chip stay constant between the two screens so the eye tracks the object. Budget: one transform per card during the press; no blur, no shadow animation. Reduce Motion: crossfade only.

### Why am I seeing this

Each insight row expands to show its `basis` rows with a 240 ms layout transition (`LinearTransition`) and the numbers inside set as `readoutS` that roll from zero when the disclosure opens, so the proof itself is a small readout. Budget: at most six rolling values, well under 2 ms. Reduce Motion: the rows appear with a crossfade and the values are static.

## 6. Marketing website

`apps/web` becomes a single-page static site: Vite 8, React 19.3, Tailwind 4, GSAP 3.15 with the plugins named below, three.js through React Three Fiber for one scene, and the real `@finbuddy/shared` engine aliased in for the demo. It deploys unchanged to Netlify at the root and to GitHub Pages under `/Finbuddy/` through the existing `BASE_PATH` env var; every link on the page is an in-page anchor, so the Pages fallback problem the audit found disappears.

### Section by section

1. **Hero: the Split Card.** Magenta field. Headline "Split the bill. Keep one picture of your money." in two lines; one sentence of copy; the two store buttons. The white Split Card holds a total with a currency selector (every `CURRENCY_CODES` entry with its display name), chips for up to six people, a Radix Tabs row for Equally, Exact, Percent and Shares, and live per-person rows from `resolveSplit`. The default sample is £100.00 split three ways, so the visitor immediately sees £33.34, £33.33, £33.33 with a caption "FinBuddy gives the extra penny to the first person, every time". Under the rows, "Settle" runs the Gate and the Roll to Zero. A "Sample" chip sits on the card.
2. **Every group is its own card.** A pinned scroll scene: the three.js card fan (code in section 7) with five ID-1 cards in line colours carrying sample readouts; copy on the left explains groups, members without the app, and per-currency balances. Layout family: pinned split.
3. **Exact in every currency.** A full-bleed graphite band with a horizontal rail scrubbed by ScrollTrigger: ¥12,345 split 1:1:2, KWD 10.000 split three ways, €1.234,56 in German formatting, each worked by the engine on the page. Layout family: horizontal rail. The point is proof, not decoration: every figure is computed, none is typed in.
4. **Settle without the awkward bit.** An SVG diagram of four people with six pairwise debts that collapse into two transfers when the section enters: GSAP Flip repositions the people, DrawSVG draws the two remaining arrows, MotionPath carries a small magenta token along each. Copy says what `simplifyDebts` does and that pending payments never change a balance until confirmed. Layout family: centred diagram with stacked copy.
5. **One picture of your money.** A 7/5 split: a six-month bar chart of own-share spending with the spike month marked, drawn in SVG from the sample data, and on the right an insight card showing its basis rows, with the sentence "Worked out on the phone. Nothing is sent anywhere." Layout family: asymmetric columns.
6. **What is true today.** Plain text: pre-launch, no accounts yet, everything on the phone, no bank sync, open source on GitHub, and a Radix Accordion FAQ (five questions: currencies, who pays the rounding, groups without the app, what happens offline, when it launches). Layout family: single column.
7. **Footer.** The lockup, the store buttons, GitHub, Privacy, the sample-data note, the year.

Seven sections use five layout families and no section repeats its neighbour's; there are no eyebrows, no section numbers, no scroll cues, no logo wall, no testimonials, and no counts.

### GSAP choreography

`motion.ts` (section 7) registers ScrollTrigger, SplitText, Flip, DrawSVGPlugin, MotionPathPlugin and CustomEase once and creates the `gate` ease from the app's emphasized-decelerate curve, so both surfaces settle the same way. Hero: a `useGSAP` timeline of SplitText lines (masked, 80 ms stagger), the card rising 40 px with 8 degrees of `rotateX` under a 1200 px perspective, then the buttons; total 1.35 s; `gsap.matchMedia` wraps it so under `prefers-reduced-motion: reduce` nothing is tweened and the content is simply there. Card fan: `ScrollTrigger` with `pin`, `scrub: 0.4`, `end: '+=120%'`, writing one progress number that `useFrame` reads. Currency rail: `scrub: true` horizontal translate of a flex row, `invalidateOnRefresh`. Settle diagram: `ScrollTrigger` at 60 percent visibility with `once: true`, `Flip.from` for layout, `DrawSVGPlugin` from "0%" to "100%" over 0.8 s, `MotionPathPlugin` for the token over 1.0 s. Chart bars: `ScrollTrigger.batch` with `scaleY` from 0 and `transformOrigin: bottom`. Not used, with reasons: ScrollSmoother and smooth-scroll libraries (they fight native scrolling on phones and screen readers), ScrambleText and TextPlugin (randomised digits look like fake money), Physics plugins, Draggable (the demo's inputs are real form controls).

### Three.js and ThreeUI

The card fan is custom three.js through `@react-three/fiber@9.8.1` and `three@0.186.1`: five `PlaneGeometry` cards at 1.586:1 with `CanvasTexture` labels drawn in Mona Sans, `MeshStandardMaterial`, one directional and one ambient light, `dpr` capped at 1.5, `frameloop="demand"` with `invalidate()` on scroll, `powerPreference: 'low-power'`, loaded with `React.lazy` when the section is within one viewport, disposed on unmount, and replaced by a static SVG of the same five cards when WebGL is unavailable. ThreeUI (`@designcodeio/threeui@1.2.0`) was read against the catalog and none of its 43 components is used: the closest candidates, `gallery` (editorial panels orbiting a rail), `structure-flow` and `constellation-field` (particle and node fields) and `brand-orbs` (AI status orbs), are each a world of their own and would read as a costume on a page whose world is the fare card; the library also ships runtime assets from `lib-dist/assets` and its own stylesheet, which the bundle does not need. If a later round wants a ThreeUI piece, `skeuomorphic-toggle` (flat modern variant) is the one place it would fit, as the theme switch.

### 21st.dev-style components

Written by hand in shadcn conventions (Tailwind 4, `class-variance-authority`, `clsx`, `tailwind-merge`, Radix primitives): `Button` (primary, secondary, ghost; capsule; pressed `scale-[0.98]`), `StoreButton`, `Card` (the ID-1 card with 12 px corners and the tinted shadow), `Tabs` (Radix Tabs for split methods), `Chip`, `Odometer` (section 7), `HoldButton` (the Gate on the web), `Accordion` (Radix), `Dialog` (Radix, for the launch notice), `ThemeToggle`, `AvatarGroup` (initials on line colours). Radii, colours, shadows and type are the brand's; nothing ships in shadcn's default look. Icons come from `@phosphor-icons/react` at one weight (regular), never emoji.

### App Store and Google Play

No store URLs exist, so the official badges cannot be used yet (both programs require the badge to link to a live listing). Until launch the two calls to action are FinBuddy buttons labelled "App Store" and "Google Play" with a second line "At launch"; they are real buttons that open a Radix Dialog saying the app is not in the stores yet and offering the one honest action available: "Watch releases on GitHub" (a real link to the repository's releases page). The same two labels appear in the hero and the footer and nowhere else. At launch, `StoreButton` swaps to the official "Download on the App Store" and "Get it on Google Play" artwork at the sizes the programs specify, linked to the listings, with the dialog removed.

### Staying honest with no proof

No testimonials, ratings, user counts, press or partner logos exist and none are invented. Proof is demonstration: the engine runs on the page, every number is computed, and sample data is labelled. Claims are limited to what the shipped code does (exact splits, per-currency balances, on-device insights, local-first storage). "Secure", "encrypted" and "bank-level" do not appear. The site has no newsletter form because nothing could receive it; it has no analytics script. The privacy page states what the site does (nothing is collected) in three sentences.

### Performance and accessibility on the web

Fonts self-hosted from `@fontsource-variable/mona-sans` with `font-display: swap` and a size-adjusted fallback; three.js and GSAP plugins beyond ScrollTrigger and SplitText are lazy chunks; LCP is the headline text, not an image; the hero card renders server-free in under 50 KB of JS before GSAP loads. Keyboard: every control is a real button, tab, or input with visible focus rings in the brand tint; the Gate on the web also accepts Enter and Space held for 600 ms, and a plain "Confirm" fallback button appears for `prefers-reduced-motion`. Contrast: body 7:1, magenta buttons 5.7:1, nothing below 4.5:1. Both colour schemes follow the system with a toggle.

## 7. Implementation plan

### Where the design lands

`apps/mobile/src/data` stays as it is. `apps/mobile/src/design` is new and holds the tokens, the theme, the primitives (`Text`, `Card`, `Row`, `Chip`, `Field`, `Skeleton`, `Icon` over `SymbolView`), `Readout` and `HoldToConfirm`. `apps/mobile/src/features/<area>` holds the screens' bodies; `apps/mobile/src/app` holds only routes and layouts, per `AGENTS.md`. `src/preview` is deleted once every screen has parity, but three files inside it are design-independent and move first: `add-expense/form.ts` to `src/features/expense/form.ts`, `format.ts` (the `Formatter`, the transfer and settlement sentences) to `src/features/common/format.ts`, and `insightCopy.ts` to `src/features/insights/copy.ts` with the final copy from section 4. `src/app/index.tsx` and the single-route trick go away; `app.json` gains `expo-symbols`, sets `predictiveBackGestureEnabled: true`, the new icon paths and `android.adaptiveIcon.backgroundColor: "#C2187A"`.

`apps/web` is rebuilt from an empty folder: `index.html`, `src/main.tsx`, `src/motion.ts`, `src/components`, `src/sections`, `src/three`, `src/styles.css` with the `@theme` tokens, and a `vite.config.ts` that keeps `base: process.env.BASE_PATH || '/'` and adds `resolve.alias['@finbuddy/shared'] = '../../packages/shared/src/index.ts'` so the demo runs the real engine without adding `apps/web` to the npm workspaces (Netlify and the Pages workflow keep installing `apps/web` on its own). The old `src`, the Express proxy, Recoil, Sentry, Formik, Slick and the runtime SEO and accessibility helpers are removed; `public/robots.txt` stays and `sitemap.xml` lists the one page.

### Data layer additions (`apps/mobile/src/data/actions.ts`)

All additive, all through the `Repository`: `startFresh(input)` (`createPerson`, `createProfile`, `replaceAll`), `keepSampleData()`, `createGroup(input)` and `addPerson(input)` (factories plus `groups.put` and `people.put`), `updateGroup(id, patch)` (checked with `groupUpdateIssues`), `archiveGroup(id)`, `updateProfile(patch)`, `updateExpense(id, draft)` (`buildExpense` then `put` with the original id and `createdAt`), `deleteExpense(id)` (checked with `deletionIssues`), `setBudget(input)` and `removeBudget(id)`, `exportData()` (`serializeSnapshot`), `deleteAllData()` (`replaceAll(emptySnapshot())`). New hooks: `useBudgets`, `useCategoryRecords(categoryId, currency)`; new selector `selectCategoryRecords` over `spendingRecords`.

### Dependencies to add

Mobile (`apps/mobile`, through `npx expo install` so the SDK pins are respected): `@expo-google-fonts/mona-sans@0.4.1`, `expo-symbols@57.0.3`, `expo-glass-effect@57.0.4`, `expo-sharing@57.0.22`, `@react-native-community/datetimepicker@9.2.1`, `@react-native-segmented-control/segmented-control@2.5.7`. Dev, at the repo root: `sharp@0.35.5` for the one-off icon rasterisation script. Already installed and used: `expo-haptics`, `expo-blur`, `react-native-svg`, `@shopify/react-native-skia`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-worklets`, `expo-localization`, `expo-secure-store`, `zustand`. `expo-gl` and `three` are not used in the app; nothing in the app needs real 3D, and the fare cards are flat on purpose.

Web (`apps/web`): `react@19.3.0`, `react-dom@19.3.0`, `gsap@3.15.0`, `@gsap/react@2.1.2`, `three@0.186.1`, `@react-three/fiber@9.8.1`, `@radix-ui/react-tabs@1.1.22`, `@radix-ui/react-dialog@1.2.0`, `@radix-ui/react-slot@1.4.0`, `class-variance-authority@0.7.1`, `clsx@2.1.1`, `tailwind-merge@3.7.0`, `@phosphor-icons/react@2.1.10`, `@fontsource-variable/mona-sans@5.3.0`. Dev: `vite@8.3.4`, `@vitejs/plugin-react@6.1.2`, `tailwindcss@4.3.3`, `@tailwindcss/vite@4.3.3`, `typescript@6.0.3` (the root's version), `@types/react@19.3.0`, `@types/react-dom@19.3.0`, `@types/three@0.186.0`. Not added: `@designcodeio/threeui`, `@react-three/drei`, `lenis`.

### Order of work

Day one verifies two risks before anything else: that the Mona Sans TTFs carry `tnum` (open the file with `fontkit` in a script or check `fontVariant` rendering on a device), and that `sharp` rasterises the six SVGs. Then: tokens and theme, primitives, `Readout` and `HoldToConfirm` with a storybook-style gallery route under `src/app/dev/` (excluded from production); the root and tab layouts; Add expense and the split editor (they exercise the engine hardest); Home; Groups, Group detail and Settle up; Spending; Activity and Expense detail; Insights; Settings; Onboarding; delete `src/preview`. The site follows: tokens, the Split Card, then the sections in order. Each phase ends with `npm run typecheck`, `npm run lint`, `npm test` at the root, an Expo web export for a layout pass, and a device pass on one iPhone and one mid-range Android in Expo Go or a development build (`expo-glass-effect` and `expo-symbols` need the development build on older Expo Go installs), in both appearances, at font scale 1.3 and at an accessibility Dynamic Type size, with Reduce Motion on and off.

### Code: the riskiest pieces

All mobile files below type-check with `tsc --strict` against the repository's installed packages (the fonts package is stubbed for the check since it is not installed yet). The web files follow the published 3.15 GSAP and 9.8 Fiber APIs and are checked once the site's dependencies exist.

`apps/mobile/src/design/tokens.ts`

```ts
// apps/mobile/src/design/tokens.ts
// FinBuddy design tokens. Exact values; semantic roles first, platform mappings beside them.
import { Easing, ReduceMotion, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';

/** Brand hue: Fare Magenta. Never used for owe/owed/error state; those have their own roles. */
export const BRAND = {
  magenta: '#C2187A', // light-mode tint. White on it: 5.7:1
  magentaBright: '#FF66B8', // dark-mode tint. #1A1420 on it: 6.9:1, on #1C1922: 6.6:1
  magentaDeep: '#7A0E4A',
  magentaInk: '#3F0527',
  magentaWash: '#FBE7F1',
} as const;

export interface SemanticColors {
  /** iOS systemGroupedBackground · M3 surface */
  ground: string;
  /** iOS secondarySystemGroupedBackground · M3 surfaceContainerLowest (light) / surfaceContainerLow (dark) */
  surface: string;
  /** iOS tertiarySystemGroupedBackground · M3 surfaceContainer */
  surfaceAlt: string;
  /** Sheets, menus · M3 surfaceContainerHigh */
  surfaceRaised: string;
  /** iOS tertiarySystemFill (inputs) · M3 surfaceContainerHighest */
  fill: string;
  /** iOS label · M3 onSurface */
  label: string;
  /** iOS secondaryLabel · M3 onSurfaceVariant */
  labelSecondary: string;
  /** iOS tertiaryLabel (kept >=4.5:1 on surface) · M3 outline when used as text */
  labelTertiary: string;
  /** iOS separator · M3 outlineVariant */
  separator: string;
  /** iOS tint · M3 primary */
  tint: string;
  /** Text/icon on tint · M3 onPrimary */
  onTint: string;
  /** iOS: tint at 10% · M3 primaryContainer */
  tintWash: string;
  /** M3 onPrimaryContainer */
  onTintWash: string;
  /** Owed to you (credit) · M3 tertiary. Never the only signal: the row also says "owed to you". */
  credit: string;
  creditWash: string;
  /** You owe: deliberately ink, not red. Debts between friends are not alarms. */
  debit: string;
  /** Pending, due soon · amber */
  attention: string;
  attentionWash: string;
  /** Overdue, failed save, destructive · iOS systemRed role · M3 error */
  danger: string;
  dangerWash: string;
  onDanger: string;
  /** Pressed-state overlay for Pressable */
  pressed: string;
  /** Skeleton bone */
  bone: string;
}

export const LIGHT: SemanticColors = {
  ground: '#F5F3F6',
  surface: '#FFFFFF',
  surfaceAlt: '#F0ECF2',
  surfaceRaised: '#FFFFFF',
  fill: '#EFEAF1',
  label: '#1A1420',
  labelSecondary: '#5F5564', // 7.1:1 on surface, 6.4:1 on ground
  labelTertiary: '#726778', // 5.3:1 on surface, 4.8:1 on ground
  separator: '#E4DEE6',
  tint: BRAND.magenta,
  onTint: '#FFFFFF',
  tintWash: BRAND.magentaWash,
  onTintWash: '#5A0A3A',
  credit: '#1F7A4D', // 5.3:1 on surface
  creditWash: '#D9F2E4',
  debit: '#1A1420',
  attention: '#9A5B00', // 5.4:1 on surface
  attentionWash: '#FFF0D6',
  danger: '#B3261E',
  dangerWash: '#F9DEDC',
  onDanger: '#FFFFFF',
  pressed: 'rgba(26,20,32,0.08)',
  bone: '#E9E4EB',
};

export const DARK: SemanticColors = {
  ground: '#121016',
  surface: '#1C1922',
  surfaceAlt: '#1F1B25',
  surfaceRaised: '#2A252F',
  fill: '#2A2431',
  label: '#F6F2F7',
  labelSecondary: '#B9AFBE', // 8:1 on surface
  labelTertiary: '#9A8FA0', // 5.5:1 on surface
  separator: '#332C3A',
  tint: BRAND.magentaBright,
  onTint: BRAND.magentaInk,
  tintWash: BRAND.magentaDeep,
  onTintWash: '#FFD6EA',
  credit: '#5FD39A', // 9:1 on surface
  creditWash: '#123D28',
  debit: '#F6F2F7',
  attention: '#FFB857',
  attentionWash: '#4A2E00',
  danger: '#FFB4AB',
  dangerWash: '#93000A',
  onDanger: '#690005',
  pressed: 'rgba(246,242,247,0.10)',
  bone: '#2A252F',
};

/**
 * Line colours: the flat card stock of each group. Assigned per group (hash of id, user can
 * change), never per currency. Each ships with the one label colour that passes 4.5:1 on it.
 */
export const LINE_COLORS = [
  { id: 'magenta', fill: '#C2187A', on: '#FFFFFF' },
  { id: 'violet', fill: '#6D3FC8', on: '#FFFFFF' },
  { id: 'tangerine', fill: '#E8620A', on: '#1A1420' },
  { id: 'marigold', fill: '#F2B705', on: '#1A1420' },
  { id: 'leaf', fill: '#1F7A4D', on: '#FFFFFF' },
  { id: 'moss', fill: '#6B7A1E', on: '#FFFFFF' },
  { id: 'cocoa', fill: '#7A4A2B', on: '#FFFFFF' },
  { id: 'graphite', fill: '#3B3B46', on: '#FFFFFF' },
] as const;
export type LineColor = (typeof LINE_COLORS)[number];

export function lineColorFor(id: string, overrides: Readonly<Record<string, LineColor['id']>> = {}): LineColor {
  const forced = overrides[id];
  if (forced) return LINE_COLORS.find((c) => c.id === forced) ?? LINE_COLORS[0];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return LINE_COLORS[h % LINE_COLORS.length] ?? LINE_COLORS[0];
}

/** Font families. Readouts and titles: Mona Sans (static weights from @expo-google-fonts/mona-sans). Body: the system face. */
export const FONT = {
  readout: 'MonaSans_700Bold',
  readoutMedium: 'MonaSans_600SemiBold',
  display: 'MonaSans_700Bold',
  title: 'MonaSans_600SemiBold',
  /** undefined = San Francisco on iOS, Roboto on Android */
  body: undefined as string | undefined,
} as const;

/**
 * Type roles. size/lineHeight in pt (iOS) and sp (Android), both scale with the system text size.
 * ios: the Dynamic Type style the role tracks · m3: the Material type role it fills.
 */
export const TYPE = {
  readoutXL: { size: 40, lineHeight: 44, family: FONT.readout, weight: '700', ios: 'largeTitle', m3: 'displaySmall', tabular: true },
  readoutL: { size: 28, lineHeight: 32, family: FONT.readout, weight: '700', ios: 'title1', m3: 'headlineMedium', tabular: true },
  readoutM: { size: 22, lineHeight: 28, family: FONT.readoutMedium, weight: '600', ios: 'title2', m3: 'titleLarge', tabular: true },
  readoutS: { size: 17, lineHeight: 22, family: FONT.readoutMedium, weight: '600', ios: 'headline', m3: 'titleMedium', tabular: true },
  display: { size: 34, lineHeight: 41, family: FONT.display, weight: '700', ios: 'largeTitle', m3: 'headlineLarge', tabular: false },
  title: { size: 22, lineHeight: 28, family: FONT.title, weight: '600', ios: 'title2', m3: 'titleLarge', tabular: false },
  headline: { size: 17, lineHeight: 22, family: FONT.body, weight: '600', ios: 'headline', m3: 'titleMedium', tabular: false },
  body: { size: 17, lineHeight: 22, family: FONT.body, weight: '400', ios: 'body', m3: 'bodyLarge', tabular: false },
  callout: { size: 16, lineHeight: 21, family: FONT.body, weight: '400', ios: 'callout', m3: 'bodyLarge', tabular: false },
  subhead: { size: 15, lineHeight: 20, family: FONT.body, weight: '400', ios: 'subheadline', m3: 'bodyMedium', tabular: false },
  footnote: { size: 13, lineHeight: 18, family: FONT.body, weight: '400', ios: 'footnote', m3: 'bodySmall', tabular: false },
  caption: { size: 12, lineHeight: 16, family: FONT.body, weight: '400', ios: 'caption1', m3: 'labelSmall', tabular: false },
} as const;
export type TypeRole = keyof typeof TYPE;

/** 4-point grid. */
export const SPACE = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32, xxxl: 48, gutter: 16 } as const;

/** Radii. 12 is the ISO/IEC 7810 ID-1 card corner (3.18 mm of 85.6 mm) at a 320-wide card. */
export const RADIUS = { card: 12, row: 12, input: 10, tile: 8, sheetIOS: 20, sheetM3: 28, pill: 999 } as const;

/** Touch targets: HIG 44 pt, Material 48 dp. */
export const TOUCH = { min: 44, minAndroid: 48, gap: 8 } as const;

/** Elevation. iOS draws none (grouped surfaces + hairlines); Android uses tonal surfaces; the FAB alone casts a shadow. */
export const SHADOW = {
  fab: { shadowColor: '#1A1420', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  none: { shadowOpacity: 0, elevation: 0 },
} as const;

export const DURATION = { instant: 100, quick: 160, standard: 240, slow: 320, readout: 560, hold: 600, focal: 800 } as const;

export const EASING = {
  standard: Easing.bezier(0.2, 0, 0, 1),
  emphasizedDecelerate: Easing.bezier(0.05, 0.7, 0.1, 1),
  emphasizedAccelerate: Easing.bezier(0.3, 0, 0.8, 0.15),
  linear: Easing.linear,
} as const;

/** Every animation config carries ReduceMotion.System: Reanimated itself skips motion when the OS asks. */
export const SPRING: Record<'press' | 'sheet' | 'gate', WithSpringConfig> & { roll: WithSpringConfig } = {
  press: { damping: 22, stiffness: 420, mass: 0.7, reduceMotion: ReduceMotion.System },
  sheet: { damping: 28, stiffness: 240, mass: 1, reduceMotion: ReduceMotion.System },
  gate: { damping: 18, stiffness: 200, mass: 1, reduceMotion: ReduceMotion.System },
  // Money never overshoots: critically damped and clamped, so a readout cannot show a value it never had.
  roll: { duration: DURATION.readout, dampingRatio: 1, overshootClamping: true, reduceMotion: ReduceMotion.System },
};

export const TIMING: Record<'quick' | 'standard' | 'slow' | 'hold', WithTimingConfig> = {
  quick: { duration: DURATION.quick, easing: EASING.standard, reduceMotion: ReduceMotion.System },
  standard: { duration: DURATION.standard, easing: EASING.emphasizedDecelerate, reduceMotion: ReduceMotion.System },
  slow: { duration: DURATION.slow, easing: EASING.emphasizedDecelerate, reduceMotion: ReduceMotion.System },
  // The hold is a progress bar, not motion for its own sake: it runs even under Reduce Motion.
  hold: { duration: DURATION.hold, easing: EASING.linear, reduceMotion: ReduceMotion.Never },
};
```

`apps/mobile/src/design/theme.tsx`

```tsx
// apps/mobile/src/design/theme.tsx
// Appearance (system / light / dark), Reduce Motion, and the platform's conventions, in one hook.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, useColorScheme, useWindowDimensions, type TextStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { DARK, LIGHT, RADIUS, TOUCH, TYPE, type SemanticColors, type TypeRole } from './tokens';

export type Appearance = 'system' | 'light' | 'dark';
const APPEARANCE_KEY = 'finbuddy.appearance';
const MOTION_KEY = 'finbuddy.reduceMotion';

export interface Theme {
  readonly scheme: 'light' | 'dark';
  readonly appearance: Appearance;
  readonly colors: SemanticColors;
  /** 'ios' follows the HIG; everything else (Android, the web preview) follows Material 3. */
  readonly platform: 'ios' | 'material';
  /** OS Reduce Motion / Remove animations, or the in-app override. Anything that moves checks this. */
  readonly reduceMotion: boolean;
  /** A screen reader is running: hold-to-confirm and drag editors swap to their two-step equivalents. */
  readonly screenReader: boolean;
  /** The system text size multiplier; layouts switch to stacked rows at >= 1.35. */
  readonly fontScale: number;
  readonly minTouch: number;
  readonly sheetRadius: number;
  setAppearance(next: Appearance): void;
  setReduceMotionOverride(next: boolean): void;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const osReduceMotion = useReducedMotion();
  const { fontScale } = useWindowDimensions();
  const [appearance, setAppearanceState] = useState<Appearance>('system');
  const [motionOverride, setMotionOverride] = useState(false);
  const [screenReader, setScreenReader] = useState(false);

  useEffect(() => {
    void AsyncStorage.multiGet([APPEARANCE_KEY, MOTION_KEY])
      .then((pairs) => {
        for (const [key, value] of pairs) {
          if (key === APPEARANCE_KEY && (value === 'light' || value === 'dark' || value === 'system')) setAppearanceState(value);
          if (key === MOTION_KEY) setMotionOverride(value === 'true');
        }
      })
      .catch(() => {
        // Storage refused: keep the defaults for this session.
      });
    let active = true;
    void AccessibilityInfo.isScreenReaderEnabled().then((on) => active && setScreenReader(on)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReader);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  const value = useMemo<Theme>(() => {
    const scheme = appearance === 'system' ? (system === 'dark' ? 'dark' : 'light') : appearance;
    const platform = Platform.OS === 'ios' ? 'ios' : 'material';
    return {
      scheme,
      appearance,
      colors: scheme === 'dark' ? DARK : LIGHT,
      platform,
      reduceMotion: osReduceMotion || motionOverride,
      screenReader,
      fontScale,
      minTouch: platform === 'ios' ? TOUCH.min : TOUCH.minAndroid,
      sheetRadius: platform === 'ios' ? RADIUS.sheetIOS : RADIUS.sheetM3,
      setAppearance: (next) => {
        setAppearanceState(next);
        AsyncStorage.setItem(APPEARANCE_KEY, next).catch(() => {});
      },
      setReduceMotionOverride: (next) => {
        setMotionOverride(next);
        AsyncStorage.setItem(MOTION_KEY, String(next)).catch(() => {});
      },
    };
  }, [appearance, system, osReduceMotion, motionOverride, screenReader, fontScale]);

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): Theme {
  const theme = use(ThemeContext);
  if (!theme) throw new Error('useTheme() needs <ThemeProvider>');
  return theme;
}

/**
 * A text style for a type role. Sizes scale with Dynamic Type / font scale through RN's own
 * allowFontScaling; readouts cap at 1.6x via maxFontSizeMultiplier where they are rendered,
 * and amounts never truncate: they shrink (adjustsFontSizeToFit) before they clip.
 */
export function textStyle(role: TypeRole, colors: SemanticColors, color: keyof SemanticColors = 'label'): TextStyle {
  const t = TYPE[role];
  return {
    fontSize: t.size,
    lineHeight: t.lineHeight,
    fontFamily: t.family,
    // When a brand face is set, weight comes from the file; when the system face is used, from fontWeight.
    fontWeight: t.family ? undefined : (t.weight as TextStyle['fontWeight']),
    color: colors[color],
    ...(t.tabular ? { fontVariant: ['tabular-nums'] as TextStyle['fontVariant'] } : {}),
  };
}
```

`apps/mobile/src/design/Readout.tsx`

```tsx
// apps/mobile/src/design/Readout.tsx
// The signature: a money readout whose digits roll like a gate display. Exact digits only; the
// text is produced by formatMoneyToParts, so locale, symbol and minor units are the engine's.
import { formatMoney, formatMoneyToParts, type Money } from '@finbuddy/shared';
import { useEffect } from 'react';
import { StyleSheet, Text, View, type TextStyle } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { useTheme, textStyle } from './theme';
import { SPRING, TIMING, TYPE, type TypeRole } from './tokens';

type ReadoutRole = Extract<TypeRole, 'readoutXL' | 'readoutL' | 'readoutM' | 'readoutS'>;

export interface ReadoutProps {
  money: Money;
  locale: string;
  role?: ReadoutRole;
  /** 'exceptZero' shows +/- for signed balances; direction words usually carry this instead. */
  signDisplay?: 'auto' | 'always' | 'exceptZero' | 'never';
  color?: 'label' | 'labelSecondary' | 'tint' | 'onTint' | 'credit' | 'debit' | 'danger';
  /** Announce changes to screen readers (settle-up confirmation). */
  live?: boolean;
  style?: TextStyle;
}

type Token = { kind: 'digit'; value: number } | { kind: 'text'; value: string; type: string };

function tokenize(parts: { type: string; value: string }[]): Token[] {
  const out: Token[] = [];
  for (const part of parts) {
    if (part.type === 'integer' || part.type === 'fraction') {
      for (const ch of part.value) {
        const n = Number(ch);
        out.push(Number.isInteger(n) ? { kind: 'digit', value: n } : { kind: 'text', value: ch, type: part.type });
      }
    } else {
      out.push({ kind: 'text', value: part.value, type: part.type });
    }
  }
  return out;
}

export function Readout({ money, locale, role = 'readoutL', signDisplay = 'auto', color = 'label', live, style }: ReadoutProps) {
  const theme = useTheme();
  const base = { ...textStyle(role, theme.colors, color), ...style };
  const lineHeight = TYPE[role].lineHeight;
  const tokens = tokenize(formatMoneyToParts(money, { locale, signDisplay }));
  const keys = stableKeys(tokens);
  const spoken = formatMoney(money, { locale, signDisplay, currencyDisplay: 'name' });
  return (
    <Animated.View
      layout={theme.reduceMotion ? undefined : LinearTransition.duration(TIMING.standard.duration ?? 240)}
      accessible
      accessibilityRole="text"
      accessibilityLabel={spoken}
      accessibilityLiveRegion={live ? 'polite' : 'none'}
      style={[styles.row, { height: lineHeight }]}
    >
      {tokens.map((token, i) => {
        const key = keys[i] ?? String(i);
        return token.kind === 'digit' ? (
          <DigitColumn key={key} digit={token.value} textStyle={base} lineHeight={lineHeight} reduceMotion={theme.reduceMotion} />
        ) : (
          <Animated.Text key={key} entering={FadeIn} exiting={FadeOut} style={[base, styles.noWrap]} importantForAccessibility="no">
            {token.value}
          </Animated.Text>
        );
      })}
    </Animated.View>
  );
}

/**
 * Keys counted from the right, per kind: when £185.92 becomes £0.00 the surviving digit columns
 * keep their keys and roll in place, the currency symbol keeps its key and stays, and only the
 * leading columns leave.
 */
function stableKeys(tokens: readonly Token[]): string[] {
  const seen = new Map<string, number>();
  const keys = new Array<string>(tokens.length);
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i]!;
    const kind = t.kind === 'digit' ? 'digit' : t.type;
    const n = (seen.get(kind) ?? 0) + 1;
    seen.set(kind, n);
    keys[i] = `${kind}-${n}`;
  }
  return keys;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function DigitColumn({ digit, textStyle: ts, lineHeight, reduceMotion }: { digit: number; textStyle: TextStyle; lineHeight: number; reduceMotion: boolean }) {
  const y = useSharedValue(-digit * lineHeight);
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion) {
      // No travel: a crossfade is the Reduce Motion rendition of the roll.
      opacity.value = withSequence(withTiming(0.2, { duration: 80 }), withTiming(1, { duration: 160 }));
      y.value = withTiming(-digit * lineHeight, { duration: 0 });
    } else {
      y.value = withSpring(-digit * lineHeight, SPRING.roll);
    }
  }, [digit, lineHeight, reduceMotion, y, opacity]);
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }], opacity: opacity.value }));
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={[styles.column, { height: lineHeight }]} importantForAccessibility="no-hide-descendants">
      <Animated.View style={animated}>
        {DIGITS.map((d) => (
          <Text key={d} style={[ts, styles.noWrap, { height: lineHeight }]} allowFontScaling={false}>
            {d}
          </Text>
        ))}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', overflow: 'hidden' },
  column: { overflow: 'hidden' },
  noWrap: { includeFontPadding: false, textAlignVertical: 'center' },
});

/**
 * Sizing rule used by callers: the readout container scales with the system font size up to 1.6x
 * (wrap it in a View that reads useWindowDimensions().fontScale), and the amount is never
 * truncated. When a currency readout would not fit its row, the caller drops one role
 * (readoutXL -> readoutL) before anything else moves.
 */
export function fitRole(preferred: ReadoutRole, fontScale: number, longestDigits: number): ReadoutRole {
  if (fontScale >= 1.35 && longestDigits > 8) return 'readoutM';
  if (fontScale >= 1.35 || longestDigits > 10) return preferred === 'readoutXL' ? 'readoutL' : preferred;
  return preferred;
}
```

`apps/mobile/src/design/HoldToConfirm.tsx`

```tsx
// apps/mobile/src/design/HoldToConfirm.tsx
// The gate. Money actions (settle up, confirm a payment) are confirmed by touch-and-hold for 600 ms
// while a Skia ring closes around the amount, with a haptic at the start and at the gate.
// Screen-reader users and Reduce Motion get the platform's two-step confirmation instead.
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { AccessibilityInfo, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, useAnimatedStyle, useDerivedValue, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useTheme, textStyle } from './theme';
import { DURATION, SPACE, SPRING, TIMING, TOUCH } from './tokens';

export interface HoldToConfirmProps {
  /** Button copy, e.g. "Settle up". Named for its action; never "OK". */
  label: string;
  /** Spoken summary for the confirmation, e.g. "Pay Casey £57.55". */
  summary: string;
  onConfirm: () => void;
  disabled?: boolean;
  /** 'destructive' colours the ring and label with the danger role (delete all data). */
  intent?: 'money' | 'destructive';
}

const RING = 56;
const STROKE = 4;

export function HoldToConfirm({ label, summary, onConfirm, disabled, intent = 'money' }: HoldToConfirmProps) {
  const theme = useTheme();
  const c = theme.colors;
  const accent = intent === 'destructive' ? c.danger : c.tint;
  const progress = useSharedValue(0);
  const pressScale = useSharedValue(1);

  const ring = useMemo(() => {
    const p = Skia.Path.Make();
    const r = RING / 2 - STROKE / 2;
    // Starts at 12 o'clock and runs clockwise; `end` is driven by the hold progress.
    p.addArc({ x: STROKE / 2, y: STROKE / 2, width: r * 2, height: r * 2 }, -90, 359.9);
    return p;
  }, []);
  const end = useDerivedValue(() => progress.value);

  const haptic = (kind: 'start' | 'gate' | 'cancel') => {
    if (kind === 'gate') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (kind === 'start') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else void Haptics.selectionAsync();
  };
  const confirm = () => {
    AccessibilityInfo.announceForAccessibility(`${summary}. Confirmed.`);
    onConfirm();
  };

  const hold = Gesture.LongPress()
    .enabled(!disabled)
    .minDuration(DURATION.hold)
    .maxDistance(24)
    .onBegin(() => {
      pressScale.value = withSpring(0.97, SPRING.press);
      progress.value = withTiming(1, TIMING.hold);
      scheduleOnRN(haptic, 'start');
    })
    .onStart(() => {
      // The gate: the hold reached 600 ms with the finger still down.
      scheduleOnRN(haptic, 'gate');
      scheduleOnRN(confirm);
    })
    .onFinalize((_event, success) => {
      pressScale.value = withSpring(1, SPRING.press);
      if (!success) {
        cancelAnimation(progress);
        progress.value = withTiming(0, TIMING.quick);
        scheduleOnRN(haptic, 'cancel');
      } else {
        progress.value = withTiming(0, { ...TIMING.standard, duration: DURATION.slow });
      }
    });

  const scaled = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }));

  // Two-step path: a screen reader is on, Reduce Motion is on, or the platform has no gesture handler.
  if (theme.screenReader || theme.reduceMotion) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={`Asks you to confirm: ${summary}`}
        disabled={disabled}
        onPress={() =>
          Alert.alert(label, summary, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Confirm', style: intent === 'destructive' ? 'destructive' : 'default', onPress: confirm },
          ])
        }
        style={({ pressed }) => [styles.button, { backgroundColor: accent, minHeight: theme.minTouch, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 }]}
      >
        <Text style={[textStyle('headline', c, 'onTint'), { color: intent === 'destructive' ? c.onDanger : c.onTint }]}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <GestureDetector gesture={hold}>
      <Animated.View
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Touch and hold to confirm"
        accessibilityState={{ disabled: !!disabled }}
        style={[styles.button, scaled, { backgroundColor: accent, minHeight: theme.minTouch, opacity: disabled ? 0.4 : 1 }]}
      >
        <View style={styles.ringBox} importantForAccessibility="no">
          <Canvas style={{ width: RING, height: RING }}>
            <Circle cx={RING / 2} cy={RING / 2} r={RING / 2 - STROKE / 2} color={intent === 'destructive' ? c.onDanger : c.onTint} opacity={0.3} style="stroke" strokeWidth={STROKE} />
            <Path path={ring} color={intent === 'destructive' ? c.onDanger : c.onTint} style="stroke" strokeWidth={STROKE} strokeCap="round" start={0} end={end} />
          </Canvas>
        </View>
        <Text style={[textStyle('headline', c, 'onTint'), { color: intent === 'destructive' ? c.onDanger : c.onTint }]} numberOfLines={2}>
          {label}
        </Text>
        <Text style={[textStyle('footnote', c, 'onTint'), { color: intent === 'destructive' ? c.onDanger : c.onTint, opacity: 0.85 }]} numberOfLines={1}>
          Hold to confirm
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center', gap: SPACE.xs, paddingVertical: SPACE.m, paddingHorizontal: SPACE.xl, borderRadius: 999, minWidth: TOUCH.minAndroid * 3 },
  ringBox: { width: RING, height: RING, marginBottom: SPACE.xs },
});
```

`apps/mobile/src/app/_layout.tsx`

```tsx
// apps/mobile/src/app/_layout.tsx
// Root: fonts, theme, data store, the stack that holds the tabs and the app-wide modals.
import { MonaSans_600SemiBold, MonaSans_700Bold, useFonts } from '@expo-google-fonts/mona-sans';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { startDataStore } from '@/data';
import { ThemeProvider, useTheme } from '@/design/theme';

export default function RootLayout() {
  // Fonts load in parallel with the store; screens render the system face until they arrive
  // (no splash wait: the readout face swaps in on first layout, which Reduce Motion users never notice).
  useFonts({ MonaSans_600SemiBold, MonaSans_700Bold });
  useEffect(() => {
    void startDataStore();
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <RootStack />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  const { colors, scheme, platform } = useTheme();
  const ios = platform === 'ios';
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerTintColor: colors.tint, headerTitleStyle: { color: colors.label }, contentStyle: { backgroundColor: colors.ground } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        {/* Add expense: an iOS form sheet that starts at 92% and can grow; Android gets a full-screen Material dialog. */}
        <Stack.Screen
          name="add"
          options={{
            headerShown: false,
            presentation: ios ? 'formSheet' : 'fullScreenModal',
            sheetAllowedDetents: ios ? [0.92, 1] : undefined,
            sheetGrabberVisible: ios,
            sheetCornerRadius: ios ? 20 : undefined,
            animation: Platform.OS === 'android' ? 'fade_from_bottom' : undefined,
          }}
        />
        <Stack.Screen name="settle" options={{ title: 'Settle up', presentation: ios ? 'formSheet' : 'fullScreenModal', sheetAllowedDetents: ios ? 'fitToContents' : undefined }} />
        <Stack.Screen name="expense/[expenseId]" options={{ title: 'Expense' }} />
        <Stack.Screen name="settings" options={{ headerShown: false, presentation: ios ? 'modal' : 'card' }} />
      </Stack>
    </>
  );
}
```

`apps/mobile/src/app/(tabs)/_layout.tsx`

```tsx
// apps/mobile/src/app/(tabs)/_layout.tsx
// Four sections, native on each OS: UITabBarController on iOS (Liquid Glass on iOS 26, with the
// "Add expense" bottom accessory), Material 3 navigation bar on Android (with the FAB on screens).
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useTheme } from '@/design/theme';

export default function TabsLayout() {
  const { colors, platform } = useTheme();
  return (
    <NativeTabs
      tintColor={colors.tint}
      iconColor={{ default: colors.labelSecondary, selected: colors.tint }}
      backgroundColor={platform === 'ios' ? undefined : colors.surface}
      minimizeBehavior={platform === 'ios' ? 'onScrollDown' : undefined}
      labelVisibilityMode="labeled"
    >
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(groups)">
        <NativeTabs.Trigger.Label>Groups</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} md="group" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(spending)">
        <NativeTabs.Trigger.Label>Spending</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} md="bar_chart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(activity)">
        <NativeTabs.Trigger.Label>Activity</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'clock', selected: 'clock.fill' }} md="history" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

Using them in the settle sheet is three lines: `<Readout money={transfer.amount} locale={locale} role="readoutXL" live />` for the figure, `<HoldToConfirm label="Paid, settle now" summary={sentence.spoken} onConfirm={() => void settleTransfer(groupId, transfer)} />` for the Gate, and the readout rolls to zero because the store's snapshot changes and the component re-renders with the new amount.

`apps/web/src/motion.ts`

```ts
// apps/web/src/motion.ts
// One registration, one brand ease, one Reduce Motion gate for the whole site.
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { Flip } from 'gsap/Flip';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText, Flip, DrawSVGPlugin, MotionPathPlugin, CustomEase);
// The gate ease: Material's emphasized-decelerate, so the site and the app settle the same way.
CustomEase.create('gate', 'M0,0 C0.05,0.7 0.1,1 1,1');

export const MOTION = { quick: 0.16, standard: 0.24, slow: 0.32, readout: 0.56, focal: 0.8 } as const;

/** Everything authored for motion lives inside this; the reduce branch only sets final states. */
export function withMotion(build: (ctx: gsap.Context) => void, still: (ctx: gsap.Context) => void = () => {}) {
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', build);
  mm.add('(prefers-reduced-motion: reduce)', still);
  return () => mm.revert();
}
```

`apps/web/src/components/Odometer.tsx`

```tsx
// apps/web/src/components/Odometer.tsx
// The Readout on the web: GSAP rolls each digit column; Reduce Motion crossfades instead.
import { formatMoney, formatMoneyToParts, type Money } from '@finbuddy/shared';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { useLayoutEffect, useRef } from 'react';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const roll = { duration: 0.56, ease: 'gate' }; // CustomEase 'gate' registered once in motion.ts

export function Odometer({ money, locale, className }: { money: Money; locale: string; className?: string }) {
  const root = useRef<HTMLSpanElement>(null);
  const parts = formatMoneyToParts(money, { locale });
  const tokens = parts.flatMap((p) => (p.type === 'integer' || p.type === 'fraction' ? [...p.value].map((ch) => ({ digit: DIGITS.includes(ch), ch })) : [{ digit: false, ch: p.value }]));
  const spoken = formatMoney(money, { locale, currencyDisplay: 'name' });

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('[data-col]', root.current).forEach((col) => {
          const n = Number(col.dataset.col);
          gsap.to(col.firstElementChild, { yPercent: -n * 10, ...roll, overwrite: true });
        });
      });
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.utils.toArray<HTMLElement>('[data-col]', root.current).forEach((col) => {
          const n = Number(col.dataset.col);
          gsap.set(col.firstElementChild, { yPercent: -n * 10 });
          gsap.fromTo(col, { opacity: 0.3 }, { opacity: 1, duration: 0.2, overwrite: true });
        });
      });
      return () => mm.revert();
    },
    { dependencies: [money.amountMinor, money.currency, locale], scope: root },
  );

  // Before the first paint, columns sit on their digit so nothing rolls in from zero on load.
  useLayoutEffect(() => {
    gsap.utils.toArray<HTMLElement>('[data-col]', root.current).forEach((col) => gsap.set(col.firstElementChild, { yPercent: -Number(col.dataset.col) * 10 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span ref={root} className={`inline-flex tabular-nums leading-none ${className ?? ''}`} role="text" aria-label={spoken}>
      {tokens.map((t, i) => {
        const key = `${t.digit ? 'd' : 't'}-${tokens.length - i}`;
        return t.digit ? (
          <span key={key} data-col={t.ch} className="inline-block h-[1em] overflow-hidden" aria-hidden="true">
            <span className="flex flex-col will-change-transform">
              {DIGITS.map((d) => (
                <span key={d} className="h-[1em] block">
                  {d}
                </span>
              ))}
            </span>
          </span>
        ) : (
          <span key={key} aria-hidden="true">
            {t.ch}
          </span>
        );
      })}
    </span>
  );
}
```

`apps/web/src/sections/Hero.tsx`

```tsx
// apps/web/src/sections/Hero.tsx (choreography only; the SplitCard holds the live engine demo)
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import { useRef } from 'react';

import { MOTION, withMotion } from '../motion';
import { SplitCard } from '../components/SplitCard';
import { StoreButtons } from '../components/StoreButtons';

export function Hero() {
  const scope = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const headline = scope.current?.querySelector<HTMLElement>('h1');
      if (!headline) return;
      return withMotion(() => {
        // Content is visible by default; the from() states exist only while this timeline runs.
        const split = SplitText.create(headline, { type: 'lines', mask: 'lines', linesClass: 'line' });
        const tl = gsap.timeline({ defaults: { ease: 'gate' } });
        tl.from(split.lines, { yPercent: 110, duration: MOTION.focal, stagger: 0.08 })
          .from('[data-hero-copy]', { y: 16, autoAlpha: 0, duration: MOTION.slow }, '-=0.45')
          .from('[data-hero-card]', { y: 40, rotateX: -8, autoAlpha: 0, duration: MOTION.focal, transformPerspective: 1200 }, '-=0.5')
          .from('[data-hero-cta] > *', { y: 12, autoAlpha: 0, duration: MOTION.standard, stagger: 0.06 }, '-=0.4');
        return () => split.revert();
      });
    },
    { scope },
  );

  return (
    <section ref={scope} className="bg-brand text-on-brand">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 pb-16 pt-14 md:grid-cols-12 md:gap-8 md:px-8 md:pt-20">
        <div className="md:col-span-5">
          <h1 className="font-display text-[2.5rem] leading-[1.02] tracking-[-0.02em] md:text-[3.5rem]" style={{ fontStretch: '110%' }}>
            Split the bill. Keep one picture of your money.
          </h1>
          <p data-hero-copy className="mt-5 max-w-[34ch] text-lg text-on-brand/85">
            Shared costs and your own spending in one exact ledger, in every currency you use.
          </p>
          <div data-hero-cta className="mt-8 flex flex-wrap gap-3">
            <StoreButtons />
          </div>
        </div>
        <div data-hero-card className="md:col-span-7">
          <SplitCard sample />
        </div>
      </div>
    </section>
  );
}
```

`apps/web/src/three/CardFan.tsx`

```tsx
// apps/web/src/three/CardFan.tsx
// "Every group is its own card": five ID-1 cards (1.586:1) fanned by scroll. Custom three.js via
// React Three Fiber; labels are drawn into CanvasTextures so no extra text library ships.
import { Canvas, useFrame } from '@react-three/fiber';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

const CARDS = [
  { name: 'Flat share', readout: '£57.55 to Casey', fill: '#1F7A4D', on: '#FFFFFF' },
  { name: 'Trip to Japan', readout: '¥21,486 owed to you', fill: '#6D3FC8', on: '#FFFFFF' },
  { name: 'Dinner club', readout: '$135.99 owed to you', fill: '#E8620A', on: '#1A1420' },
  { name: 'Personal', readout: '£1,124.50 this month', fill: '#3B3B46', on: '#FFFFFF' },
  { name: 'FinBuddy', readout: 'Sample data', fill: '#C2187A', on: '#FFFFFF' },
];

function label(card: (typeof CARDS)[number]): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 646; // 1.586:1
  const g = c.getContext('2d')!;
  g.fillStyle = card.fill;
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = card.on;
  g.font = '600 56px "Mona Sans Variable", system-ui, sans-serif';
  g.fillText(card.name, 72, 120);
  g.font = '700 88px "Mona Sans Variable", system-ui, sans-serif';
  g.fillText(card.readout, 72, 540);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** progress 0: a stacked wallet. progress 1: a fan. Written by ScrollTrigger, read by useFrame. */
function Fan({ progress }: { progress: { value: number } }) {
  const group = useRef<THREE.Group>(null);
  const textures = useMemo(() => CARDS.map(label), []);
  const geometry = useMemo(() => new THREE.PlaneGeometry(3.172, 2), []);
  useFrame(() => {
    const p = progress.value;
    group.current?.children.forEach((mesh, i) => {
      const k = i - (CARDS.length - 1) / 2;
      mesh.position.set(k * 1.25 * p, Math.abs(k) * -0.18 * p, i * 0.02 + k * 0.1 * p);
      mesh.rotation.set(0, 0, k * -0.18 * p);
    });
  });
  return (
    <group ref={group}>
      {CARDS.map((card, i) => (
        <mesh key={card.name} geometry={geometry} position={[0, 0, i * 0.02]}>
          <meshStandardMaterial map={textures[i]} roughness={0.55} metalness={0.05} />
        </mesh>
      ))}
    </group>
  );
}

export function CardFan() {
  const section = useRef<HTMLDivElement>(null);
  const progress = useRef({ value: 0 }).current;
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.to(progress, { value: 1, ease: 'none', scrollTrigger: { trigger: section.current, start: 'top top', end: '+=120%', pin: true, scrub: 0.4 } });
      });
      mm.add('(prefers-reduced-motion: reduce)', () => {
        progress.value = 1; // the fan is the resting state; nothing moves on scroll
      });
      return () => mm.revert();
    },
    { scope: section },
  );
  return (
    <div ref={section} className="h-[70vh] w-full">
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 7], fov: 35 }} gl={{ antialias: true, powerPreference: 'low-power' }} frameloop="demand">
        <ambientLight intensity={1.1} />
        <directionalLight position={[2, 4, 6]} intensity={1.2} />
        <Fan progress={progress} />
      </Canvas>
    </div>
  );
}
// Note: frameloop="demand" needs invalidate() when progress changes; the ScrollTrigger onUpdate
// callback calls the root's invalidate (wired in the page), so the GPU idles between scroll events.
```

## 8. Risks and trade-offs

- **Tabular figures in Mona Sans.** The readout depends on `tnum` so that columns do not jitter. If the shipped TTF lacks it, the fallback is the platform face for readouts (SF Pro and Roboto both have tabular figures through `fontVariant`), which keeps the move and loses some brand voice. This is checked on day one, not discovered on a device.
- **Magenta is a loud choice for money.** It is used as one tint on quiet surfaces, never as a ground inside the app, and the line colours carry the colour load. The site's hero field is the only drenched use. If the team finds it too loud after a device pass, the tint drops one step to `#A8146A` without changing anything else.
- **Mona Sans and the width axis.** Native gets static weights only (React Native cannot drive variable axes), so the 110 percent display width exists on the site and not in the app. The app's display voice is weight and size; that is a deliberate difference, not a drift.
- **Native tabs are "unstable" in expo-router 57.** The import path says so. The fallback is `expo-router`'s JS `Tabs` with the same four triggers; the bottom accessory and Liquid Glass are iOS 26 bonuses, not requirements, and the "+" navigation-bar button covers every iOS version.
- **Hold to confirm is a timed gesture.** It is wrapped in the two-step path for screen readers and Reduce Motion, but a person with a motor impairment who uses neither setting still faces a 600 ms hold. Settings therefore exposes "Confirm with a dialog instead of holding", wired to the same two-step path.
- **Group colours are app-local.** They are not in the shared model, so they do not sync when a backend arrives. The hash assignment is deterministic, so two phones would still agree by default; overrides would need a model field later.
- **The site's demo runs the real engine.** A future breaking change in `packages/shared` breaks the site build, which is the intended coupling: the site cannot drift from what the app computes.
- **No store badges yet.** The pre-launch buttons are honest but weaker than official badges; the swap at launch is a one-component change.
- **Insights are rules, not a model.** The product calls them insights, never "AI", until a backend model exists and the consent flow is designed. The marketing copy follows the same rule.
- **Non-Latin digits.** For locales that format with Arabic-Indic or Devanagari digits, `Readout` renders them correctly but statically (the roll recognises ASCII digits only). This is correct money with less motion, and the fix is a small tokeniser extension.

### Stress tests applied to this direction

Five hostile scenarios were run against the design before it was written down, and each produced a rule above.

1. Dynamic Type at the largest accessibility size with "KWD 1,234,567.890" on the Home card overflowed `readoutXL`. Fix: readouts cap at 1.6 times, `fitRole` drops a size for long figures, amounts shrink to fit and never truncate, and rows stack at font scale 1.35.
2. A group with three currencies, two archived members and everyone settled produced a card with six readouts. Fix: two readouts and "+1 more", "Settled" instead of zero readouts, archived groups last at reduced opacity.
3. VoiceOver with Reduce Motion on the settle sheet could not perform the hold. Fix: the two-step `Alert` path, the crossfade readout, and a live-region announcement with the currency name.
4. Storage refused in a private browser session of the web preview silently lost edits. Fix: the `persistent` flag surfaces as the attention bar on Home and Settings, and the Privacy screen explains it.
5. The site with WebGL unavailable and scripts blocked showed an empty hero. Fix: content is visible by default with no CSS-hidden initial states, GSAP `from()` tweens exist only inside `matchMedia`, the card fan has a static SVG fallback, and the Split Card works on React state alone.

A sixth, found while writing: German input "1.234,56" in the amount field. `parseMoneyInput` with the device locale already handles it, and the readout shows "1.234,56 €" with the symbol trailing because `formatMoneyToParts` places it; the tokeniser needed no change.
