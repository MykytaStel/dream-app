# Release 0.0.4 Checklist

## Scope locked

- Timeline retrieval upgraded:
  - search
  - active/archive status filter
  - mood filter
  - tag filter
  - entry type filter: text, audio, mixed
  - sort: newest/oldest
  - clear filter state
- Motivation layer added:
  - recording milestones
  - weekly goal progress
- Repeat capture improved:
  - `Record now` shortcut on Home
  - `Continue draft` shortcut when local draft exists
  - voice-entry launch path into Record tab
- Trust layer added:
  - local JSON export from Settings
  - versioned export payload
  - export includes dreams, locale, reminder settings
- Test coverage added for:
  - timeline filter/sort rules
  - achievements rules
  - export payload/versioning
  - fast capture route mapping

## Pre-release checks

- Run `yarn typecheck`
- Run `yarn lint`
- Run `yarn test:ci`
- Run iOS app and verify:
  - Home search and filters behave correctly together
  - result count changes correctly
  - archive/unarchive keeps filter state predictable
  - `Record now` opens Record flow and starts audio capture path correctly
  - `Continue draft` appears only when a draft exists
  - Stats milestones and weekly goal update after save/edit/archive
  - Settings export creates a JSON file and shows the saved path
- Run Android app and verify the same flows

## Smoke scenarios

- Create text-only dream, then confirm:
  - appears in Home
  - affects streak/entries/average words
  - export payload includes it
- Create audio-only dream from `Record now`, then confirm:
  - recording starts from quick entry
  - dream can be saved
  - milestone for first voice dream unlocks
- Save a partial draft, return to Home, then confirm:
  - `Continue draft` appears
  - draft content is restored in Record
- Apply multiple filters, then confirm:
  - result count updates
  - no-results state is correct
  - clear filters resets only refinements, not app state

## Branch and tagging

- Release branch candidate: `codex/release-v0.0.4`
- Suggested release commit title:
  - `release(v0.0.4): add retrieval, milestones, repeat capture, and export`
- Suggested tag after merge:
  - `v0.0.4`

## Roll-forward note

- If a post-release hotfix is needed, branch from tag:
  - `codex/hotfix-v0.0.4.x`
