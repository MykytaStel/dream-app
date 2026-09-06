# Beta metrics — the numbers and the SQL

Every metric here is answerable from one table, `public.analytics_events`
(schema: `supabase/migrations/20260813_000006_analytics_events.sql`). That table
is **write-only through the API** — run these queries in the Supabase SQL editor
or a direct connection, never from the app.

## The table

| Column | Meaning |
|---|---|
| `id` | client-minted UUID; the dedupe key (delivery is at-least-once) |
| `install_id` | per-install UUID, **not** `auth.users.id` — this is the unit for "a person" |
| `session_id` | per-app-launch UUID |
| `event` | one of the `product.*` names (allowlisted by a check constraint) |
| `props` | jsonb; content-free counts and enums only, never dream text |
| `client_ts` | device clock — evidence of nothing on its own, timezone changes are a known hazard |
| `server_ts` | database clock (UTC); **use this for all time math** |
| `app_version`, `platform`, `locale` | build context |

**Always dedupe first.** Every query below starts from this CTE:

```sql
with ev as (
  select distinct on (id) *
  from public.analytics_events
  order by id, server_ts
)
```

`diag.*` events never reach this table (the analytics guard drops them); they
stay in Sentry.

## Event payloads referenced below

| Event | `props` keys |
|---|---|
| `product.app_opened` | — |
| `product.onboarding_completed` | `path` (`voice` \| `text` \| `no-dream`) |
| `product.capture_started` | `capture_id`, `entry_mode` (`default`\|`voice`\|`wake`), `auto_started_recording`, `source` (`manual`\|`reminder`) |
| `product.dream_saved` | `capture_id`, `mode` (`create`\|`edit`), `entry_mode`, `has_audio`, `has_text`, `dream_index` (1-based count at save time) |
| `product.dream_detail_opened` | `dream_age_days`, `source` |
| `product.memory_opened` | `dream_count` |
| `product.pattern_confirmed` | `kind`, `action` (`confirm`\|`reject`) |

---

## The 8 beta target numbers

### 1. >60% of installs save their first dream

"Install" = first `app_opened` for an `install_id`. "Saved first dream" = at
least one `dream_saved` with `mode = 'create'`.

```sql
with ev as (select distinct on (id) * from public.analytics_events order by id, server_ts),
installs as (
  select install_id, min(server_ts) as installed_at
  from ev where event = 'product.app_opened'
  group by install_id
),
first_save as (
  select install_id, min(server_ts) as first_saved_at
  from ev
  where event = 'product.dream_saved' and props->>'mode' = 'create'
  group by install_id
)
select
  count(*)                                        as installs,
  count(first_save.install_id)                    as saved_first_dream,
  round(100.0 * count(first_save.install_id) / nullif(count(*), 0), 1) as pct
from installs
left join first_save using (install_id);
```

### 2. Median time from opening the app to a saved fragment ≤ 2 min

Match `dream_saved` to its `capture_started` by `capture_id`. Only the **first**
save per install (the "morning capture" journey is judged on the first one).

```sql
with ev as (select distinct on (id) * from public.analytics_events order by id, server_ts),
starts as (
  select install_id, props->>'capture_id' as capture_id, min(server_ts) as started_at
  from ev
  where event = 'product.capture_started' and props->>'capture_id' is not null
  group by install_id, props->>'capture_id'
),
saves as (
  select props->>'capture_id' as capture_id, min(server_ts) as saved_at
  from ev
  where event = 'product.dream_saved' and props->>'capture_id' is not null
  group by props->>'capture_id'
),
first_capture as (
  select distinct on (install_id) install_id, capture_id, started_at
  from starts order by install_id, started_at
)
select
  count(*)                                                   as measured,
  percentile_cont(0.5) within group (
    order by extract(epoch from (saves.saved_at - first_capture.started_at))
  )                                                          as median_seconds
from first_capture
join saves using (capture_id)
where saves.saved_at >= first_capture.started_at;
```

### 3. <1% of started captures are lost

There is **no `capture_failed` event** — a lost capture is a `capture_started`
with no `dream_saved` for the same `capture_id`. Treat this as an upper bound,
not an exact figure, and read it alongside Sentry `diag.global_js_error` around
the same `server_ts`.

**One known false positive is filtered here.** After every save the capture
screen remounts a fresh session (`NewDreamScreen` bumps `savedNonce` →
`startCaptureSession()` → a new `capture_started`), so a user who saves once and
then leaves the tab always leaves one childless `capture_id` behind. Those fire
within a second or two of a `dream_saved` in the same session and are dropped
below; a real second capture still counts, because it produces its own save.

```sql
with ev as (select distinct on (id) * from public.analytics_events order by id, server_ts),
saves as (
  select install_id, session_id, server_ts, props->>'capture_id' as capture_id
  from ev where event = 'product.dream_saved'
),
starts as (
  select st.props->>'capture_id' as capture_id
  from ev st
  where st.event = 'product.capture_started' and st.props->>'capture_id' is not null
    and not exists (
      select 1 from saves v
      where v.session_id = st.session_id
        and v.server_ts <= st.server_ts
        and v.server_ts >  st.server_ts - interval '15 seconds'
    )
),
saved_ids as (select distinct capture_id from saves where capture_id is not null)
select
  count(*)                                                     as started,
  count(*) filter (where si.capture_id is null)                as no_save,
  round(100.0 * count(*) filter (where si.capture_id is null)
        / nullif(count(*), 0), 2)                              as pct_upper_bound
from starts
left join saved_ids si using (capture_id);
```

> If this number still reads high once real data lands, the fix is client-side:
> stop emitting `capture_started` on the post-save remount (it is currently
> deliberate — `__tests__/newDreamScreen.test.tsx` asserts the second event) and
> emit it on first real capture activity instead. That is an analytics-semantics
> change and wants its own review.

### 4. >25% week-1 retention · 5. >15% week-4 retention

Cohort by install week (`server_ts` of first `app_opened`). "Retained in week N"
= any event with `server_ts` in `[installed_at + 7*(N-1) days, installed_at + 7*N days)`.

```sql
with ev as (select distinct on (id) * from public.analytics_events order by id, server_ts),
installs as (
  select install_id,
         min(server_ts) as installed_at,
         date_trunc('week', min(server_ts)) as cohort_week
  from ev where event = 'product.app_opened'
  group by install_id
),
activity as (
  select i.cohort_week, i.install_id,
         bool_or(e.server_ts >= i.installed_at + interval '7 days'
             and e.server_ts <  i.installed_at + interval '14 days') as w1,
         bool_or(e.server_ts >= i.installed_at + interval '28 days'
             and e.server_ts <  i.installed_at + interval '35 days') as w4
  from installs i
  join ev e using (install_id)
  group by i.cohort_week, i.install_id
)
select
  cohort_week,
  count(*)                                                   as cohort_size,
  round(100.0 * count(*) filter (where w1) / count(*), 1)    as week1_pct,
  round(100.0 * count(*) filter (where w4) / count(*), 1)    as week4_pct
from activity
group by cohort_week
order by cohort_week;
```

> A cohort's week-4 number is only real once that cohort is ≥ 35 days old.

### 6. ≥30% of people with 10+ dreams open Memory

`memory_opened.props.dream_count` is the count **at the moment Memory was
opened**, so "has 10+ dreams" and "opened Memory" are answerable from that one
event. The denominator (people who *reached* 10 dreams) comes from
`dream_saved.props.dream_index`.

```sql
with ev as (select distinct on (id) * from public.analytics_events order by id, server_ts),
reached_10 as (
  select distinct install_id
  from ev
  where event = 'product.dream_saved' and (props->>'dream_index')::int >= 10
),
opened_memory_at_10 as (
  select distinct install_id
  from ev
  where event = 'product.memory_opened' and (props->>'dream_count')::int >= 10
)
select
  count(*)                                as people_with_10plus,
  count(o.install_id)                     as opened_memory,
  round(100.0 * count(o.install_id) / nullif(count(*), 0), 1) as pct
from reached_10 r
left join opened_memory_at_10 o using (install_id);
```

### 7. ≥20% of people with 10+ dreams confirm a pattern

Same denominator. Numerator: at least one `pattern_confirmed` with
`action = 'confirm'`.

```sql
with ev as (select distinct on (id) * from public.analytics_events order by id, server_ts),
reached_10 as (
  select distinct install_id
  from ev
  where event = 'product.dream_saved' and (props->>'dream_index')::int >= 10
),
confirmed as (
  select distinct install_id
  from ev
  where event = 'product.pattern_confirmed' and props->>'action' = 'confirm'
)
select
  count(*)                                as people_with_10plus,
  count(c.install_id)                     as confirmed_a_pattern,
  round(100.0 * count(c.install_id) / nullif(count(*), 0), 1) as pct
from reached_10 r
left join confirmed c using (install_id);
```

### 8. North Star — dreams saved per active retained user per week

"Retained" = installed ≥ 28 days ago and had activity in the last 7 days.
"Dreams saved" = `dream_saved` with `mode = 'create'`.

```sql
with ev as (select distinct on (id) * from public.analytics_events order by id, server_ts),
installs as (
  select install_id, min(server_ts) as installed_at
  from ev where event = 'product.app_opened' group by install_id
),
retained as (
  select i.install_id
  from installs i
  where i.installed_at < now() - interval '28 days'
    and exists (
      select 1 from ev e
      where e.install_id = i.install_id
        and e.server_ts > now() - interval '7 days'
    )
),
saves_last_week as (
  select install_id, count(*) as n
  from ev
  where event = 'product.dream_saved'
    and props->>'mode' = 'create'
    and server_ts > now() - interval '7 days'
  group by install_id
)
select
  count(retained.install_id)                                  as retained_users,
  coalesce(sum(s.n), 0)                                       as dreams_saved_last_week,
  round(coalesce(sum(s.n), 0)::numeric
        / nullif(count(retained.install_id), 0), 2)           as north_star
from retained
left join saves_last_week s using (install_id);
```

---

## Suggested saved queries

Save these three in the Supabase SQL editor and read them once a week during the
beta:

| Saved query | Answers |
|---|---|
| `beta_funnel` | metrics 1, 2, 3 — does capture work |
| `beta_retention` | metrics 4, 5 — do people come back |
| `beta_depth` | metrics 6, 7, 8 — does the archive earn a return visit |

## Not yet built (a follow-up migration)

- **SQL views** (`funnel_daily`, `retention_cohorts`, `north_star_weekly`) so the
  weekly ritual is `select * from …` rather than pasting a CTE. The queries above
  are the view bodies.
- A `props` **schema check** in the DB (event → required keys) — right now a
  renamed prop key would silently break a metric. Low priority; the taxonomy is
  small and lives in one file (`src/services/observability/events.ts`).
