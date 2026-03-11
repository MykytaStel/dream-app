create table if not exists public.dream_entry_tombstones (
  dream_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  deleted_at timestamptz not null,
  inserted_at timestamptz not null default timezone('utc', now())
);

create index if not exists dream_entry_tombstones_user_deleted_idx
  on public.dream_entry_tombstones (user_id, deleted_at desc);

alter table public.dream_entry_tombstones enable row level security;

create policy "dream_entry_tombstones_select_own"
on public.dream_entry_tombstones
for select
to authenticated
using (auth.uid() = user_id);

create policy "dream_entry_tombstones_insert_own"
on public.dream_entry_tombstones
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "dream_entry_tombstones_update_own"
on public.dream_entry_tombstones
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "dream_entry_tombstones_delete_own"
on public.dream_entry_tombstones
for delete
to authenticated
using (auth.uid() = user_id);
