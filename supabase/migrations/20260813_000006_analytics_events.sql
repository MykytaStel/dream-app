-- Product analytics.
--
-- Every other table in this schema is reachable only by an authenticated user
-- reading their own rows. This one is different on purpose: analytics must
-- cover people who never sign in, so the anon role can insert. That is a real
-- trust boundary, and the mitigations are deliberate rather than incidental:
--
--   * nobody can read this table through the API — no select policy exists for
--     any role, so a leaked publishable key yields write-only access;
--   * the event name is constrained to a fixed list, so the table cannot be
--     used as free-form storage;
--   * every text column is length-capped and props is size-capped, so one row
--     cannot be large;
--   * server_ts is set by the database. A client clock is evidence of nothing,
--     and the app's own §4 edge-case list already names timezone changes as a
--     known hazard.
--
-- Forging events cannot be prevented: the publishable key ships inside the app
-- binary, and no client-side secret can prove authenticity. This is true of
-- every analytics vendor. What the design does is bound the damage.
--
-- install_id is minted by the app and is deliberately NOT auth.users.id. The
-- point of the separation is that someone with database access can read
-- behaviour or read (encrypted) dreams, but cannot join the two.

-- The id is minted on the device at enqueue time, not here. Delivery is
-- at-least-once by design: the app flushes when it is backgrounded, which is
-- exactly when the OS may suspend the process after the insert commits but
-- before the response arrives. The retry that follows would otherwise insert
-- the same events again and inflate every §9 count.
create table if not exists public.analytics_events (
  id uuid primary key,
  install_id uuid not null,
  session_id uuid not null,
  event text not null,
  props jsonb not null default '{}'::jsonb,
  client_ts timestamptz not null,
  server_ts timestamptz not null default timezone('utc', now()),
  app_version text not null,
  platform text not null,
  locale text not null
);

-- The allowlist. An event outside it is rejected by the database rather than
-- landing as a row nobody queries. Adding an event means a migration, which is
-- the intended friction: the taxonomy is a contract, not a scratch pad.
alter table public.analytics_events
  drop constraint if exists analytics_events_event_known;

alter table public.analytics_events
  add constraint analytics_events_event_known
  check (event in (
    'product.app_opened',
    'product.onboarding_opened',
    'product.onboarding_completed',
    'product.capture_started',
    'product.draft_resumed',
    'product.dream_saved',
    'product.dream_detail_opened',
    'product.memory_opened',
    'product.pattern_opened',
    'product.pattern_confirmed',
    'product.search_used',
    'product.filters_applied',
    'product.reminder_toggled',
    'product.biometric_lock_toggled',
    'product.backup_enabled',
    'product.backup_export_started',
    'product.backup_export_completed',
    'product.restore_started',
    'product.restore_completed',
    'product.practice_hub_opened',
    'product.lucid_practice_started',
    'product.reality_check_completed',
    'product.wbtb_alarm_used',
    'product.nightmare_rescripting_started',
    'product.nightmare_rescripting_completed',
    'product.grounding_opened',
    'product.dream_sign_saved'
  ));

alter table public.analytics_events
  drop constraint if exists analytics_events_platform_known;

alter table public.analytics_events
  add constraint analytics_events_platform_known
  check (platform in ('ios', 'android'));

alter table public.analytics_events
  drop constraint if exists analytics_events_bounded;

alter table public.analytics_events
  add constraint analytics_events_bounded
  check (
    length(app_version) <= 32
    and length(locale) <= 16
    and pg_column_size(props) <= 2048
  );

-- Retention queries scan by install and by day; the funnel scans by event.
create index if not exists analytics_events_install_ts_idx
  on public.analytics_events (install_id, server_ts);

create index if not exists analytics_events_event_ts_idx
  on public.analytics_events (event, server_ts);

alter table public.analytics_events enable row level security;

-- Insert only, for both roles. There is deliberately no select, update or
-- delete policy: with RLS on and no policy, those are denied for everyone
-- holding an API key. Reading happens through the SQL editor or a service-role
-- connection, neither of which is reachable from the app.
drop policy if exists "analytics_events_insert_anon" on public.analytics_events;
create policy "analytics_events_insert_anon"
on public.analytics_events
for insert
to anon
with check (true);

drop policy if exists "analytics_events_insert_authenticated" on public.analytics_events;
create policy "analytics_events_insert_authenticated"
on public.analytics_events
for insert
to authenticated
with check (true);
