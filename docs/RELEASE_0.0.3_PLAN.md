# Release 0.0.3 Plan

## Goal

Ship the first polished MVP slice after `0.0.2`: make capture faster, make
history easier to use, and make the app feel trustworthy enough for external
testing.

## Release theme

- Faster morning capture
- Better reflection on saved dreams
- Safer and clearer product behavior

## Scope lock

### 1. Capture flow polish

- Reduce friction on `NewDreamScreen`:
  - clearer empty/default state
  - stronger save validation feedback
  - cleaner handling of text-only, audio-only, and mixed entries
- Improve `DreamComposer` ergonomics for quick entry:
  - preserve unsaved input during short interruptions if feasible
  - make mood, tags, and sleep context feel secondary, not blocking
- Verify audio flow reliability:
  - start/stop recording
  - attach audio to dream
  - playback from detail screen

### 2. History and retrieval

- Strengthen `HomeScreen` as the default reflection surface:
  - keep archive/active filters stable
  - improve scanability of cards
  - make empty states useful and localized
- Add the first practical retrieval upgrade:
  - search by title/text if scope stays small
  - otherwise filtering by tag and mood as the minimum discoverability step
- Confirm edit/archive/delete flows are consistent between list and detail views

### 3. Stats that feel actionable

- Keep stats lightweight, but make them clearer:
  - streak
  - entries in last 7 days
  - average words
  - recurring tags/themes
  - mood and sleep-context correlations
- Add copy or visual cues that explain when there is not enough data
- Validate that stats recalculate immediately after create/edit/archive actions

### 4. Settings and trust layer

- Expand `SettingsScreen` from placeholder status to user trust controls:
  - explicit local-first/privacy note
  - visible reminder status and locale state
  - current app version shown from a single source of truth
- Make reminder behavior more predictable:
  - restore saved time correctly
  - reschedule after locale/app restart
  - clear user-facing error path when permissions are denied

### 5. Quality and release readiness

- Close repository-level test gaps for core dream flows
- Ensure storage migrations remain backward compatible
- Remove obvious UI regressions across iOS and Android
- Prepare release notes and manual QA checklist for external dogfooding

## Non-goals for 0.0.3

- Cloud sync
- Account system
- AI summaries or transcription
- Export/share flow
- HealthKit or Google Health Connect
- Complex achievement/gamification layer

## Definition of done

- A user can create, edit, archive, unarchive, and delete dreams without data
  loss
- Audio recording and playback work on target devices used for testing
- Reminder settings persist and behave consistently after app relaunch
- English and Ukrainian copy are complete for all shipped screens
- `yarn typecheck`, `yarn lint`, and `yarn test:ci` pass
- Manual smoke test passes on iOS and Android

## Suggested implementation order

1. Finalize capture-flow UX and validation
2. Finalize list/detail consistency and retrieval improvements
3. Tighten stats refresh behavior and empty/no-data messaging
4. Finish settings trust layer and reminder reliability
5. Run test hardening, regression fixes, and release QA

## Priority breakdown

### P0: must ship in 0.0.3

- Stabilize dream capture:
  - reliable save for text-only, audio-only, and mixed entries
  - clear validation and error messaging on create/edit
  - no obvious data-loss path during normal use
- Stabilize dream management:
  - create/edit/delete/archive/unarchive work consistently
  - list and detail screens stay in sync after actions
  - active/archive filters behave predictably
- Stabilize reminders and settings basics:
  - reminder state persists after app relaunch
  - reminder time updates correctly
  - permission denial is handled clearly
  - current app version comes from one source of truth
- Protect release quality:
  - repository and migration tests cover critical flows
  - `yarn typecheck`, `yarn lint`, and `yarn test:ci` pass
  - manual smoke test passes on iOS and Android

### P1: important, ship if P0 is clean

- Improve capture UX:
  - better empty/default state in composer
  - preserve unsaved draft during short interruptions if implementation is safe
  - make metadata fields feel optional and low-friction
- Improve history usability:
  - better card scanability on home screen
  - stronger localized empty/loading/error states
  - first discoverability improvement via tag/mood filters or lightweight search
- Improve stats usefulness:
  - no-data guidance for low-volume journals
  - immediate stats refresh after create/edit/archive actions
  - clearer recurring themes/tags presentation
- Improve trust layer:
  - explicit privacy/local-first note in settings
  - clearer visible state for locale and reminder configuration

### P2: nice to have, cut first if schedule slips

- Add search by title/text if it stays small and does not destabilize the repo
- Add extra visual polish to home/stat cards
- Add richer explanatory copy in stats and settings
- Add minor UX refinements around playback and recording transitions
- Add release-note polish for external dogfooding beyond the minimum checklist

## Suggested branch and release metadata

- Release branch candidate: `codex/release-v0.0.3`
- Suggested release commit title:
  - `release(v0.0.3): polish capture flow, retrieval, stats, and trust controls`
- Suggested tag after merge:
  - `v0.0.3`

## Open risks

- Audio behavior may differ between iOS and Android and require platform fixes
- Notification permissions and scheduling can fail silently without strong QA
- Search may expand scope too much; if that happens, ship tag/mood filters first
- Current dirty worktree suggests `0.0.2` stabilization may still be underway,
  so `0.0.3` should stay disciplined and avoid new platform-heavy features
