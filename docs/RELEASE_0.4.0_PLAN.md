# Release 0.4.0

## Goal

Turn the `0.3.x` cloud backup foundation into a production-ready multi-device
release without weakening the local-first core of Kaleidoskop.

`0.4.0` should feel simpler to users than `0.3.x`, even though the account and
sync paths become more complete.

## Must-have

- app and build metadata point to `0.4.0`
- first-device backup onboarding is understandable without developer context
- second-device sign-in flow is clear and reliable
- password reset or recovery flow exists for named accounts
- release builds do not expose Supabase runtime config fields to normal users
- sync remains stable for create, update, delete, pull, and conflict cases
- offline capture, export, restore, transcription, and analysis remain stable

## Product rule

- users should think in terms of backup and account, not backend setup
- no auth gate before first capture
- no cloud-required daily journaling path
- no technical sync diagnostics in the default release surface

## UI scope

- polish cloud backup onboarding copy and action order
- make first-device and second-device steps self-explanatory in Settings
- add account recovery surface where needed
- keep the current typography, spacing, and shell stable

## Backend scope

- keep Supabase schema and existing sync contracts stable
- preserve tombstones and explicit conflict policy
- add only the minimal auth/recovery wiring needed for release readiness

## QA scope

- new user -> local capture only
- first device -> connect backup -> save named account -> sync
- second device -> sign in -> pull archive -> edit -> sync back
- delete on one device -> verify no resurrection on another
- export/restore still work after cloud setup

## Current progress

- completed: backup flow moved out of the main Settings screen into its own screen
- completed: first-device, second-device, and password-reset actions exist in the product surface
- completed: release surface hides Supabase runtime config outside developer-facing flows
- completed: signed-out backup flow now splits first-device and second-device paths instead of showing both at once
- completed: backup-only state and actions now live in a dedicated controller instead of the generic settings controller
- in progress: backup onboarding polish so the flow is obvious without external instructions

## Next actions

1. Add clearer post-action states for connect, account save, sign-in, and reset-email so users always know what happened next.
2. Tighten release-only copy and button order based on the first internal QA pass.
3. Verify release-build behavior where developer-only config is hidden and backup still works with bundled config.
4. Check the real Supabase reset-email journey and improve copy around “what happens next” if needed.
5. Prepare the final `0.4.0` release checklist and rollout notes.

## What follows after this

- post-release analytics and support loop
- polish based on real-world sync/account friction
- next feature release after backup onboarding stabilizes

## Related docs

- [docs/RELEASE_0.3.1_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.3.1_PLAN.md)
- [docs/RELEASE_0.4.0_CHECKLIST.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.4.0_CHECKLIST.md)
- [README.md](/Users/mykyta/Documents/projects/dream-app/README.md)
