# Release 0.2.4

## Goal

Ship one last `0.2.x` stabilization release before the first cloud-facing
`0.3.0` transition.

`0.2.4` should keep the product local-first, reduce release risk, and leave the
repo in a clean state for auth and sync work next.

## Must-have

- app and build metadata point to `0.2.4`
- current offline capture and memory flows stay stable
- recent font and theme cleanup hold without regressions
- backend prep remains additive and does not leak into the primary user path
- release notes clearly frame `0.2.4` as the bridge into `0.3.0`

## Product rule

- no auth gate in capture
- no required sync in save flow
- no cloud dependency for transcription or analysis
- no visual churn for the sake of a version bump

## What 0.2.4 is for

- stabilize the current shell
- close obvious polish gaps
- keep contracts and storage conventions aligned
- reduce technical noise before cloud work becomes user-visible

## UI scope

- validate `Home`, `Wake`, `Memory`, `Settings`, and `Dream Detail` as the
  stable local-first shell
- keep the current typography pairing and aurora palette
- allow only clarity, contrast, spacing, and consistency fixes
- avoid new decorative surfaces or motion that would complicate `0.3.0`

## Backend scope

- keep the Supabase schema and sync DTOs aligned with the local dream model
- preserve backend work as additive prep, not an active dependency
- verify storage-path conventions and typed contracts stay stable
- avoid auth-first or sync-first behavior inside the current capture flow

## Release gate

- `typecheck`, `lint`, and CI tests should pass
- version metadata should match on app, Android, and iOS
- no missing-font or token-regression issues in the active UI surfaces
- backend prep files should remain present and unused by default in runtime flow
- `0.2.4` should be shippable on its own before any `0.3.0` branch-off

## What moves to 0.3.0

- sign-in
- multi-device sync
- audio upload
- conflict handling
- session-aware settings

## Design decision

`0.2.4` should not introduce a new visual system.

Keep the current palette, typography, and motion language. Only make visual
changes when they improve clarity, contrast, or consistency.

## Related docs

- [docs/RELEASE_0.2.3_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.2.3_PLAN.md)
- [docs/BACKEND_0.2.x_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/BACKEND_0.2.x_PLAN.md)
