# Release 0.0.5 Checklist

## Scope locked

- Offline transcription foundation added:
  - `whisper.rn` integrated
  - runtime local model download path
  - manual transcript action from dream detail
  - transcript persistence on dream records
  - transcript status lifecycle: idle, processing, ready, error
- Retrieval upgraded for transcripts:
  - timeline search includes `transcript`
  - timeline preview falls back to transcript when written notes are absent
  - transcript badge appears on timeline cards
- Trust and control layer added:
  - settings show offline model status
  - settings show model file path and size
  - settings can download the model ahead of first use
  - settings can delete the local model
- Storage updated:
  - schema bumped to `3`
  - transcript fields normalized by migration
  - stale `processing` transcript state degrades to `error`
- Test coverage added for:
  - transcript-aware search
  - transcript migration behavior
  - model install/status/delete
  - transcription success and failure flows

## Pre-release checks

- Run `yarn typecheck`
- Run `yarn lint`
- Run `yarn test:ci`
- Run iOS app and verify:
  - `Settings > Offline transcription` shows correct initial model state
  - tapping `Download offline model` downloads the model and updates status
  - tapping `Delete local model` removes it and resets status
  - audio dream detail shows `Transcribe audio`
  - transcription progress is visible
  - successful transcript persists after app relaunch
  - transcript search works from Home
- Run Android app and verify the same flows

## Smoke scenarios

- Create an audio-only dream, then confirm:
  - it appears with `Audio` tag in Home
  - detail screen offers transcription
- Download the offline model from Settings, then confirm:
  - model status changes to downloaded
  - size/path are populated
- Transcribe an existing voice dream, then confirm:
  - transcript appears in detail
  - Home preview switches from generic audio hint to transcript text
  - Home shows transcript badge
  - searching a phrase from transcript finds the dream
- Force an error case if possible, then confirm:
  - transcript state becomes recoverable
  - original audio note is still playable
  - retry remains available

## Branch and tagging

- Release branch candidate: `codex/release-v0.0.5`
- Suggested release commit title:
  - `release(v0.0.5): add offline transcription for voice dreams`
- Suggested tag after merge:
  - `v0.0.5`

## Roll-forward note

- If a post-release hotfix is needed, branch from tag:
  - `codex/hotfix-v0.0.5.x`
