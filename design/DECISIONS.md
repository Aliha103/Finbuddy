# Design decisions after the direction was chosen

Changes to the chosen direction (`DIRECTION.md`), made by the founder or, where a heading says so, by a design review. These override the direction where they conflict.

## 2026-10-11: tint is graphite, not magenta; quieter surfaces

- **Tint.** The single brand tint is **Graphite `#4A4652`** (white on it: 9.2:1). Dark mode tint `#CFC8D6` with ink `#1A1420` on it. Wash `#ECE9EF` light / `#2E2935` dark. "Fare Magenta" `#C2187A` is retired everywhere: tokens, the mark and wordmark i-dot, app icons, the splash, the site. Nothing else in the colour system changes: owing is ink, owed is Leaf green with the words, attention amber, red only for overdue, failure and destructive actions.
- **Intensity.** Quieter. Surfaces are white and tinted grey. The tint appears only on the FinBuddy card (Home), filled buttons, links, the active tab and the mark. The onboarding screen is a white card on the tinted ground, not a full-bleed colour field. The site hero sits on the ground colour with graphite type, not a full-bleed field.
- **Group cards.** White cards on the ground, with the group's line colour as a 6 pt band on the leading edge and in the name chip, instead of a fully coloured card. The line-colour set loses magenta and graphite (one is retired, the other is now the tint) and gains **cobalt `#1F4FD8`** and **teal `#0F7B86`**: violet, tangerine, marigold, leaf, moss, cocoa, cobalt, teal.
- **Rationale.** Founder's call on the hue ("graphite"). Quieter intensity keeps the direction's structure (one exact readout per currency, the Gate, Roll to Zero, the per-platform navigation table) while reading as a tool rather than a poster.

## 2026-10-11: the app runs on the web; the site moves to /web/

- **Hosting.** The finbuddych Netlify site serves the app's web export at `/` and the website at `/web/`. GitHub Pages keeps serving the website under `/Finbuddy/`. Netlify's `/web/` is the website's main copy: every copy names it as the canonical address.
- **Web app link.** The website links to the web app from the header ("Open the web app", a secondary capsule from 640 px up), the hero and footer platform buttons, the store dialogs and "What is true today". What works today leads: in the hero the "Web app" button is filled, and App Store and Google Play keep "At launch" in the secondary style beside it. Wherever the web app is offered, the copy says its entries stay in that browser.
- **Android.** When the Netlify build has `ANDROID_APK_URL`, `/android` redirects to that APK, and the site adds an "Android / Pre-launch APK" button, a fact in "What is true today" and a download in the Google Play dialog. Without it, nothing on the site mentions a download. iOS is unchanged.
- **Overrides.** This replaces DIRECTION.md where it says the visitor "either watches the GitHub releases or comes back at launch" (STORY), that the site "deploys unchanged to Netlify at the root" with "every link on the page" an in-page anchor, and that the two store labels appear "in the hero and the footer and nowhere else" (the labels are unchanged; the platform buttons now sit beside them).

## 2026-10-12: the FinBuddy card's order, and the Spending chart's marks (design review)

- **Card order.** The direction stacks the card's readouts "largest first". Across currencies there is no largest without a rate, and FinBuddy never converts, so ranking by the figures made any yen, won or rupiah balance the hero (JP¥19,486 is about US$130). The card now puts the profile's currency first, as the one Readout XL; the other currencies follow in Readout M, grouped by direction (the first readout's direction first, so the same words run together) and by ISO code within a group. With no balance in the profile's currency, owed comes first and no readout is promoted (all Readout L); a single balance is always Readout XL. Built in `apps/mobile/src/features/home/cardOrder.ts` with its tests.
- **Spending chart.** As the direction's Spending section asks, the month still running is hatched (it is partial) and a month the engine flagged with a category spike carries a marker (an attention triangle). The selected month's label also sits in a tint capsule: the tint bar and the data-mark bars are only 2.3:1 apart in light and 2.7:1 in dark, so the selection needs a cue beyond colour.
