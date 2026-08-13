# Analytics pipeline — making §9 measurable

Date: 2026-08-13
Plan section: `~/.claude/plans/dream-app-product-plan-2026-08-03.md` §9 (Метрики) and
§11 (Перевірка з користувачами).

## Program note

§9 defines a North Star metric, a ten-step funnel, and eight numeric beta goals.
None of them are computable today. `observability.trackEvent()` reaches
`console.log` in dev (`consoleObservability.ts:41`) and `Sentry.addBreadcrumb`
in production (`sentryObservability.ts`) — a breadcrumb is only visible if a
crash occurs, and only attached to that crash. There is no analytics SDK in
`package.json`, and no install or anonymous identifier anywhere in the codebase,
so retention cohorting is not merely unimplemented but impossible.

This spec builds the pipe: identity, an on-device queue, a corrected event
taxonomy, and a transport. It deliberately stops short of the queries that read
the data (a separate slice) and of wiring `SENTRY_DSN` (independent, cheaper,
also separate).

## Design

### Transport: pluggable, Supabase first

The owner chose Supabase now with PostHog possible later, so the transport sits
behind an interface rather than being called directly. This mirrors a pattern
the codebase already uses: `setObservabilityProvider`
(`src/services/observability/index.ts:38`) swaps the Sentry backend the same
way. The analytics transport follows it, so adding PostHog after beta touches
one file and no event call sites.

```ts
export type AnalyticsTransport = {
  /** Resolves true when the batch was accepted and can be dropped locally. */
  send(batch: AnalyticsEvent[]): Promise<boolean>;
};
```

Supabase is always reachable: `config/cloud.ts` falls back to a bundled URL and
publishable key (`BUNDLED_SUPABASE_URL` / `BUNDLED_SUPABASE_ANON_KEY`,
`config/cloud.ts:19-21`), so `getSupabaseClient()` returns a client for every
user regardless of whether they ever opened cloud settings. Analytics therefore
does **not** depend on cloud sync being enabled — a dependency that would have
biased the sample to cloud users only.

### Identity

- **`installId`** — a UUID generated once and stored in MMKV under a new
  `ANALYTICS_INSTALL_ID_KEY`. Not derived from any device identifier: a random
  value the app itself mints. A reinstall produces a new id, and that is
  correct and honest rather than a defect to engineer around.
- **`sessionId`** — a UUID minted on cold start and again whenever the app
  returns to foreground after 30 minutes or more in the background. Reuses the
  `AppState` pattern already used by `useAppLockGate.ts` and `useNightCapture.ts`.

Neither is ever sent to Sentry, and neither is linked to the Supabase auth
`userId` used by cloud sync. Someone with database access must not be able to
join a person's dreams to their analytics trail.

### The on-device queue

Events are appended to a queue in MMKV, never sent inline. Requirements:

- Capacity 500 events; on overflow the **oldest** is dropped. A user who is
  offline for a week loses their earliest events, not their most recent — the
  recent ones describe what they are doing now.
- `track()` never throws, never awaits, and never blocks a UI interaction. An
  analytics failure must be invisible to the person using the app.
- The queue survives process death, which is the entire reason it lives in MMKV
  rather than memory.

### The content guard — allowlist, not denylist

`sentryRedaction.ts` protects the Sentry path with a denylist of keys that might
carry dream content, and its own comment explains the reasoning: the context
type already restricts values to primitives, so the risk being guarded is a
caller putting dream text into one of them.

This pipe takes the stricter approach: **each event declares its allowed
property keys, and anything not on that list is dropped before the event enters
the queue.** The difference matters because of how the two pipes fail. A new
key added to a Sentry context is seen by one vendor's error viewer; a new key
added here is written to a database row and read back in aggregate for months.
An allowlist fails closed — a property nobody thought about is absent rather
than present.

The §9 prohibition is the acceptance criterion: dream text, transcript, title,
tags, symbols, search queries and mood values must never leave the device. A
test asserts this against a payload deliberately stuffed with all of them.

### Event taxonomy — two namespaces

The registry today is split in two without anyone deciding that it should be:
21 typed entries in `OBS_EVENTS`, plus 17 raw string literals passed straight to
`observability.trackEvent()` from services (`storage_diagnostics_read`,
`archive_health_scanned`, `local_data_transaction_*`, `audio_cleanup_maintenance`
and others). The untyped half is invisible in the registry, and almost all of it
is infrastructure telemetry rather than product behaviour.

Both halves move into one typed registry under two namespaces:

- **`product.*`** — the funnel and the North Star. What a person did.
- **`diag.*`** — storage migrations, archive health, cleanup runs. What the app
  did to itself.

They are separated because every §9 query filters to one or the other, and
mixing them makes every such query wrong by default rather than by accident.

### Events to add

Seven events the funnel needs and that do not exist:

| Event | Why §9 needs it |
|---|---|
| `product.onboarding_opened` | Funnel step 1 — currently unmeasurable |
| `product.onboarding_completed` | Funnel step 2, and the denominator for ">60% save a first dream" |
| `product.dream_detail_opened` | "First old dream reopened" — the revisit loop (§5.2) |
| `product.memory_opened` | Denominator for "≥30% with 10+ dreams open Memory" |
| `product.pattern_opened` | Funnel step 8 |
| `product.pattern_confirmed` | "≥20% confirm a pattern" — §5.1's differentiator |
| `product.backup_enabled` | Funnel step 9; distinct from the existing `backup_export_started` |

Two existing events gain properties:

- **`dream_saved`** gains `dream_index: number` — which dream this is by count,
  read from the existing meta counter. It carries no content, and it is what
  makes the 1→2 transition (the earliest retention signal there is) visible.
- **`capture_started`** and **`dream_saved`** share a `capture_id`. Without a
  correlation id, "median time to first Save" cannot be computed at all, because
  there is no way to know which save belongs to which capture.

### Storage schema

One table, `analytics_events`, with columns for `install_id`, `session_id`,
`event`, `props` (jsonb), `client_ts`, `server_ts`, `app_version`, `platform`,
`locale`. Server timestamp is set by the database, not trusted from the client —
device clocks are wrong often enough to corrupt a retention query, and §4
already lists timezone changes as a known hazard.

**RLS is the entire security boundary and must be verified, not assumed.** The
publishable key is bundled in the app binary and committed to the repository,
which is the intended Supabase model — but it means the only thing preventing
any holder of that key from reading every user's event stream is the policy on
this table. Required: `anon` may `INSERT` and may not `SELECT`, `UPDATE` or
`DELETE`. The implementation is not complete until a read attempt with the
publishable key has been executed and observed to fail.

### Flush policy

Batches of up to 50, triggered when the app goes to background, when it opens,
and when the queue exceeds 50 entries. Failure keeps the batch and retries with
backoff; success drops it. Nothing about this is visible in the UI.

### Opt-out

On by default for the beta, with a row in Settings to turn it off and a plain
sentence during onboarding saying what is collected and what never is. The
reasoning is that opt-in across 30–50 testers yields perhaps a dozen
participants, which makes every §9 target statistically meaningless — the work
would be done and the question still unanswered. Beta testers volunteered to
test.

**This default is scoped to the beta and must be revisited before public
release**, where the calculus is different and the answer likely is too.

## Explicitly out of scope

- The SQL views and the metric-to-query document that read this data — a
  separate slice, and one that cannot be validated until events actually flow.
- Wiring `SENTRY_DSN` into the iOS and Android builds — independent of this
  pipe, cheaper, and separately verifiable.
- Privacy policy copy, `PrivacyScreen` text and App Store nutrition-label
  answers — a separate slice that can run in parallel.
- A PostHog transport. The interface exists for it; the implementation does not
  belong to this slice.
- Any change to what the existing Sentry path does or how `sentryRedaction.ts`
  works.

## Testing

- The content guard, against a payload containing dream text, transcript, title,
  tags, symbols, a search query and a mood value: every one is absent from the
  queued event. This is the test that protects the product's central promise, so
  it asserts on the serialized payload rather than on an intermediate object.
- Queue behaviour: overflow drops oldest and not newest; a failed send leaves
  the batch queued; a successful send drops it; `track()` with a throwing
  transport does not throw.
- Identity: `installId` is stable across calls and across a simulated restart;
  `sessionId` changes after a 30-minute background gap and does not change after
  a short one.
- `npx tsc --noEmit`, `npx eslint` on changed files, and the full `npx jest`
  suite.
- Manual, and required before this slice is considered done: install a build,
  perform a capture, background the app, and observe the rows arrive in
  Supabase. Then attempt a `SELECT` against `analytics_events` using the bundled
  publishable key and confirm it is refused.
