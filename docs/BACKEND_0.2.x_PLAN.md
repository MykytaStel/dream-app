# Backend 0.2.x Plan

## Goal

Start backend work without breaking the current local-first `0.2.1` loop.

This phase is not a cloud release.
It is backend preparation on top of the `0.2.1` product shape.

## Product rule

- wake capture must still work fully offline
- no auth gate before the user can record a dream
- no sync dependency inside the first-save path
- backend contracts should mirror the current local model, not redesign it

## What lands in 0.2.x

- Supabase schema and migrations
- storage bucket convention for original audio
- shared TypeScript DTO/contracts for sync work
- implementation plan for auth and sync

## What does not land in 0.2.x

- mandatory sign-in
- multi-device sync in production
- backend-required transcription
- backend-required analysis
- server-side thread generation as a dependency for Memory

## Recommended release split

### 0.2.1

Finish the local memory-first product:

- wake flow
- dream detail polish
- Memory framing
- related dreams / threads lite
- export / restore

### 0.2.x

Prepare backend safely:

- land schema
- land storage path convention
- define sync DTOs
- add app-side adapters behind repositories

### 0.3.0

Ship the first user-visible cloud release:

- auth
- sync
- audio upload
- conflict handling
- session-aware settings

## Repo shape

Keep backend prep in the same repo for now.

```txt
supabase/
  migrations/
src/
  services/
    api/
      contracts/
docs/
  BACKEND_0.2.x_PLAN.md
```

This keeps mobile models, database contracts, and future sync code aligned in one change set.

## Current backend stack choice

- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase Edge Functions later

Do not start with a custom Node backend.
That adds too much surface area before the sync loop is proven.

## Audio storage convention

Bucket:

- `dream-audio`

Object path:

- `{user_id}/{dream_id}/{filename}`

This keeps ownership checks simple and preserves raw voice as a first-class memory artifact.

## Contract rule

The current local `Dream` model stays the source of truth.

Backend work should map:

- `text` -> `raw_text`
- `audioUri` -> `audio_storage_path`
- `analysis` -> flattened analysis columns
- tags and emotion arrays -> child tables
- sleep context -> one-to-one context table

## Integration order

1. Land the schema and policies.
2. Add typed DTOs and mapping helpers in `src/services/api/contracts`.
3. Add a thin `apiClient` and keep it unused by default.
4. Add background-safe upload/sync orchestration behind repositories.
5. Expose auth/sync to users only in `0.3.0`.

## Ready-to-start files

- `supabase/migrations/20260311_000001_init_dream_sync.sql`
- `src/services/api/contracts/dreamSync.ts`
