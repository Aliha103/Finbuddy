# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

The product is a native mobile app for iOS and Android, built once with Expo / React Native and following each OS's conventions (HIG on iPhone, Material 3 on Android). The website is a separate marketing surface whose platform is `web`; see `apps/web/PRODUCT.md` once that app exists.

## Stack

- Mobile app: Expo (React Native) + TypeScript, one codebase shipping to iOS and Android. Confirmed by the team.
- Website: marketing site. It sells the app; App Store and Google Play listings come at launch. The app also runs in the browser: the Netlify site (finbuddych) serves its web export at `/`, the website at `/web/` and, when a pre-launch APK exists, a download at `/android`. Decided 2026-10-11 (see `design/DECISIONS.md`).
- Repository: monorepo in this repo (`apps/mobile`, `apps/web`, `packages/shared`). Confirmed by the team.
- No backend exists yet. The README describes a Django API, but it is not in this repo, and every current API call targets `localhost`.

## Users

Two audiences carry equal weight (confirmed):

1. **Individuals** managing their own money: tracking spending, seeing where it goes, and getting better at it.
2. **Groups** sharing costs: roommates, friends on a trip, couples, small teams. They log shared expenses, see who owes whom, and settle up.

The same person is usually both at once. Their personal picture includes their share of group costs.

## Product Purpose

FinBuddy helps people understand and manage their personal money and the money they share with others, in one app. Success means a user can log an expense in seconds, always knows their balance with every group and person, settles debts without awkwardness, and gets insights that change a real spending decision.

## Positioning

Personal finance and shared-expense splitting usually live in separate apps. FinBuddy keeps them in one ledger: splitting a dinner also updates your own spending picture, and insights cover both. This is inferred from the README's "individuals and groups" framing and the confirmed equal weighting; the exact claim is still open.

## Operating Context

- Used on a phone, often in the moment: at the restaurant table, at the checkout, on a trip, splitting a bill with the group watching.
- Logging is quick and repeated. Reviewing (balances, trends, insights) is slower and less frequent.
- Groups involve other people who may not have the app yet, so invite and share flows matter.
- Money spans currencies: trips abroad and international groups. The product is multi-currency and global from day one (confirmed). There is no single home currency; each user and each group has one.

## Capabilities and Constraints

Capabilities in scope (from README and current code):

- Personal expense tracking with categories.
- Groups: create, invite or join, log shared expenses with splits, per-member balances, settle-up payments with confirmation.
- Activity feed across expenses, groups and payments.
- Analytics: balance over time, spending by period and category.
- AI financial insights: tips, warnings, and a "financial score" (on the roadmap, not built).
- Notifications and reminders for dues (README claim, not built).

Constraints:

- Money is exact. Amounts are stored as integer minor units with an ISO 4217 currency code, never floats, and every amount displays with its currency.
- Pre-launch: there are no real users, testimonials, ratings, user counts, press or partner logos (confirmed). Nothing may fabricate them. Demonstration data is allowed only when it is clearly labeled as sample data.
- No backend yet. The app must work local-first on the device, behind a data layer that a real API can replace later.
- AI cannot depend on a local Ollama server (it cannot work on a phone). Insights must run on the device or wait for a backend endpoint, and must never send financial data anywhere without the user's consent.
- Security, encryption, GDPR or bank-sync claims must not be made until they are implemented and verifiable.
- The marketing site builds for any base path through `BASE_PATH`: `/web/` on the Netlify site, `/Finbuddy/` on GitHub Pages.

Undecided:

- The backend and its hosting.
- Bank sync and open-banking integrations (roadmap only).
- App Store and Google Play listings. No store URLs exist yet.

## Brand Commitments

- The name **FinBuddy** stays.
- Full visual reinvention (confirmed): new logo or wordmark, palette, type, motion and composition. The current indigo/blue/teal palette, Poppins/Open Sans typography, the PNG logo (`src/assets/logo/finbuddy_logo.png`) and the feature illustrations in `src/assets/images/` are retired. Treat them as evidence of the old look, not as references.
- Existing tagline in the README: "Smarter Finances. Together." It is not binding.

## Evidence on Hand

- Feature list and roadmap: `README.md`.
- Data model: `src/types/index.ts` (Expense, Group, Payment, BalanceData, AITipResponse), plus the API surface in `src/services/api.ts`.
- No real testimonials, metrics, customers, ratings or press exist. The quotes in `src/data/testimonials/testimonials.ts`, the user counts and the "bank-level encryption" claims on the current landing page are placeholders and must not be reused.

## Product Principles

1. **Seconds to log, zero doubt about balances.** The core loop (add an expense, see who owes what) must be faster than the alternative of not tracking.
2. **One picture of your money.** Personal and shared finances are one model and one interface, never two apps glued together.
3. **Honest money.** Exact amounts, explicit currencies, no invented claims, and no dark patterns around debts between friends.
4. **Native on each phone.** iPhone users get iPhone conventions and Android users get Android conventions; the brand lives in the layer the platform leaves open.
5. **Insight earns its place.** AI output is grounded in the user's own data, explains itself, and is easy to dismiss.

## Accessibility & Inclusion

- Dynamic Type (iOS) and font scale (Android) must not break layouts.
- Screen-reader labels on every control, including amounts read with their currency.
- Reduce Motion / Remove animations is honored, with crossfades instead of motion.
- Color is never the only signal for owe versus owed.
- Global audience: locale-aware number, date and currency formatting, with room for longer translated strings.
