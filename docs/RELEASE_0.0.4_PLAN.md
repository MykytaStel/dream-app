# Release 0.0.4 Plan

## Goal

Ship the first release that improves retention after the MVP polish in `0.0.3`:
help users come back, find old dreams faster, and feel safer keeping sensitive
data in the app.

## Release theme

- Faster repeat capture
- Better reflection and retrieval
- Stronger trust through data portability

## Product bet for 0.0.4

`0.0.3` makes the core loop usable. `0.0.4` should make it sticky.

The best next step is not cloud sync or AI yet. The strongest small release is:

- users can re-enter capture quickly
- users can find patterns in old dreams without friction
- users can export their data so local-first feels safe
- users get lightweight motivation to keep recording

## Scope lock

### 1. Retrieval that actually helps after 10+ entries

- Upgrade `HomeScreen` from simple text search into practical discovery:
  - filter by mood
  - filter by tag
  - filter by entry type: text, audio, mixed
  - sort by newest/oldest
- Make active/archive state work together with filters without confusing resets
- Improve dream cards so scanning is faster:
  - stronger metadata hierarchy
  - clearer markers for audio, tags, and mood
  - visible result count when filters are active
- Add quick clear/reset controls for search and filters

### 2. Retention and motivation layer

- Add the first local achievement system from product strategy:
  - first dream saved
  - three days in a row
  - ten dreams recorded
  - first voice dream
- Surface progress in a lightweight way:
  - achievements card on home or stats
  - clear unlock state
  - no gamification overload
- Add a simple weekly goal signal:
  - entries this week
  - progress toward a small target such as 3 dreams

### 3. Faster repeat capture

- Make the app better for the second and third week of use:
  - expose "continue draft" when an unfinished draft exists
  - offer one-tap "record now" from the main capture entry point
  - keep optional metadata visually collapsed or secondary by default
- Preserve the fast path for text-only and audio-only entries
- Make draft restore state more explicit so users trust that nothing was lost

### 4. Trust and portability

- Add local export of dream data from `SettingsScreen`:
  - JSON export as the minimum
  - include metadata needed for future migration
- Add import validation design, even if full import ships later:
  - schema validation
  - duplicate handling strategy
  - versioned export shape
- Expand settings trust copy:
  - what is exported
  - what stays local
  - what is not yet supported

### 5. Quality and release readiness

- Add tests for:
  - filter logic
  - achievement rules
  - export shape/versioning
  - draft restore and fast capture paths
- Confirm migrations remain backward compatible with exported/importable data
- Run manual QA on both platforms for capture, filters, archive state, export,
  and reminder behavior

## Recommended functional additions for 0.0.4

If we keep the release disciplined, these are the best additions:

1. Advanced local filters and sort
2. Achievements + weekly goal progress
3. Continue draft + one-tap voice capture entry
4. JSON export from settings

These four features reinforce each other and fit the current architecture.

## Features to postpone

Do not let `0.0.4` turn into a platform rewrite. Postpone these:

- Cloud sync
- Account system
- AI summaries
- Speech-to-text transcription as a shipped feature
- Social/community features
- Rich share cards
- HealthKit or Health Connect

## Definition of done

- A user can search, filter, sort, archive, and open old dreams without losing
  context or getting inconsistent results
- A user can see unlocked achievements and weekly progress based on local data
- A user can continue an unfinished draft and start a voice capture with minimal
  taps
- A user can export local data into a stable versioned JSON format
- `yarn typecheck`, `yarn lint`, and `yarn test:ci` pass
- Manual smoke test passes on iOS and Android

## Suggested implementation order

1. Finalize filter/sort model and UI on top of current `HomeScreen`
2. Add achievements domain logic and lightweight stats/home presentation
3. Improve repeat-capture UX around draft restore and one-tap audio entry
4. Add export service and settings UI
5. Harden tests, migrations, and release QA

## Priority breakdown

### P0: must ship in 0.0.4

- Retrieval upgrade:
  - mood/tag/type filters
  - deterministic sort
  - stable active/archive behavior with filters
- Motivation basics:
  - achievement rules for first dream, streak, ten dreams, first voice dream
  - visible achievement state in home or stats
- Trust basics:
  - versioned JSON export
  - clear settings copy for local-first behavior
- Quality gate:
  - tests for new business rules
  - `yarn typecheck`, `yarn lint`, and `yarn test:ci` pass

### P1: important, ship if P0 is clean

- Weekly goal progress card
- Continue-draft entry point on home screen
- One-tap voice capture shortcut into composer
- Better empty/no-results states for filtered history
- Export metadata improvements for future import support

### P2: nice to have, cut first if scope slips

- Date-range filtering
- Multi-select tag filtering
- Export import preview screen
- Achievement celebration polish
- Technical spike for transcription feasibility without shipping it

## Suggested technical direction

- Keep new logic behind feature helpers instead of pushing more business rules
  into screens
- Create an achievements model/service under `src/features/stats` or
  `src/features/dreams/model`
- Keep filter state serializable and testable
- Define an explicit export schema such as:

```ts
type DreamExportV1 = {
  version: 1;
  exportedAt: string;
  locale?: 'en' | 'uk';
  dreams: Dream[];
  reminderSettings?: {
    enabled: boolean;
    hour: number;
    minute: number;
  };
};
```

- Do not implement import UI unless export shape and validation rules are stable

## Open decisions

These should be decided before implementation starts:

1. Should achievements live on `HomeScreen`, `StatsScreen`, or both?
2. Should export include reminder and locale settings in `v1`, or only dreams?
3. Is one-tap voice capture a button on home, on the tab bar, or inside the
   composer hero?
4. Do we want date-range filtering in `0.0.4`, or is mood/tag/type enough?

## Suggested release metadata

- Release branch candidate: `codex/release-v0.0.4`
- Suggested release commit title:
  - `release(v0.0.4): add retention, retrieval, and export foundations`
- Suggested tag after merge:
  - `v0.0.4`

## Open risks

- Filter UX can become cluttered quickly on mobile if too many controls ship at
  once
- Export on React Native may expand scope because of filesystem/share-sheet
  handling
- One-tap audio capture can create edge cases around permissions and interrupted
  recordings
- Achievements can feel childish if the presentation is too loud for a private
  journal product
- Transcription is tempting, but likely too large for a disciplined `0.0.4`
