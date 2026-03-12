# Release 0.5.4

## Goal

Make saved review paths stay fresh after archive changes instead of drifting
into stale thread pointers.

`0.5.4` should turn the new thread layer from a nice UI feature into a more
dependable product surface.

## Must-have

- app and build metadata point to `0.5.4`
- saved threads stay valid after local archive edits
- saved threads stay valid after import, restore, and sync
- review surfaces do not keep surfacing dead or duplicated saved threads

## Product rule

- freshness work should improve confidence without adding admin UI
- backend work should be invisible unless it clarifies review flow
- no new dashboard layer just to explain metadata repair

## UI scope

- keep `Memory`, `Monthly report`, and thread detail visually stable
- only adjust UI if stale saved-thread states would otherwise leak through

## Backend scope

- reconcile saved thread state whenever dreams are persisted locally
- reconcile saved thread state after remote sync pulls and remote deletions
- normalize saved thread keys so case or hyphen differences do not create
  duplicate records

## QA scope

- saved threads survive restart
- saved threads are pruned when the last matching dream disappears
- saved threads do not duplicate on signal casing or tag formatting changes
- sync/import/restore do not leave dead thread links behind

## Execution order

### Slice 1

- hook saved-thread reconciliation into core dream persistence
- cover local edits, delete, archive, and replace flows

### Slice 2

- extend reconciliation through cloud sync pull paths
- make sure remote deletions do not leave stale saved threads behind

### Slice 3

- decide whether monthly saved-thread snapshots belong here or later
- only add UI messaging if real confusion remains after freshness fixes

## Current progress

- completed: project metadata and docs now point to `0.5.4`
- completed: saved thread keys are normalized consistently with pattern
  matching
- completed: saved thread reconciliation now runs after local dream persistence
  and after cloud sync pull reconciliation

## Next actions

1. review whether remote deletion paths should also refresh dream index/meta in
   the same pass
2. decide if `0.5.4` needs any user-facing freshness cue or should stay fully
   invisible
3. if this slice feels stable, move to the next release instead of growing
   hidden backend work

## Scope lock

- no new review workspace yet
- no new cloud control center
- no extra visual complexity around thread state

## Related docs

- [docs/RELEASE_0.5.3_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.5.3_PLAN.md)
- [docs/ROADMAP_0.5.1_TO_0.6.0.md](/Users/mykyta/Documents/projects/dream-app/docs/ROADMAP_0.5.1_TO_0.6.0.md)
- [README.md](/Users/mykyta/Documents/projects/dream-app/README.md)
