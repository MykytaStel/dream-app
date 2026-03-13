create table if not exists public.review_saved_state_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  updated_at timestamptz not null default timezone('utc', now()),
  saved_months jsonb not null default '[]'::jsonb,
  saved_threads jsonb not null default '[]'::jsonb,
  inserted_at timestamptz not null default timezone('utc', now())
);

create index if not exists review_saved_state_updated_idx
  on public.review_saved_state_snapshots (updated_at desc);

alter table public.review_saved_state_snapshots enable row level security;

create policy "review_saved_state_select_own"
on public.review_saved_state_snapshots
for select
to authenticated
using (auth.uid() = user_id);

create policy "review_saved_state_insert_own"
on public.review_saved_state_snapshots
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "review_saved_state_update_own"
on public.review_saved_state_snapshots
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "review_saved_state_delete_own"
on public.review_saved_state_snapshots
for delete
to authenticated
using (auth.uid() = user_id);
