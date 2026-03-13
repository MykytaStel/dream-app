# Release 0.5.6

## Goal

Turn scattered review entry points into the first real `Review workspace`
without overbuilding `0.6.0`.

`0.5.6` should make review feel like a product area, not a shelf plus a few
side routes.

## Must-have

- app and build metadata point to `0.5.6`
- `Memory` exposes a real `Review workspace` entry instead of only a shelf
- saved months, saved threads, and local follow-ups can be reopened from one
  clearer place
- the first review workspace feels lighter than a dashboard and clearer than
  the current stacked return surfaces

## Product rule

- backend work must support review confidence, not become the visible headline
- do not build a generic workspace shell with empty tabs
- keep wake capture, dream detail, and sync trust stable while review grows

## UI scope

- add a dedicated `Review workspace` screen or route entry from `Memory`
- structure it around:
  - continue locally
  - saved months
  - saved threads
  - one calmer “return next” surface
- reduce repeated section framing and card nesting while keeping navigation
  obvious

## Backend scope

- persist enough derived review metadata to reopen saved month/thread items
  confidently after:
  - local archive edits
  - restore/import
  - cloud sync pulls
- standardize one recompute path for review-derived state instead of scattered
  refresh logic
- prepare a cloud-safe snapshot shape for saved review state, but do not ship a
  new server feature yet

## Backend timing after the Supabase baseline

### In 0.5.6

- keep using the current Supabase-backed sync and auth baseline
- do local/backend-boundary cleanup for:
  - review metadata recompute
  - saved review state freshness
  - cleaner restore/import/sync hooks

### In 0.6.0

- move from “backup and sync exists” to “cloud-connected review state is
  dependable”
- add first-class persistence rules for saved review state when cloud is
  enabled
- stabilize background-friendly sync/retry behavior and clearer device state

### Not in 0.5.6

- no new backend control center
- no server-side AI generation pipeline
- no live collaboration or multi-user review model

## QA scope

- review workspace opens the correct dream, month, or thread every time
- stale saved review items do not leak through after sync/import/restore
- the new route does not regress current `Memory`, `Monthly report`, or thread
  flows
- review state remains understandable after app restart

## Execution order

### Slice 1

- bump project metadata and docs to `0.5.6`
- define the review workspace route, screen model, and entry point from
  `Memory`

### Slice 2

- move saved month, saved thread, and local follow-up surfaces into the new
  review route
- keep overview lighter after the move

### Slice 3

- harden recompute hooks for saved review state after sync, restore, and import
- only add UI trust cues if freshness can still feel ambiguous

## Current progress

- completed: project metadata and docs now point to `0.5.6`
- completed: `Memory` review shelf now has a dedicated `Review workspace`
  route with its own screen model and entry point
- completed: `Memory overview` review block is now a lighter teaser into the
  workspace instead of a second full review surface
- completed: saved review state now reconciles through one shared path after
  local archive edits, import/restore, and cloud sync pulls

## Next actions

1. decide whether `Review workspace` needs one visible freshness cue or should
   stay trust-by-default
2. run a focused device QA pass on `Memory`, `Review workspace`, and backup
   restore flows
3. close `0.5.6` or queue the first `0.6.0` slice

## Scope lock

- no full navigation rewrite before `0.6.0`
- no generic cloud expansion beyond review-state freshness
- no assistant/chat surface in this release

## Related docs

- [docs/RELEASE_0.5.5_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.5.5_PLAN.md)
- [docs/ROADMAP_0.5.1_TO_0.6.0.md](/Users/mykyta/Documents/projects/dream-app/docs/ROADMAP_0.5.1_TO_0.6.0.md)
- [README.md](/Users/mykyta/Documents/projects/dream-app/README.md)
