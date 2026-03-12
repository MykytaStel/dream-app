# Release 0.5.5

## Goal

Start turning review back into one calm return surface instead of separate
utilities spread across `Memory`, `Monthly report`, and saved thread paths.

`0.5.5` should be the first visible bridge toward the larger `Review workspace`
planned for `0.6.0`.

## Must-have

- app and build metadata point to `0.5.5`
- `Memory overview` exposes one coherent review shelf
- saved months, saved threads, and local follow-ups can be reopened from the
  same place
- the new shelf feels lighter than a dashboard and calmer than stacked cards

## Product rule

- do not build the full review workspace yet
- make review entry points clearer without making the screen denser
- keep local-first and sync-trust work intact underneath

## UI scope

- add a `Review shelf` block to `Memory overview`
- unify:
  - continue locally
  - saved monthly reports
  - saved threads
- keep the rest of `Memory` stable unless the new shelf exposes obvious
  hierarchy problems

## Backend scope

- reuse existing saved month/thread state instead of inventing new storage
- keep saved review items fresh after local or synced archive changes
- prepare the shape of a future combined review workspace without shipping its
  full navigation yet

## QA scope

- review shelf opens the correct dream, month, or thread target
- empty or stale saved items do not leak into overview
- the new shelf does not regress stats loading or thread flows

## Execution order

### Slice 1

- build a lightweight review shelf model for saved months, saved threads, and
  local work queue items
- surface it in `Memory overview`

### Slice 2

- tighten visual hierarchy so the shelf feels calmer than the old scattered
  cards
- make sure mobile width and empty-state behavior stay clean

### Slice 3

- decide whether a separate `Review workspace` route starts in `0.5.5` or
  waits for `0.5.6`

## Current progress

- completed: project metadata and docs now point to `0.5.5`
- completed: `Memory overview` now has the first `Review shelf` that brings
  together local follow-ups, saved months, and saved threads in one calmer
  return surface

## Next actions

1. check whether saved month cards or saved thread cards need further reduction
   on mobile widths
2. decide if the next slice should add a dedicated `Review workspace` route or
   deepen the shelf in place
3. keep `0.5.5` from growing into a full dashboard before `0.6.0`

## Scope lock

- no generic productivity dashboard
- no social review or collaboration
- no full cross-app navigation rewrite in this release

## Related docs

- [docs/RELEASE_0.5.4_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.5.4_PLAN.md)
- [docs/ROADMAP_0.5.1_TO_0.6.0.md](/Users/mykyta/Documents/projects/dream-app/docs/ROADMAP_0.5.1_TO_0.6.0.md)
- [README.md](/Users/mykyta/Documents/projects/dream-app/README.md)
