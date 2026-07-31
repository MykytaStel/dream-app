-- Encrypted sync.
--
-- Until now the server stored dream content in the clear: title, raw_text,
-- transcript and analysis on dream_entries, plus four side tables. The worst of
-- those was dream_sleep_contexts, which held medications, health_notes and
-- important_events — health data, readable by anyone with database access.
--
-- All of it now travels as one sealed blob the server cannot open. Splitting
-- content across encrypted columns was rejected: nine places to get wrong, a
-- migration per new field, and CHECK constraints that only mean anything on
-- plaintext.
--
-- The owner's decision was to discard the cloud copy rather than migrate it,
-- which is what makes this safe to do as a schema change: there is nothing to
-- re-encrypt server-side, because the server never had the key. Devices
-- re-upload from their local archive, which is the source of truth.

-- 1. Discard the cloud copy.
--
-- Storage rows go first so no dream_entries row is deleted while an audio
-- object still points at it. Note: this removes the object records; files
-- already re-uploaded under the same path are overwritten by the client, but
-- objects belonging to dreams deleted long ago may linger in the storage
-- backend and are cleaned up out of band.
delete from storage.objects where bucket_id = 'dream-audio';
delete from public.dream_entries;

-- 2. The side tables disappear entirely.
--
-- Their contents move inside the blob, where order replaces the `position`
-- column. Dropping dream_tags also closes a leak that survived encrypting the
-- entry itself: a list of tags describes what the dreams are about.
drop table if exists public.dream_tags;
drop table if exists public.dream_wake_emotions;
drop table if exists public.dream_pre_sleep_emotions;
drop table if exists public.dream_sleep_contexts;

-- Existed only to gate the tables above.
drop function if exists public.can_access_dream(text);

-- 3. Content columns give way to the blob.
alter table public.dream_entries
  drop column if exists created_at,
  drop column if exists sleep_date,
  drop column if exists title,
  drop column if exists raw_text,
  drop column if exists transcript,
  drop column if exists transcript_status,
  drop column if exists transcript_source,
  drop column if exists transcript_updated_at,
  drop column if exists mood,
  drop column if exists lucidity,
  drop column if exists lucid_practice,
  drop column if exists nightmare,
  drop column if exists archived_at,
  drop column if exists starred_at,
  drop column if exists analysis_provider,
  drop column if exists analysis_status,
  drop column if exists analysis_summary,
  drop column if exists analysis_themes,
  drop column if exists analysis_generated_at,
  drop column if exists analysis_error_message;

alter table public.dream_entries
  add column if not exists ciphertext text not null,
  add column if not exists cipher_version smallint not null default 1;

-- An empty blob would mean a record that decrypts to nothing, which is
-- indistinguishable from data loss on the device that pulls it.
alter table public.dream_entries
  add constraint dream_entries_ciphertext_not_empty
  check (length(ciphertext) > 0);

-- 4. updated_at stops being rewritten by the server.
--
-- The trigger overwrote the client's value with now() on every upsert, so the
-- column recorded when a row was last uploaded rather than when the dream was
-- last edited. Conflict resolution compares exactly this column against the
-- local edit time, so a freshly uploaded remote row always looked newer than a
-- local edit made moments before. The client sets the value explicitly; the
-- server no longer touches it.
drop trigger if exists set_dream_entries_updated_at on public.dream_entries;

create index if not exists dream_entries_user_updated_idx
  on public.dream_entries (user_id, updated_at desc);

-- 5. Recordings stop being audio, as far as storage is concerned.
--
-- A voice note is the dream, narrated. Sealing the text while uploading the
-- audio in the clear would leave the promise broken and only look kept. What
-- goes up is now a blob, so the bucket must stop insisting on audio/* — with
-- the old list every upload would be rejected outright.
update storage.buckets
set allowed_mime_types = array['application/octet-stream']
where id = 'dream-audio';

-- 6. A value that proves a device holds the right key.
--
-- Two devices that each generated their own key would otherwise both sync
-- happily, each writing records the other cannot read, and nothing would report
-- an error. A device compares its key against this before uploading; a mismatch
-- means asking for the recovery code instead of corrupting the archive.
alter table public.profiles
  add column if not exists archive_key_check text;
