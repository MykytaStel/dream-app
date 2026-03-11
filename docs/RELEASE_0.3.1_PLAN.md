# Release 0.3.1

## Goal

Ship the cloud-enabled release as a cleaner user-facing package after the
`0.3.0` foundation work landed.

`0.3.1` is a release-polish target, not a new backend architecture reset.

## Must-have

- app and build metadata point to `0.3.1`
- cloud backup UX uses product language instead of infrastructure language
- runtime Supabase config stays available only in developer-facing flows
- anonymous connect, named account upgrade, and existing account sign-in remain working
- upload, pull, delete propagation, and explicit conflict policy remain stable
- offline capture remains fully usable without cloud

## Product rule

- users should see backup/account/sync actions, not Supabase terms
- no auth gate before first capture
- no cloud-required path for daily capture, transcription, or analysis
- no debug counters in the default user-facing sync summary

## UI scope

- present cloud as optional backup, not backend setup
- keep multi-device steps understandable from Settings alone
- preserve the current visual language from `0.3.0`

## Backend scope

- no schema reset
- keep the current Supabase contract stable
- preserve named sign-in, tombstones, and conflict resolution behavior

## What follows after this

- production rollout checklist
- device-level manual QA for first-device and second-device sync flows
- post-release polish for onboarding copy if any confusion remains

## Related docs

- [docs/RELEASE_0.3.0_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.3.0_PLAN.md)
- [README.md](/Users/mykyta/Documents/projects/dream-app/README.md)
