# Release 0.0.25

## Theme

Performance and polish milestone.

## Why this release exists

`0.0.25` should be the last focused `0.0.x` pass before a `0.1.0` decision.
The app already has the core local-first loops in place. This release is about
removing the remaining “MVP-fragile” feeling:

- smoother refresh and transition behavior on key screens
- one more practical shortcut for returning users
- calmer visual rhythm where control density still feels heavy
- basic profiling discipline around known local data surfaces

## Main outcomes

- add a `Return to last dream` shortcut on `Home`
- tighten data refresh behavior on `Home`, `Archive`, `Insights`, and `Progress`
- add lightweight load telemetry around list- and stats-heavy surfaces
- do a final visual pass on the shell where active controls still compete too much

## Small new feature

- ship a `Return to last dream` shortcut so a user can jump back into the last
  dream they opened without digging through the feed again

## Scope lock

- no backend, sync, or accounts
- no new large analytics features
- no new storage schema changes unless required for the shortcut itself
- no redesign of the app shell from scratch

## Definition of done

- app metadata and build metadata point to `0.0.25`
- `Home` can reopen the last viewed dream from a visible shortcut
- key screens refresh through lighter transitions instead of hard synchronous
  UI jumps
- local load timing is observable for the main heavy screens
- release feels like a beta-quality stabilization pass, not another random UI drop
