# Supabase Scaffold

This folder is the backend-prep scaffold for Kaleidoskop.

Current scope:

- SQL migrations
- storage conventions
- future sync contract alignment

Not included yet:

- local Supabase CLI project config
- generated types
- app-side auth or sync integration

## Folder rule

Treat this as schema-first infrastructure.
Do not wire user-facing auth or sync from here until the offline loop remains stable.

## Current artifacts

- `migrations/20260311_000001_init_dream_sync.sql`
- `migrations/20260311_000002_add_dream_tombstones.sql`
- `migrations/20260313_000003_add_review_saved_state_snapshots.sql`
- `migrations/20260319_000004_add_practice_fields.sql`
- `migrations/20260731_000005_encrypt_dream_content.sql`
- `migrations/20260813_000006_analytics_events.sql`

## Storage convention

Bucket:

- `dream-audio`

Object path:

- `{user_id}/{dream_id}/{filename}`

