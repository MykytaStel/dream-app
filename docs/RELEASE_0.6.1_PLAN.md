# Release 0.6.1

## Goal

Ship a stabilization release that makes `0.6.0` feel coherent, lighter, and
more trustworthy before adding more product breadth.

## Must-have

- no confusing or duplicated backup prompts on primary surfaces
- stack navigation feels consistent across `Backup`, `Review workspace`,
  `Progress`, `Monthly report`, and `Pattern detail`
- loading, empty, and error states do not flash misleading content during
  hydration
- review-state import, restore, migration, and sync metadata stay aligned
- backup refresh does not re-read or re-parse more local state than needed

## Product scope

- keep `Backup & sync` as a dedicated operational screen instead of spreading it
  across `Home`, `Dream detail`, and root `Settings`
- make `Settings` read as one calm preferences screen with one clear backup
  entry point
- keep `Review workspace` focused on review work first, with backup cues only as
  a secondary nudge
- reduce redundant hero titles, back controls, and top spacing on stack screens

## Backend scope

- harden review-state snapshot semantics across:
  - local storage
  - import and merge restore
  - storage migrations
  - cloud sync reconciliation
- reduce avoidable local refresh work in backup flows
- add regression coverage for metadata freshness, migration edge cases, and
  backup presentation state

## UI and UX scope

- converge stack screens on one navigation pattern:
  - native header
  - minimal back affordance
  - no duplicate in-content back button unless the screen is action-heavy or
    modal by design
- improve vertical density on review and backup-adjacent screens
- keep backup education contextual or one-time, not permanently loud on core
  surfaces

## Scope lock

- no new major archive, AI, or collaboration surfaces
- no new always-visible backup prompts on `Home` or `Dream detail`
- no broad visual redesign outside stabilization and consistency fixes

## Exit criteria

1. `Settings` reads cleanly in one pass and sends users to a dedicated backup
   screen
2. `Backup` explains cloud state, sync freshness, export, and restore without
   false warnings or repeated content
3. `Review workspace` opens cleanly, without wrong loading or empty-state
   flashes, and without backup noise dominating the page
4. import, restore, sync, and migration flows keep review-state freshness
   metadata intact
5. targeted typecheck, lint, and regression tests pass after each cleanup slice
