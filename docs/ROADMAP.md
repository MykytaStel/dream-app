# Roadmap

## How this roadmap works

Work is organised into horizons, not dates. A horizon closes when its exit criterion
is met, not when a quarter ends. This keeps the plan honest: a date can be missed
quietly, an exit criterion cannot.

Each horizon assumes the previous one is done. The order is a dependency chain, not a
preference.

## Horizons

| | Horizon | Focus | Exit criterion |
|---|---|---|---|
| H0 | Foundation | dependency upgrades, crash reporting, quality gates, repo hygiene | green CI, builds on both platforms |
| H1 | Ship v1.0 | close partial features, onboarding, store listing, privacy page | app live in both stores |
| H2 | Premium feel | design system, themes, widgets finished, visual cards, motion | coherent product feel |
| H3 | AI layer | on-device embeddings, semantic search, symbol clusters, optional cloud summaries | differentiation users can name |

### H0 — Foundation

The product is functionally mature but the ground under it has drifted: dependencies
are behind, there is no crash reporting, and quality rules exist only as habits.

Work: dependency upgrades in waves, React Native to current, Sentry behind the existing
observability interface, test and lint gates in CI, documentation regenerated from the
code, and migration of the widget native module to a typed TurboModule.

### H1 — Ship v1.0

Getting to real users. Closing features that are half-done rather than starting new
ones, tightening onboarding, preparing store listings, and writing the privacy page
that the positioning promises.

### H2 — Premium feel

The product works; it does not yet feel like one thing. A design system, the three
themes finished properly, widgets completed, visual entry cards, and motion that
supports transitions instead of decorating them.

### H3 — AI layer

On-device embeddings unlock semantic search and symbol clustering — the discovery layer
the archive has been accumulating toward. Cloud summaries stay optional and explicit.

This horizon is also the trigger for structured local storage: vector search needs
SQLite, which MMKV cannot provide.

## Why this order

H0 comes first because shipping on stale dependencies means paying for regression
testing twice — once before the release and once after the upgrade. The largest risk
of the React Native upgrade is already behind us: New Architecture is enabled
(`android/gradle.properties`, `newArchEnabled=true`), so this is a version bump rather
than an architecture migration.

H3 comes last because AI over a thin archive is a demo, not a feature. Pattern detection
needs entries to detect patterns in, which means capture and retention have to work
first.

## Explicitly out of scope for now

| Not doing | Why |
|---|---|
| Monetization, subscriptions, paywall | no retention signal yet; a paywall before that is guessing at what people would pay for |
| RevenueCat | follows from the above |
| Social or sharing features | conflicts with the privacy positioning and adds moderation burden |
| Wearable integration | speculative until sleep data proves it adds something the journal cannot |
| Splitting all 17 oversized files at once | a diff that large would hide regressions from the upgrades; files are split as they are touched |

## What would change this plan

This roadmap is a current best guess, and these signals would justify reordering it:

- **The archive gets slow on real data.** Pulls list virtualisation forward, ahead of
  polish work.
- **Users ask for export more than for insight.** Widens H1 rather than waiting for H2.
- **The React Native upgrade breaks native modules badly.** H0 grows, and H1 slips —
  better than shipping on a broken foundation.
- **Retention proves strong before H3.** Brings monetization back into scope earlier.
