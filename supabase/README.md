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

## Storage convention

Bucket:

- `dream-audio`

Object path:

- `{user_id}/{dream_id}/{filename}`

