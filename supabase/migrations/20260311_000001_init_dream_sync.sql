create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  locale text not null default 'en',
  timezone text not null default 'UTC',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create table if not exists public.dream_entries (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null,
  updated_at timestamptz not null default timezone('utc', now()),
  sleep_date date,
  title text,
  raw_text text,
  audio_storage_path text,
  transcript text,
  transcript_status text check (
    transcript_status in ('idle', 'processing', 'ready', 'error')
  ),
  transcript_source text check (
    transcript_source in ('generated', 'edited')
  ),
  transcript_updated_at timestamptz,
  mood text check (
    mood in ('neutral', 'positive', 'negative')
  ),
  lucidity smallint check (
    lucidity between 0 and 3
  ),
  archived_at timestamptz,
  starred_at timestamptz,
  analysis_provider text check (
    analysis_provider in ('manual', 'openai')
  ),
  analysis_status text check (
    analysis_status in ('idle', 'ready', 'error')
  ),
  analysis_summary text,
  analysis_themes text[] not null default '{}',
  analysis_generated_at timestamptz,
  analysis_error_message text,
  inserted_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.dream_tags (
  dream_id text not null references public.dream_entries (id) on delete cascade,
  tag text not null,
  position smallint not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (dream_id, tag)
);

create table if not exists public.dream_wake_emotions (
  dream_id text not null references public.dream_entries (id) on delete cascade,
  emotion text not null check (
    emotion in ('calm', 'uneasy', 'curious', 'heavy', 'inspired', 'disoriented')
  ),
  position smallint not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (dream_id, emotion)
);

create table if not exists public.dream_sleep_contexts (
  dream_id text primary key references public.dream_entries (id) on delete cascade,
  stress_level smallint check (
    stress_level between 0 and 3
  ),
  alcohol_taken boolean,
  caffeine_late boolean,
  medications text,
  important_events text,
  health_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_dream_sleep_contexts_updated_at on public.dream_sleep_contexts;
create trigger set_dream_sleep_contexts_updated_at
before update on public.dream_sleep_contexts
for each row
execute function public.set_updated_at();

create table if not exists public.dream_pre_sleep_emotions (
  dream_id text not null references public.dream_entries (id) on delete cascade,
  emotion text not null check (
    emotion in ('peaceful', 'anxious', 'restless', 'hopeful', 'drained', 'lonely')
  ),
  position smallint not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (dream_id, emotion)
);

drop trigger if exists set_dream_entries_updated_at on public.dream_entries;
create trigger set_dream_entries_updated_at
before update on public.dream_entries
for each row
execute function public.set_updated_at();

create index if not exists dream_entries_user_created_idx
  on public.dream_entries (user_id, created_at desc);

create index if not exists dream_entries_user_sleep_date_idx
  on public.dream_entries (user_id, sleep_date desc nulls last);

create index if not exists dream_entries_user_starred_idx
  on public.dream_entries (user_id, starred_at desc)
  where starred_at is not null;

create index if not exists dream_entries_user_archived_idx
  on public.dream_entries (user_id, archived_at desc)
  where archived_at is not null;

create index if not exists dream_tags_tag_idx
  on public.dream_tags (tag);

create index if not exists dream_wake_emotions_emotion_idx
  on public.dream_wake_emotions (emotion);

create index if not exists dream_pre_sleep_emotions_emotion_idx
  on public.dream_pre_sleep_emotions (emotion);

create or replace function public.can_access_dream(target_dream_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.dream_entries dream
    where dream.id = target_dream_id
      and dream.user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.dream_entries enable row level security;
alter table public.dream_tags enable row level security;
alter table public.dream_wake_emotions enable row level security;
alter table public.dream_sleep_contexts enable row level security;
alter table public.dream_pre_sleep_emotions enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "dream_entries_select_own"
on public.dream_entries
for select
to authenticated
using (auth.uid() = user_id);

create policy "dream_entries_insert_own"
on public.dream_entries
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "dream_entries_update_own"
on public.dream_entries
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "dream_entries_delete_own"
on public.dream_entries
for delete
to authenticated
using (auth.uid() = user_id);

create policy "dream_tags_manage_own"
on public.dream_tags
for all
to authenticated
using (public.can_access_dream(dream_id))
with check (public.can_access_dream(dream_id));

create policy "dream_wake_emotions_manage_own"
on public.dream_wake_emotions
for all
to authenticated
using (public.can_access_dream(dream_id))
with check (public.can_access_dream(dream_id));

create policy "dream_sleep_contexts_manage_own"
on public.dream_sleep_contexts
for all
to authenticated
using (public.can_access_dream(dream_id))
with check (public.can_access_dream(dream_id));

create policy "dream_pre_sleep_emotions_manage_own"
on public.dream_pre_sleep_emotions
for all
to authenticated
using (public.can_access_dream(dream_id))
with check (public.can_access_dream(dream_id));

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'dream-audio',
  'dream-audio',
  false,
  52428800,
  array[
    'audio/aac',
    'audio/m4a',
    'audio/mp4',
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "dream_audio_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'dream-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "dream_audio_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'dream-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "dream_audio_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'dream-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'dream-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "dream_audio_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'dream-audio'
  and (storage.foldername(name))[1] = auth.uid()::text
);

