# Release 0.6.2

## Goal

Ship a backend-hardening release that makes cloud sync easier to reason about,
more diagnosable in development, and safer around local-first review state.

## Must-have

- sync snapshot data stays internally consistent after success and failure paths
- pending review-state changes remain visible in diagnostics until they are truly synced
- conflict and overwrite behavior stays explicit for repeated sync runs
- targeted regression coverage exists for review-state, tombstone, and remote hydration paths

## Product scope

- keep the release narrow and operational instead of adding a new major surface
- expose clearer sync diagnostics for development and QA
- preserve the calm `0.6.1` UI direction while hardening backend trust

## Backend scope

- make pending-count bookkeeping explicit across dreams, tombstones, and saved review state
- add pre-upload remote revision checks so stale local restore state cannot overwrite newer remote data
- reduce ambiguity in repeated sync attempts and partial failure reporting
- strengthen sync regression tests around review-state and multi-step reconciliation

## First slice

1. fix pending sync diagnostics so saved review state cannot disappear from the snapshot while still unsynced
2. expose a per-surface pending breakdown in the debug sync diagnostics screen
3. add pre-upload revision gating for dreams and tombstones so restore-after-sync stays local-safe
4. keep the release metadata pointed at `0.6.2` while leaving shipped runtime versioning untouched until release cut

## Scope lock

- no new dashboard surfaces
- no new always-on backup prompts
- no broad redesign outside diagnostics clarity and sync trust work

## Exit criteria

1. cloud sync snapshot and event history report accurate pending counts after partial failures
2. debug diagnostics can distinguish pending dreams, pending deletions, and pending review sets
3. targeted sync regression tests pass after each hardening slice
