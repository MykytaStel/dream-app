# Release 0.6.0

## Goal

Ship the first connected reflection build where `Review workspace` feels like a
real product surface and its saved state survives cloud, backup, and restore
flows confidently.

## Must-have

- app and build metadata point to `0.6.0`
- `Review workspace` separates:
  - local follow-ups
  - important dreams
  - merged saved sets for months and threads
- saved review state survives:
  - app restart
  - local import/restore
  - cloud sync pull/push
- cloud sync no longer pays avoidable `O(n^2)` work when hydrating remote dream
  relation rows

## Product scope

- elevate starred dreams into the review flow as first-class `important dreams`
- merge saved month and saved thread surfaces into one calmer `saved sets`
  layer
- keep wake capture and dream detail behavior unchanged

## Backend scope

- replace scattered saved-review persistence with one local review-state
  snapshot
- sync that review-state snapshot through Supabase when cloud is enabled
- export and import review-state snapshot together with dreams
- migrate existing local saved month/thread data into the unified review-state
  store

## Notes

- review-state remains local-first; cloud only mirrors it when enabled
- important dreams continue to use the existing dream `starredAt` field
- no new server-side AI or collaboration scope in this release
