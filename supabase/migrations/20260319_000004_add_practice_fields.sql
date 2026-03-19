alter table public.dream_entries
  add column if not exists lucid_practice jsonb,
  add column if not exists nightmare jsonb;
