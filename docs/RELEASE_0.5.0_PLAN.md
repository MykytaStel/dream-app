# Release 0.5.0

## Goal

Build on the stable `0.4.0` backup release and shift Kaleidoskop back toward
daily dream value: capture, reflection, recall, and revisit.

`0.5.0` should feel more useful in everyday journaling, not just more stable
under the hood.

## Must-have

- app and build metadata point to `0.5.0`
- backup and sync remain stable as a background capability
- new work is primarily user-facing, not backend-heavy
- dream detail and revisit flows get a meaningful product upgrade
- offline capture remains fast and low-friction
- no regressions in export, restore, transcription, analysis, or reminders

## Product rule

- backup is infrastructure, not the headline
- first value still starts with local capture
- new scope should help users remember, revisit, or understand dreams better
- avoid turning the next milestone into another settings-heavy release

## UI scope

- improve post-capture follow-up on dream detail
- add stronger revisit and resurfacing cues in archive or home flows
- make reflection prompts feel intentional instead of incidental
- preserve the cleaner settings and backup surfaces from `0.4.0`

## Backend scope

- keep Supabase and sync contracts stable
- avoid major new backend surface unless a user-facing feature truly needs it
- prefer local-first implementations when possible

## QA scope

- fresh local capture remains fast
- backup still connects, signs in, syncs, and restores correctly
- new reflection and revisit UI does not slow entry creation
- archive and dream detail stay stable on larger local datasets

## Starting point

- `0.4.0` closed the backup-hardening milestone
- cloud backup now lives in its own screen and controller
- release surface no longer exposes backend setup details to normal users

## Current progress

- completed: dream detail now includes a local revisit and reflection section built from signals, mood, related dreams, and saved analysis
- completed: home spotlight now includes a concrete `revisit now` cue that surfaces one older dream with a reason to reopen it
- completed: archive now surfaces one compact `reopen from this month` cue inside the current browse scope
- completed: dream detail reflection prompts now include direct follow-up actions instead of staying as passive suggestions
- completed: home and archive revisit cues now read as richer memory cards with clearer context and action copy
- completed: post-save capture sheet now points into a contextual follow-up step instead of dropping users into a generic detail screen
- completed: memory screen now includes a direct `reopen now` nudge so patterns can lead back to one concrete dream
- completed: home and memory now also resurface one older dream through local time windows such as a week, month, or quarter ago
- completed: monthly report now surfaces one older dream through the same local time windows and opens it directly into detail
- completed: dream detail now chooses one concrete next step first, such as transcript work, refinement, or time-based resurfacing
- completed: memory overview now includes a local work queue for transcript generation, transcript cleanup, and analysis follow-up

## Next actions

1. Add the next user-facing memory loop on top of the new detail, home, archive, and post-save surfaces.
2. Keep backup-related code stable unless a new feature requires a targeted adjustment.
3. Prefer improvements in dream detail, revisit loops, and memory value over new infra work.
4. Validate that new UI keeps the current local-first speed and clarity.

## Related docs

- [docs/RELEASE_0.4.0_PLAN.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.4.0_PLAN.md)
- [docs/RELEASE_0.4.0_CHECKLIST.md](/Users/mykyta/Documents/projects/dream-app/docs/RELEASE_0.4.0_CHECKLIST.md)
- [README.md](/Users/mykyta/Documents/projects/dream-app/README.md)
