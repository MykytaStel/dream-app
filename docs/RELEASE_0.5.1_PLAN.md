# Release 0.5.1

## Goal

Turn wake capture into a faster, calmer, and more reliable first-touch flow.

`0.5.1` should improve the first 30 seconds after waking without regressing the
new revisit, memory, and dream-detail work that landed in `0.5.0`.

## Must-have

- app and build metadata point to `0.5.1`
- wake capture is faster to enter with one hand
- draft recovery is clearer when the user is interrupted
- transcript and refine work feel closer to capture, not buried later
- backup, sync, export, restore, transcription, and analysis stay stable
- local-first capture remains usable when backend or sync is unavailable

## Product rule

- first value starts with capture, not settings
- new backend work should support the wake flow, not become the visible story
- post-save next steps should stay concrete and singular
- avoid bringing back noisy, dashboard-heavy UI

## UI scope

- add a dedicated wake-flow quick capture path
- reduce cognitive load on the first entry screen
- improve interrupted-draft recovery and continue states
- tighten post-save branching so the next action is obvious

## Backend scope

- add a clearer local mutation queue for dream edits, transcript changes, and analysis updates
- standardize changed-at metadata for editable dream fields
- prepare sync payloads so drafts, transcript state, and analysis state round-trip cleanly later

## QA scope

- wake capture works smoothly for text-first and voice-first entry
- interrupted drafts recover into the right in-progress state
- transcript/refine follow-up does not lose local edits
- sync-facing metadata stays consistent after local edits

## Starting point

- `0.5.0` rebuilt daily value around capture, revisit, and reflection
- dream detail, memory, and monthly report now expose clearer follow-up loops
- cloud remains available, but no longer dominates the main product surface

## Current progress

- completed: saved local drafts now remember their capture flow and resume back into the right composer mode instead of always reopening the generic path
- completed: `Continue draft` on wake entry, home, and quick add now shows a concrete saved-state summary such as voice note, word count, wake mode, context, or tags
- completed: voice-first resume no longer auto-starts a new recording when the user is reopening an existing draft
- completed: wake entry now uses a calmer bottom-action layout with one clear primary step instead of the heavier decorative orb flow
- completed: post-save capture now surfaces up to two concrete next steps such as transcript work, refine, or reflection instead of a single generic follow-up
- completed: the composer itself now shows a restored-draft state with saved-context chips and a `Start fresh` action

## Next actions

1. Run a focused visual QA pass on wake entry, create, and post-save surfaces on device or simulator.
2. Check reminder entry, voice-first entry, and interrupted-draft resume against real capture behavior.
3. Keep any last 0.5.1 polish limited to clarity, spacing, and copy, not new scope.

## Related docs

- [docs/RELEASE_0.5.0_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.5.0_PLAN.md)
- [docs/ROADMAP_0.5.1_TO_0.6.0.md](/Users/mykyta/Documents/projects/dream-app/docs/ROADMAP_0.5.1_TO_0.6.0.md)
- [README.md](/Users/mykyta/Documents/projects/dream-app/README.md)
