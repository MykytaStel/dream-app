# Release 0.5.3

## Goal

Make the archive feel like a living memory system instead of a list of saved
entries.

`0.5.3` should move Kaleidoskop back toward product depth after the sync trust
work in `0.5.2`.

## Must-have

- app and build metadata point to `0.5.3`
- recurring signals can open into a dedicated thread view
- one thread can be revisited across multiple dreams and dates
- review surfaces feel more editorial and less like stacks of generic cards
- transcript, analysis, and thread review start forming one loop instead of
  separate utilities

## Product rule

- archive depth must feel like user value, not like hidden derived metadata
- thread views should make memory review clearer, not denser
- UI should reduce repetition, dead empty states, and duplicate summaries
- backend support should stay behind the scenes unless it clarifies review flow

## UI scope

- add a dedicated `Dream thread` screen
- show a simple time sequence of matching dreams around one recurring signal
- let the user pin or save a thread for later review
- tighten `Memory`, `Monthly report`, and thread detail into one calmer visual
  family

## Backend scope

- persist derived metadata for recurring signals and saved thread state
- recompute reflection metadata after sync, restore, or import
- prepare optional cloud-backed storage for saved thread snapshots when cloud is
  enabled

## QA scope

- thread matches stay stable after local edits, restore, and sync
- pinned/saved thread state survives app restart and archive updates
- thread review does not regress capture, home, or dream detail clarity
- empty states explain what is missing without feeling dead or repetitive

## Starting point

- `0.5.2` clarified backup, sync, restore, attachment trust, and the smallest
  per-dream recovery cues
- `Memory` already has recurring signal surfaces, but they still need a
  dedicated follow-through path
- `Dream detail` is calmer, but archive review still lacks a real thread layer

## First slices

1. Build a `Dream thread` presentation model from existing related-signal data.
2. Add a dedicated thread screen with sequence, signal summary, and open-dream
   path.
3. Add pinned thread state and surface it back into `Memory` and review loops.

## Execution order

### Slice 1

- turn the current `PatternDetail` route into the first real `Dream thread`
  view through a dedicated thread presentation model
- shift the screen from a flat match list toward:
  - oldest-to-newest sequence
  - first seen / latest / strongest source summary
  - cleaner “open dream from thread” path

### Slice 2

- add explicit thread entry points from:
  - `Memory` recurring signals
  - `Monthly report` lead signals
  - `Home` spotlight patterns where they already exist
- tighten copy so the product says `thread`, not `pattern detail`

### Slice 3

- persist pinned thread state locally
- surface pinned threads back into `Memory` and monthly review
- make sure pinning survives app restart, import, and restore

### Slice 4

- recompute recurring-thread metadata after sync, restore, import, and local
  archive edits
- keep the backend piece invisible unless a user-facing review flow benefits
  directly

## Current progress

- completed: project metadata and docs now point to `0.5.3`
- completed: the first `Dream thread` presentation model exists and builds a
  real thread summary from recurring-signal matches
- completed: `PatternDetailScreen` now renders that model as a thread-like
  sequence with first/latest markers and calmer summary cards
- completed: `Monthly report` signal cards can now open threadable signals
  directly, and `Memory` exposes an explicit `Open full thread` path from the
  current thread preview
- completed: local pinned-thread state now exists, survives restart, can be
  toggled from the thread screen, and quietly resurfaces in both `Memory` and
  `Monthly report` when those saved threads still touch the current slice

## Next actions

1. Rename the remaining user-facing thread entry points so `Memory` and the
   thread screen fully stop sounding like old `pattern detail` UI.
2. Recompute recurring-thread metadata after restore, import, sync, and local
   archive edits so saved threads never feel stale.
3. Decide whether cloud-backed thread snapshots belong in `0.5.3` or stay as
   backend groundwork for `0.6.0`.

## Scope lock

- no generic AI chat
- no social or collaborative threads
- no full archive redesign outside what the new thread view directly needs

## Related docs

- [docs/RELEASE_0.5.2_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.5.2_PLAN.md)
- [docs/ROADMAP_0.5.1_TO_0.6.0.md](/Users/mykyta/Documents/projects/dream-app/docs/ROADMAP_0.5.1_TO_0.6.0.md)
- [README.md](/Users/mykyta/Documents/projects/dream-app/README.md)
