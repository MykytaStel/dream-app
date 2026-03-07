# Release 0.0.16 Plan

## Goal

Ship the first disciplined reflection release after `0.0.15`: make each saved
dream more reusable by adding a clear local analysis layer, stronger trust copy
in Settings, and cleaner release notes for what actually ships in `0.0.16`.

## Release theme

- Dreams become easier to revisit, not just store
- Analysis stays local-first and explicit
- Settings become the control surface for trust, provider state, and build info

## Scope

### 1. Local dream analysis becomes first-class

- Add a clear analysis block on `DreamDetailScreen`
- Let users generate, regenerate, and clear analysis from the dream detail view
- Persist:
  - summary
  - themes
  - provider
  - status
  - generated timestamp
- Keep the default provider local/manual so the feature works without network

### 2. Analysis trust layer in Settings

- Surface whether the analysis layer is enabled or disabled
- Surface which provider is selected
- Surface whether network access is blocked or allowed
- Keep `OpenAI` visible as a planned path, but do not ship real network
  analysis in `0.0.16`
- Keep privacy language direct:
  - local-first by default
  - no account required
  - no sync dependency

### 3. Export and build-surface cleanup

- Ensure export payloads include analysis metadata and analysis settings
- Keep `Settings` as the place where the user can verify:
  - app version
  - storage/export context
  - privacy posture
- Update README and release notes so `0.0.16` has a visible written scope

## Suggested release notes

- Added local dream analysis with generated summary and recurring themes
- Added analysis controls in dream detail to generate, regenerate, or clear a reflection
- Expanded Settings with analysis state, provider, privacy, and build context
- Export now carries analysis metadata for safer local backup and restore later

## Scope lock

- no OpenAI integration yet
- no background auto-analysis queue
- no cloud sync or account system
- no rewriting of the user's original text or transcript

## Definition of done

- A saved dream can generate local analysis from existing text, transcript, tags,
  and sleep context
- Generated summary and themes persist across app relaunch
- Users can remove stale analysis and regenerate it intentionally
- Settings clearly show the analysis boundary and privacy posture
- Export payload includes the new analysis surface
- Version `0.0.16` is aligned across runtime, mobile build configs, and README

## Suggested release commit

- `release(v0.0.16): ship local dream analysis and settings trust layer`
