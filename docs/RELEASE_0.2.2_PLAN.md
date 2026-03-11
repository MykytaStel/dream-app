# Release 0.2.2

## Goal

Ship a cleaner continuation build on top of the `0.2.0` memory-first reset.

`0.2.2` should make the app feel calmer and more stable without changing the
product direction again.

## What this build is for

The product direction is already correct:

- wake-first capture
- preserved raw voice
- early recurring threads
- Memory instead of a generic insights dashboard

What still needs work is surface quality:

- Home should feel lighter and more stable
- Memory should read faster
- Dream detail should stay calm after save and reopen
- backend prep should keep moving without touching the active offline loop

## Must-have

- app and build metadata point to `0.2.2`
- no visual regressions in `Home`, `Wake`, `Memory`, or `Dream Detail`
- `Home` avoids duplicated navigation and helper text noise
- `Memory Overview` stays useful without reading like an analytics screen
- backend prep continues only behind the current local-first product

## Scope lock

- no account requirement
- no sync-required capture path
- no backend-required transcription or analysis
- no new product pivot
- no extra Home surface that adds weight without helping recall

## Main product priorities

1. Stabilize `Home`
2. Keep simplifying `Memory`
3. Tighten `Wake -> save -> detail`
4. Continue backend prep quietly in-repo

## Backend note

`0.2.2` is still a local-first polish build.

Use it for:

- schema refinement
- storage conventions
- sync DTOs
- app-side adapters that stay unused by default

Reserve `0.3.0` for the first user-visible cloud release.

## Related docs

- [docs/RELEASE_0.2.0_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.2.0_PLAN.md)
- [docs/RELEASE_0.2.1_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.2.1_PLAN.md)
- [docs/BACKEND_0.2.x_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/BACKEND_0.2.x_PLAN.md)
