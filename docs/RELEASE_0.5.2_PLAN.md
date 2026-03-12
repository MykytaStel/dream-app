# Release 0.5.2

## Goal

Make sync, backup, and restore feel trustworthy without turning Kaleidoskop
into a backend-first product.

`0.5.2` should make cloud behavior clearer and safer while preserving the
faster local capture and wake-flow improvements that landed in `0.5.1`.

## Must-have

- app and build metadata point to `0.5.2`
- sync state is readable in normal product language
- restore previews reduce fear around overwrite or device freshness
- attachment handling is clearer when audio exists across devices
- local-first capture, export, restore, transcription, and analysis stay stable
- cloud remains supportive infrastructure, not the main product headline

## Product rule

- sync must explain itself when it matters and stay out of the way when it does not
- new backend work should surface as trust, not as technical ceremony
- restore decisions should read like user product UI, not admin UI
- do not regress the calmer capture-first direction from `0.5.1`

## UI scope

- add a `Sync activity / restore timeline` surface
- show last successful sync and last backup snapshot more clearly
- surface restore previews before destructive import or overwrite actions
- introduce lightweight per-dream sync state only where it clarifies a recovery path

## Backend scope

- move from basic sync into a clearer incremental change flow
- support safer upload and download handling for audio attachments
- add conflict rules for edited transcripts, local analysis, and mood/context changes
- store enough sync metadata to explain why a change won or lost

## QA scope

- sync state stays understandable across sign-in, backup, restore, and normal app use
- restore preview matches the actual data that will be applied
- attachment sync does not silently drop or duplicate audio state
- local edits still work correctly when sync is unavailable or behind

## Starting point

- `0.5.1` tightened wake capture, draft recovery, and post-save follow-up
- backup and sync already exist, but still need more user-readable trust surfaces
- local capture remains the main product value, with cloud running as support

## Current progress

- completed: `BackupScreen` now includes a dedicated `Sync activity` surface with three trust rows for last successful sync, latest local backup snapshot, and current device freshness
- completed: the same surface now lifts the newest local JSON backup into a restore preview grid directly on the backup screen, instead of hiding preview only inside the broader settings workspace
- completed: backup trust copy now reads in calmer product language around snapshot availability, local-only state, ahead-of-sync state, and first-sync readiness
- completed: `BackupScreen` now shows a focused `What may still be local` surface for voice notes and saved transcripts, so cross-device trust is clearer when attachments or text can lag behind sync
- completed: restore wording is tighter and the backup-screen snapshot preview now shows only the smallest decision-first fields, instead of a dense restore admin grid
- completed: `Dream detail` now shows only the smallest per-dream sync recovery cues, limited to local-only voice notes and transcripts that are newer on this device than cloud

## Next actions

1. Keep this release focused on trust, recovery, and cross-device clarity.
2. Avoid adding backend ceremony unless it directly clarifies a user recovery path.
3. Move the next release back toward product depth instead of more sync ceremony.

## Related docs

- [docs/RELEASE_0.5.1_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.5.1_PLAN.md)
- [docs/ROADMAP_0.5.1_TO_0.6.0.md](/Users/mykyta/Documents/projects/dream-app/docs/ROADMAP_0.5.1_TO_0.6.0.md)
- [README.md](/Users/mykyta/Documents/projects/dream-app/README.md)
