# Analytics Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the plan's §9 metrics computable — an install identity, a durable
on-device event queue with a content guard, a corrected event taxonomy, and a
pluggable transport whose first implementation writes to Supabase.

**Architecture:** Four layers, each testable alone. Identity and queue are pure
logic over MMKV. The event registry is a typed map with two namespaces. The
transport sits behind an `AnalyticsTransport` interface, mirroring the existing
`setObservabilityProvider` pattern, so a PostHog implementation can be added
later without touching any call site. The Supabase table is `anon`-insertable
and readable by nobody, which is a new trust boundary in this schema and is
constrained accordingly.

**Tech Stack:** React Native, TypeScript, MMKV (`kv`), `@supabase/supabase-js`
(already a dependency, pure JS — no new native module), Jest, PostgreSQL/RLS.

## Global Constraints

- **Nothing that could carry dream content may leave the device.** §9's
  prohibition list is: dream text, transcript, titles, tags, symbols, search
  queries, mood values. Enforced by an allowlist (not a denylist) applied before
  an event enters the queue, with a test that attempts to smuggle every one of
  those and asserts their absence from the serialized payload.
- The analytics `installId` is never linked to the Supabase auth `userId` used
  by cloud sync, and is never sent to Sentry. Someone with database access must
  not be able to join a person's dreams to their behaviour.
- Analytics must not depend on cloud sync being enabled. `getSupabaseClient()`
  always returns a client because `config/cloud.ts` bundles a fallback URL and
  publishable key, so no gate is needed — and adding one would bias the sample
  to cloud users.
- `track()` never throws, never awaits at a call site, and never blocks a UI
  interaction. A transport failure is invisible to the user.
- The server sets `server_ts`; the client's `client_ts` is recorded but never
  trusted for ordering or retention windows. Device clocks are wrong often
  enough to corrupt a cohort, and §4 lists timezone changes as a known hazard.
- No new native dependency. This is deliberate: `pod install` in this repo is
  fragile and must be run through bundler, so a slice that avoids touching the
  native layer entirely is worth protecting.
- Never add a `Co-Authored-By` trailer to any commit.

---

### Task 1: The `analytics_events` table and its RLS

**Files:**
- Create: `supabase/migrations/20260813_000006_analytics_events.sql`
- Modify: `supabase/README.md` (add the new migration to "Current artifacts")

**Interfaces:**
- Produces: a table `public.analytics_events` with columns `id`, `install_id`,
  `session_id`, `event`, `props`, `client_ts`, `server_ts`, `app_version`,
  `platform`, `locale`. Task 4's transport inserts exactly these column names.

This task is SQL only and lands no client code, but it comes first because
Task 4 cannot be verified without it, and because the owner — not the
implementer — must apply it.

**Trust boundary note for the reviewer:** every other policy in this schema is
`to authenticated`. This table is the first object any holder of the bundled
publishable key can write to. That is unavoidable for anonymous analytics with a
client-side app — the key ships in the binary, and no client-side secret can
prove authenticity. The design therefore bounds the damage rather than
preventing forgery: write-only (no `select`, `update` or `delete` for anyone),
a fixed event-name allowlist enforced in the database, and length caps on every
text column so a single row cannot be large.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260813_000006_analytics_events.sql`:

```sql
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
--   * server_ts is set by the database. A client clock is evidence of nothing.
--
-- install_id is minted by the app and is deliberately NOT auth.users.id. The
-- point of the separation is that someone with database access can read
-- behaviour or read (encrypted) dreams, but cannot join the two.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
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
  add constraint analytics_events_platform_known
  check (platform in ('ios', 'android'));

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
create policy "analytics_events_insert_anon"
on public.analytics_events
for insert
to anon
with check (true);

create policy "analytics_events_insert_authenticated"
on public.analytics_events
for insert
to authenticated
with check (true);
```

- [ ] **Step 2: Record the migration in the folder's README**

In `supabase/README.md`, under "## Current artifacts", the list currently names
only the init migration. Add a line for this one so the folder's own index does
not drift from its contents:

```markdown
- `migrations/20260813_000006_analytics_events.sql`
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260813_000006_analytics_events.sql supabase/README.md
git commit -m "feat(db): add write-only analytics_events table"
```

- [ ] **Step 4: Hand the owner the two things only they can do**

This migration is not applied by this plan. Report to the owner, as the task's
closing note, that they must:

1. Apply the migration in the Supabase SQL editor.
2. **Verify the boundary rather than assume it** — from a client holding only
   the bundled publishable key, attempt
   `select * from analytics_events limit 1` and confirm it is refused, then
   attempt an insert and confirm it succeeds. A policy that was believed correct
   and never exercised is not a verified policy.

---

### Task 2: Install identity, session identity, and the guarded queue

**Files:**
- Create: `src/services/analytics/analyticsIdentity.ts`
- Create: `src/services/analytics/analyticsQueue.ts`
- Create: `src/services/analytics/analyticsEvent.ts`
- Modify: `src/services/storage/keys.ts` (three new keys)
- Test: `__tests__/analyticsIdentity.test.ts`
- Test: `__tests__/analyticsQueue.test.ts`
- Test: `__tests__/analyticsContentGuard.test.ts`

**Interfaces:**
- Consumes: `kv` from `src/services/storage/mmkv.ts`.
- Produces:
  - `getInstallId(): string`, `getSessionId(): string`, `noteAppForegrounded(now?: number): void`
  - `type AnalyticsEvent = { event: string; props: Record<string, string | number | boolean>; clientTs: number; installId: string; sessionId: string }`
  - `sanitizeProps(event: string, props: Record<string, unknown>): Record<string, string | number | boolean>`
  - `enqueue(event: AnalyticsEvent): void`, `peekBatch(limit: number): AnalyticsEvent[]`, `dropBatch(count: number): void`, `queueSize(): number`

- [ ] **Step 1: Add the storage keys**

In `src/services/storage/keys.ts`, after the existing
`BIOMETRIC_ONBOARDING_SEEN_KEY` line, add:

```ts
export const ANALYTICS_INSTALL_ID_KEY = 'analytics-install-id';
export const ANALYTICS_QUEUE_KEY = 'analytics-queue';
export const ANALYTICS_OPTED_OUT_KEY = 'analytics-opted-out';
```

- [ ] **Step 2: Write the failing identity test**

Create `__tests__/analyticsIdentity.test.ts`:

```ts
import { kv } from '../src/services/storage/mmkv';
import { ANALYTICS_INSTALL_ID_KEY } from '../src/services/storage/keys';
import {
  getInstallId,
  getSessionId,
  noteAppForegrounded,
  __resetSessionForTests,
} from '../src/services/analytics/analyticsIdentity';

const UUID_SHAPE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('analytics identity', () => {
  beforeEach(() => {
    kv.remove(ANALYTICS_INSTALL_ID_KEY);
    __resetSessionForTests();
  });

  it('mints a uuid-shaped install id', () => {
    expect(getInstallId()).toMatch(UUID_SHAPE);
  });

  it('returns the same install id on every call', () => {
    expect(getInstallId()).toBe(getInstallId());
  });

  it('persists the install id across a simulated restart', () => {
    const first = getInstallId();
    __resetSessionForTests();
    expect(getInstallId()).toBe(first);
  });

  it('keeps the session id stable within a session', () => {
    expect(getSessionId()).toBe(getSessionId());
  });

  it('starts a new session after 30 minutes in the background', () => {
    const before = getSessionId();
    noteAppForegrounded(Date.now() + 31 * 60 * 1000);
    expect(getSessionId()).not.toBe(before);
  });

  it('keeps the session after a short background gap', () => {
    const before = getSessionId();
    noteAppForegrounded(Date.now() + 60 * 1000);
    expect(getSessionId()).toBe(before);
  });
});
```

- [ ] **Step 3: Run it to see it fail**

Run: `npx jest __tests__/analyticsIdentity.test.ts`
Expected: FAIL — `Cannot find module '../src/services/analytics/analyticsIdentity'`.

- [ ] **Step 4: Implement identity**

Create `src/services/analytics/analyticsIdentity.ts`:

```ts
import {
  ANALYTICS_INSTALL_ID_KEY,
} from '../storage/keys';
import { kv } from '../storage/mmkv';

/**
 * A session ends after this long in the background. Long enough that a glance
 * at a notification does not split a morning capture into two sessions, short
 * enough that yesterday and today are never the same session.
 */
const SESSION_IDLE_MS = 30 * 60 * 1000;

/**
 * Minted by the app, not derived from any device identifier, and deliberately
 * unrelated to the Supabase auth user id used by cloud sync. A reinstall
 * produces a new one — that is honest rather than a defect: the app genuinely
 * cannot tell it is the same person, and pretending otherwise would mean
 * reaching for a device id.
 */
function createUuid(): string {
  const hex: string[] = [];
  for (let i = 0; i < 36; i += 1) {
    hex.push('0');
  }

  const chars = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 36; i += 1) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      out += '-';
    } else if (i === 14) {
      out += '4';
    } else if (i === 19) {
      out += chars[(Math.floor(Math.random() * 16) & 0x3) | 0x8];
    } else {
      out += chars[Math.floor(Math.random() * 16)];
    }
  }
  void hex;
  return out;
}

let sessionId: string | null = null;
let lastForegroundAt = Date.now();

export function getInstallId(): string {
  const existing = kv.getString(ANALYTICS_INSTALL_ID_KEY);
  if (existing && existing.trim()) {
    return existing;
  }

  const next = createUuid();
  kv.set(ANALYTICS_INSTALL_ID_KEY, next);
  return next;
}

export function getSessionId(): string {
  if (!sessionId) {
    sessionId = createUuid();
  }
  return sessionId;
}

/**
 * Called when the app returns to the foreground. A gap of SESSION_IDLE_MS or
 * more starts a new session.
 */
export function noteAppForegrounded(now = Date.now()) {
  if (now - lastForegroundAt >= SESSION_IDLE_MS) {
    sessionId = createUuid();
  }
  lastForegroundAt = now;
}

export function __resetSessionForTests() {
  sessionId = null;
  lastForegroundAt = Date.now();
}
```

- [ ] **Step 5: Run the identity test to see it pass**

Run: `npx jest __tests__/analyticsIdentity.test.ts`
Expected: PASS — 6 tests.

- [ ] **Step 6: Write the failing content-guard test**

This is the test that protects the product's central promise, so it asserts on
the serialized payload rather than an intermediate object.

Create `__tests__/analyticsContentGuard.test.ts`:

```ts
import { sanitizeProps } from '../src/services/analytics/analyticsEvent';

describe('analytics content guard', () => {
  it('drops every property the plan forbids collecting', () => {
    const dirty = {
      // §9: "Не збирати: текст снів, transcript, назви, теги, символи,
      // пошукові запити, mood values."
      text: 'I was flying over the sea',
      raw_text: 'I was flying over the sea',
      transcript: 'I was flying over the sea',
      title: 'The sea dream',
      tags: ['ocean', 'flying'],
      symbol: 'ocean',
      symbols: ['ocean'],
      query: 'ocean',
      searchQuery: 'ocean',
      mood: 'positive',
      note: 'private',
      medications: 'sertraline',
      healthNotes: 'poor sleep',
      // allowed, for contrast
      entry_mode: 'voice',
      dream_index: 3,
    };

    const clean = sanitizeProps('product.dream_saved', dirty);
    const serialized = JSON.stringify(clean);

    expect(serialized).not.toMatch(/flying over the sea/);
    expect(serialized).not.toMatch(/ocean/);
    expect(serialized).not.toMatch(/sertraline/);
    expect(serialized).not.toMatch(/poor sleep/);
    expect(serialized).not.toMatch(/positive/);
    expect(serialized).not.toMatch(/The sea dream/);
  });

  it('keeps only the keys the event declares', () => {
    const clean = sanitizeProps('product.dream_saved', {
      entry_mode: 'voice',
      dream_index: 3,
      has_audio: true,
      smuggled: 'nope',
    });

    expect(clean).toEqual({
      entry_mode: 'voice',
      dream_index: 3,
      has_audio: true,
    });
  });

  it('drops non-primitive values even when the key is allowed', () => {
    const clean = sanitizeProps('product.dream_saved', {
      dream_index: { nested: 'object' },
    });

    expect(clean).toEqual({});
  });

  it('returns an empty object for an event with no declared props', () => {
    expect(sanitizeProps('product.app_opened', { anything: 'at all' })).toEqual(
      {},
    );
  });

  it('drops props for an event name it does not know', () => {
    expect(sanitizeProps('product.not_a_real_event', { a: 1 })).toEqual({});
  });
});
```

- [ ] **Step 7: Run it to see it fail**

Run: `npx jest __tests__/analyticsContentGuard.test.ts`
Expected: FAIL — `Cannot find module '../src/services/analytics/analyticsEvent'`.

- [ ] **Step 8: Implement the event shape and the guard**

Create `src/services/analytics/analyticsEvent.ts`:

```ts
export type AnalyticsPropValue = string | number | boolean;

export type AnalyticsEvent = {
  event: string;
  props: Record<string, AnalyticsPropValue>;
  clientTs: number;
  installId: string;
  sessionId: string;
};

/**
 * An allowlist, not a denylist.
 *
 * `sentryRedaction.ts` guards the crash path with a denylist, and its reasoning
 * holds there: the context type already restricts values to primitives, so what
 * it guards against is a caller putting dream text into one of them, and a
 * missed key is seen by one vendor's error viewer.
 *
 * This pipe fails differently. A key nobody thought about is written to a
 * database row and read back in aggregate for months. So each event declares
 * what it may carry, and anything undeclared is dropped — a property nobody
 * considered is absent rather than present.
 */
const ALLOWED_PROPS: Record<string, readonly string[]> = {
  'product.app_opened': [],
  'product.onboarding_opened': [],
  'product.onboarding_completed': ['path'],
  'product.capture_started': [
    'capture_id',
    'entry_mode',
    'auto_started_recording',
    'source',
  ],
  'product.draft_resumed': ['resume_mode', 'has_audio', 'has_text', 'source'],
  'product.dream_saved': [
    'capture_id',
    'mode',
    'entry_mode',
    'has_audio',
    'has_text',
    'dream_index',
  ],
  'product.dream_detail_opened': ['dream_age_days', 'source'],
  'product.memory_opened': ['dream_count'],
  'product.pattern_opened': ['kind'],
  'product.pattern_confirmed': ['kind', 'action'],
  'product.search_used': ['surface', 'query_length', 'result_count'],
  'product.filters_applied': ['surface', 'filter_count'],
  'product.reminder_toggled': ['enabled'],
  'product.biometric_lock_toggled': ['enabled'],
  'product.backup_enabled': ['kind'],
  'product.backup_export_started': ['kind'],
  'product.backup_export_completed': ['kind', 'dream_count'],
  'product.restore_started': ['mode'],
  'product.restore_completed': ['mode', 'dream_count'],
  'product.practice_hub_opened': ['entry_source'],
  'product.lucid_practice_started': ['technique'],
  'product.reality_check_completed': [],
  'product.wbtb_alarm_used': [],
  'product.nightmare_rescripting_started': [],
  'product.nightmare_rescripting_completed': [],
  'product.grounding_opened': ['entry_source'],
  'product.dream_sign_saved': [],
};

function isPrimitive(value: unknown): value is AnalyticsPropValue {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

export function sanitizeProps(
  event: string,
  props: Record<string, unknown>,
): Record<string, AnalyticsPropValue> {
  const allowed = ALLOWED_PROPS[event];
  if (!allowed) {
    return {};
  }

  const clean: Record<string, AnalyticsPropValue> = {};
  for (const key of allowed) {
    const value = props[key];
    if (isPrimitive(value)) {
      clean[key] = value;
    }
  }

  return clean;
}

export function isKnownAnalyticsEvent(event: string) {
  return Object.prototype.hasOwnProperty.call(ALLOWED_PROPS, event);
}

export function listKnownAnalyticsEvents(): string[] {
  return Object.keys(ALLOWED_PROPS);
}
```

- [ ] **Step 9: Run the guard test to see it pass**

Run: `npx jest __tests__/analyticsContentGuard.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 10: Write the failing queue test**

Create `__tests__/analyticsQueue.test.ts`:

```ts
import { kv } from '../src/services/storage/mmkv';
import { ANALYTICS_QUEUE_KEY } from '../src/services/storage/keys';
import {
  ANALYTICS_QUEUE_CAPACITY,
  dropBatch,
  enqueue,
  peekBatch,
  queueSize,
} from '../src/services/analytics/analyticsQueue';
import type { AnalyticsEvent } from '../src/services/analytics/analyticsEvent';

function makeEvent(n: number): AnalyticsEvent {
  return {
    event: 'product.app_opened',
    props: {},
    clientTs: n,
    installId: 'install',
    sessionId: 'session',
  };
}

describe('analytics queue', () => {
  beforeEach(() => {
    kv.remove(ANALYTICS_QUEUE_KEY);
  });

  it('starts empty', () => {
    expect(queueSize()).toBe(0);
  });

  it('appends and reads back in order', () => {
    enqueue(makeEvent(1));
    enqueue(makeEvent(2));

    expect(peekBatch(10).map(e => e.clientTs)).toEqual([1, 2]);
  });

  it('survives a reload, because it lives in storage', () => {
    enqueue(makeEvent(1));

    expect(JSON.parse(kv.getString(ANALYTICS_QUEUE_KEY) ?? '[]')).toHaveLength(
      1,
    );
  });

  it('drops the oldest on overflow, keeping what the person is doing now', () => {
    for (let i = 0; i < ANALYTICS_QUEUE_CAPACITY + 5; i += 1) {
      enqueue(makeEvent(i));
    }

    const all = peekBatch(ANALYTICS_QUEUE_CAPACITY);
    expect(queueSize()).toBe(ANALYTICS_QUEUE_CAPACITY);
    expect(all[0].clientTs).toBe(5);
  });

  it('dropBatch removes exactly the events that were sent', () => {
    enqueue(makeEvent(1));
    enqueue(makeEvent(2));
    enqueue(makeEvent(3));

    dropBatch(2);

    expect(peekBatch(10).map(e => e.clientTs)).toEqual([3]);
  });

  it('tolerates a corrupted queue rather than throwing', () => {
    kv.set(ANALYTICS_QUEUE_KEY, 'not json at all');

    expect(() => enqueue(makeEvent(1))).not.toThrow();
    expect(peekBatch(10).map(e => e.clientTs)).toEqual([1]);
  });
});
```

- [ ] **Step 11: Run it to see it fail**

Run: `npx jest __tests__/analyticsQueue.test.ts`
Expected: FAIL — `Cannot find module '../src/services/analytics/analyticsQueue'`.

- [ ] **Step 12: Implement the queue**

Create `src/services/analytics/analyticsQueue.ts`:

```ts
import { ANALYTICS_QUEUE_KEY } from '../storage/keys';
import { kv } from '../storage/mmkv';
import type { AnalyticsEvent } from './analyticsEvent';

/**
 * A week offline should cost the oldest events, not the newest: the recent
 * ones describe what the person is doing now, which is what the funnel is
 * about.
 */
export const ANALYTICS_QUEUE_CAPACITY = 500;

function readQueue(): AnalyticsEvent[] {
  const raw = kv.getString(ANALYTICS_QUEUE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AnalyticsEvent[]) : [];
  } catch {
    // A corrupted queue is analytics data, not user data. Losing it silently
    // is strictly better than surfacing an error about it.
    return [];
  }
}

function writeQueue(events: AnalyticsEvent[]) {
  kv.set(ANALYTICS_QUEUE_KEY, JSON.stringify(events));
}

export function enqueue(event: AnalyticsEvent) {
  const events = readQueue();
  events.push(event);

  writeQueue(
    events.length > ANALYTICS_QUEUE_CAPACITY
      ? events.slice(events.length - ANALYTICS_QUEUE_CAPACITY)
      : events,
  );
}

export function peekBatch(limit: number): AnalyticsEvent[] {
  return readQueue().slice(0, limit);
}

export function dropBatch(count: number) {
  writeQueue(readQueue().slice(count));
}

export function queueSize(): number {
  return readQueue().length;
}

export function clearQueue() {
  kv.remove(ANALYTICS_QUEUE_KEY);
}
```

- [ ] **Step 13: Run the queue test to see it pass**

Run: `npx jest __tests__/analyticsQueue.test.ts`
Expected: PASS — 6 tests.

- [ ] **Step 14: Typecheck, lint, full suite**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint src/services/analytics/ src/services/storage/keys.ts __tests__/analyticsIdentity.test.ts __tests__/analyticsQueue.test.ts __tests__/analyticsContentGuard.test.ts`
Expected: no errors.

Run: `npx jest`
Expected: PASS, with three more suites than before this task.

- [ ] **Step 15: Commit**

```bash
git add src/services/analytics/ src/services/storage/keys.ts \
  __tests__/analyticsIdentity.test.ts __tests__/analyticsQueue.test.ts \
  __tests__/analyticsContentGuard.test.ts
git commit -m "feat: add analytics identity, guarded event shape, and durable queue"
```

---

### Task 3: One typed registry, two namespaces, and the seven missing events

**Files:**
- Modify: `src/services/observability/events.ts`
- Modify: `src/features/onboarding/screens/OnboardingScreen.tsx`
- Modify: `src/features/dreams/screens/DreamDetailScreen.tsx`
- Modify: `src/features/stats/screens/StatsScreen.tsx`
- Modify: `src/features/stats/screens/PatternDetailScreen.tsx`
- Modify: `src/features/settings/hooks/useCloudBackupController.ts`
- Modify: `src/features/dreams/components/useDreamComposerForm.ts`
- Test: `__tests__/analyticsTaxonomy.test.ts`

**Interfaces:**
- Consumes: `listKnownAnalyticsEvents()` and `isKnownAnalyticsEvent()` from Task 2.
- Produces: `trackOnboardingOpened()`, `trackOnboardingCompleted({path})`,
  `trackDreamDetailOpened({dreamAgeDays, source})`, `trackMemoryOpened({dreamCount})`,
  `trackPatternOpened({kind})`, `trackPatternConfirmed({kind, action})`,
  `trackBackupEnabled({kind})`; `trackCaptureStarted` and `trackDreamSaved` gain
  `captureId`, and `trackDreamSaved` gains `dreamIndex`.

**Reviewer note:** the codebase currently has two event surfaces — 21 typed
entries in `OBS_EVENTS` and 17 raw string literals passed directly to
`observability.trackEvent()` from services (`storage_diagnostics_read`,
`archive_health_scanned`, `local_data_transaction_*`, `audio_cleanup_maintenance`,
`storage_migration_result` and others). The raw ones are all infrastructure
telemetry. This task moves them under a `diag.` prefix so that every §9 query
can filter on `product.` and be right by construction rather than by the author
remembering to exclude them.

- [ ] **Step 1: Write the failing taxonomy test**

Create `__tests__/analyticsTaxonomy.test.ts`:

```ts
import {
  OBS_EVENTS,
  PRODUCT_EVENTS,
} from '../src/services/observability/events';
import {
  isKnownAnalyticsEvent,
  listKnownAnalyticsEvents,
} from '../src/services/analytics/analyticsEvent';

describe('analytics taxonomy', () => {
  it('namespaces every event as product or diag', () => {
    for (const name of Object.values(OBS_EVENTS)) {
      expect(name).toMatch(/^(product|diag)\./);
    }
  });

  it('declares every product event in the content guard', () => {
    for (const name of Object.values(PRODUCT_EVENTS)) {
      expect([name, isKnownAnalyticsEvent(name)]).toEqual([name, true]);
    }
  });

  it('declares no guard entry that the registry does not emit', () => {
    const registry = new Set<string>(Object.values(OBS_EVENTS));

    for (const name of listKnownAnalyticsEvents()) {
      expect([name, registry.has(name)]).toEqual([name, true]);
    }
  });

  it('covers the funnel steps §9 names', () => {
    const required = [
      'product.onboarding_opened',
      'product.onboarding_completed',
      'product.capture_started',
      'product.dream_saved',
      'product.dream_detail_opened',
      'product.memory_opened',
      'product.pattern_opened',
      'product.pattern_confirmed',
      'product.backup_enabled',
    ];

    for (const name of required) {
      expect([name, isKnownAnalyticsEvent(name)]).toEqual([name, true]);
    }
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx jest __tests__/analyticsTaxonomy.test.ts`
Expected: FAIL — `PRODUCT_EVENTS` is not exported, and the existing event names
have no namespace prefix.

- [ ] **Step 3: Restructure the registry**

In `src/services/observability/events.ts`, replace the existing `OBS_EVENTS`
declaration with two namespaced maps plus a merged one for compatibility:

```ts
export const PRODUCT_EVENTS = {
  AppOpened: 'product.app_opened',
  OnboardingOpened: 'product.onboarding_opened',
  OnboardingCompleted: 'product.onboarding_completed',
  CaptureStarted: 'product.capture_started',
  DraftResumed: 'product.draft_resumed',
  DreamSaved: 'product.dream_saved',
  DreamDetailOpened: 'product.dream_detail_opened',
  MemoryOpened: 'product.memory_opened',
  PatternOpened: 'product.pattern_opened',
  PatternConfirmed: 'product.pattern_confirmed',
  SearchUsed: 'product.search_used',
  FiltersApplied: 'product.filters_applied',
  ReminderToggled: 'product.reminder_toggled',
  BiometricLockToggled: 'product.biometric_lock_toggled',
  BackupEnabled: 'product.backup_enabled',
  BackupExportStarted: 'product.backup_export_started',
  BackupExportCompleted: 'product.backup_export_completed',
  RestoreStarted: 'product.restore_started',
  RestoreCompleted: 'product.restore_completed',
  PracticeHubOpened: 'product.practice_hub_opened',
  LucidPracticeStarted: 'product.lucid_practice_started',
  RealityCheckCompleted: 'product.reality_check_completed',
  WbtbAlarmUsed: 'product.wbtb_alarm_used',
  NightmareRescriptingStarted: 'product.nightmare_rescripting_started',
  NightmareRescriptingCompleted: 'product.nightmare_rescripting_completed',
  GroundingOpened: 'product.grounding_opened',
  DreamSignSaved: 'product.dream_sign_saved',
} as const;

/**
 * What the app did to itself, as opposed to what a person did. Kept apart from
 * PRODUCT_EVENTS because every §9 query filters to one or the other, and a
 * shared namespace makes those queries wrong by default rather than by
 * accident.
 */
export const DIAG_EVENTS = {
  GlobalJsError: 'diag.global_js_error',
  DreamImportPreflightCompleted: 'diag.dream_import_preflight_completed',
  DreamImportTransactionCompleted: 'diag.dream_import_transaction_completed',
  LocalDataTransactionStarted: 'diag.local_data_transaction_started',
  LocalDataTransactionCompleted: 'diag.local_data_transaction_completed',
  LocalDataTransactionFailed: 'diag.local_data_transaction_failed',
  LocalDataTransactionRecovery: 'diag.local_data_transaction_recovery',
  StorageDiagnosticsRead: 'diag.storage_diagnostics_read',
  StorageAudioCleanupRequested: 'diag.storage_audio_cleanup_requested',
  StorageExportsDeleted: 'diag.storage_exports_deleted',
  StorageTranscriptionModelDeleted: 'diag.storage_transcription_model_deleted',
  StorageMigrationResult: 'diag.storage_migration_result',
  ArchiveHealthScanned: 'diag.archive_health_scanned',
  ArchiveHealthRepaired: 'diag.archive_health_repaired',
  ArchiveHealthMaintenance: 'diag.archive_health_maintenance',
  AudioCleanupMaintenance: 'diag.audio_cleanup_maintenance',
} as const;

export const OBS_EVENTS = {
  ...PRODUCT_EVENTS,
  ...DIAG_EVENTS,
} as const;
```

Then update the 17 raw-string call sites to use `DIAG_EVENTS` members instead of
literals. The files and the literal each one passes are:

- `src/features/settings/services/transactionalDreamImportService.ts` —
  `'dream_import_preflight_completed'`, `'dream_import_transaction_completed'`
- `src/features/settings/services/localDataTransactionService.ts` —
  `'local_data_transaction_failed'`, `'local_data_transaction_started'`,
  `'local_data_transaction_completed'`
- `src/features/settings/services/localDataTransactionJournalService.ts` —
  `'local_data_transaction_recovery'`
- `src/features/settings/services/storageDiagnosticsService.ts` —
  `'storage_diagnostics_read'`, `'storage_audio_cleanup_requested'` (twice),
  `'storage_exports_deleted'`, `'storage_transcription_model_deleted'`
- `src/features/settings/services/archiveHealthService.ts` —
  `'archive_health_scanned'`, `'archive_health_repaired'`
- `src/features/settings/services/archiveHealthMaintenanceService.ts` —
  `'archive_health_maintenance'`
- `src/features/dreams/services/audioCleanupMaintenanceService.ts` —
  `'audio_cleanup_maintenance'`
- `src/services/storage/storageMigrationService.ts` —
  `'storage_migration_result'`

Each becomes `observability.trackEvent(DIAG_EVENTS.<Member>, { ... })` with the
existing properties unchanged, importing `DIAG_EVENTS` from
`'../../../services/observability/events'` (adjust the relative depth per file).

- [ ] **Step 4: Add the seven missing track functions**

In the same file, after the existing `trackReminderToggled`, add:

```ts
export function trackOnboardingOpened() {
  trackEvent(PRODUCT_EVENTS.OnboardingOpened);
}

export function trackOnboardingCompleted(input: {
  path: 'voice' | 'text' | 'no-dream';
}) {
  trackEvent(PRODUCT_EVENTS.OnboardingCompleted, { path: input.path });
}

export function trackDreamDetailOpened(input: {
  dreamAgeDays: number;
  source: 'home' | 'archive' | 'stats' | 'search' | 'other';
}) {
  trackEvent(PRODUCT_EVENTS.DreamDetailOpened, {
    dream_age_days: input.dreamAgeDays,
    source: input.source,
  });
}

export function trackMemoryOpened(input: { dreamCount: number }) {
  trackEvent(PRODUCT_EVENTS.MemoryOpened, { dream_count: input.dreamCount });
}

export function trackPatternOpened(input: { kind: string }) {
  trackEvent(PRODUCT_EVENTS.PatternOpened, { kind: input.kind });
}

export function trackPatternConfirmed(input: {
  kind: string;
  action: 'confirm' | 'reject';
}) {
  trackEvent(PRODUCT_EVENTS.PatternConfirmed, {
    kind: input.kind,
    action: input.action,
  });
}

export function trackBackupEnabled(input: { kind: 'local' | 'cloud' }) {
  trackEvent(PRODUCT_EVENTS.BackupEnabled, { kind: input.kind });
}
```

- [ ] **Step 5: Give capture and save a shared id, and save a counter**

Change the two existing signatures in the same file:

```ts
export function trackCaptureStarted(input: {
  captureId: string;
  entryMode: CaptureEntryMode;
  autoStartedRecording: boolean;
  source?: CaptureSource;
}) {
  trackEvent(PRODUCT_EVENTS.CaptureStarted, {
    capture_id: input.captureId,
    entry_mode: input.entryMode,
    auto_started_recording: input.autoStartedRecording,
    source: input.source,
  });
}

export function trackDreamSaved(input: {
  captureId: string;
  mode: DreamSaveMode;
  entryMode: CaptureEntryMode;
  hasAudio: boolean;
  hasText: boolean;
  dreamIndex: number;
}) {
  trackEvent(PRODUCT_EVENTS.DreamSaved, {
    capture_id: input.captureId,
    mode: input.mode,
    entry_mode: input.entryMode,
    has_audio: input.hasAudio,
    has_text: input.hasText,
    dream_index: input.dreamIndex,
  });
}
```

In `src/features/dreams/components/useDreamComposerForm.ts`, the composer
already holds a stable per-composition id in `composingDreamIdRef` (line ~600,
introduced precisely so the id survives across a save). Pass that same value as
`captureId` at both call sites. For `dreamIndex`, read the existing dream count
from `getDreamsMeta()` in `dreamsRepository.ts` and pass `totalCount + 1` on a
create, and the dream's existing position on an edit — no dream content is read
or sent, only a count.

- [ ] **Step 6: Emit the new events at their call sites**

- `OnboardingScreen.tsx` — `trackOnboardingOpened()` on mount;
  `trackOnboardingCompleted({ path })` in each of the three capture buttons,
  with `path` set to `'voice'`, `'text'` or `'no-dream'`.
- `DreamDetailScreen.tsx` — `trackDreamDetailOpened(...)` on mount.
  `dreamAgeDays` is `Math.floor((Date.now() - dream.createdAt) / 86400000)`,
  which is what makes "first *old* dream reopened" answerable rather than just
  "a detail was opened".
- `StatsScreen.tsx` — `trackMemoryOpened({ dreamCount })` on focus.
- `PatternDetailScreen.tsx` — `trackPatternOpened({ kind })` on mount, and
  `trackPatternConfirmed({ kind, action })` wherever a pattern is confirmed or
  rejected.
- `useCloudBackupController.ts` — `trackBackupEnabled({ kind: 'cloud' })` when
  cloud sync is switched on, distinct from the existing export events.

- [ ] **Step 7: Run the taxonomy test to see it pass**

Run: `npx jest __tests__/analyticsTaxonomy.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 8: Typecheck, lint, full suite**

Run: `npx tsc --noEmit`
Expected: no errors. The changed `trackCaptureStarted`/`trackDreamSaved`
signatures will surface every call site that has not been updated — treat each
as a real edit, not a cast to silence.

Run: `npx eslint` on every file changed in this task.
Expected: no errors.

Run: `npx jest`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: unify event taxonomy under product/diag and add the funnel's missing events"
```

---

### Task 4: Transport, flush lifecycle, and opt-out

**Files:**
- Create: `src/services/analytics/analyticsTransport.ts`
- Create: `src/services/analytics/supabaseAnalyticsTransport.ts`
- Create: `src/services/analytics/index.ts`
- Modify: `src/services/observability/events.ts` (route `trackEvent` into the queue)
- Modify: `src/app/AppProvider.tsx` (register transport, flush lifecycle, session)
- Modify: `src/features/settings/screens/PrivacyScreen.tsx` (opt-out row)
- Modify: `src/constants/copy/settings.ts` (opt-out copy, both locales)
- Test: `__tests__/analyticsFlush.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 2 and 3, plus `getSupabaseClient()` from
  `src/services/api/supabase/client.ts`.
- Produces: `setAnalyticsTransport(t: AnalyticsTransport | null)`,
  `flushAnalytics(): Promise<void>`, `isAnalyticsOptedOut()`,
  `setAnalyticsOptedOut(next: boolean)`.

- [ ] **Step 1: Write the failing flush test**

Create `__tests__/analyticsFlush.test.ts`:

```ts
import { kv } from '../src/services/storage/mmkv';
import {
  ANALYTICS_OPTED_OUT_KEY,
  ANALYTICS_QUEUE_KEY,
} from '../src/services/storage/keys';
import {
  flushAnalytics,
  setAnalyticsTransport,
  setAnalyticsOptedOut,
  recordAnalyticsEvent,
} from '../src/services/analytics';
import { queueSize } from '../src/services/analytics/analyticsQueue';

describe('analytics flush', () => {
  beforeEach(() => {
    kv.remove(ANALYTICS_QUEUE_KEY);
    kv.remove(ANALYTICS_OPTED_OUT_KEY);
    setAnalyticsTransport(null);
  });

  it('drops a batch the transport accepted', async () => {
    setAnalyticsTransport({ send: async () => true });
    recordAnalyticsEvent('product.app_opened', {});

    await flushAnalytics();

    expect(queueSize()).toBe(0);
  });

  it('keeps a batch the transport rejected, so nothing is lost offline', async () => {
    setAnalyticsTransport({ send: async () => false });
    recordAnalyticsEvent('product.app_opened', {});

    await flushAnalytics();

    expect(queueSize()).toBe(1);
  });

  it('keeps the batch when the transport throws', async () => {
    setAnalyticsTransport({
      send: async () => {
        throw new Error('offline');
      },
    });
    recordAnalyticsEvent('product.app_opened', {});

    await expect(flushAnalytics()).resolves.toBeUndefined();
    expect(queueSize()).toBe(1);
  });

  it('records nothing at all once opted out', () => {
    setAnalyticsOptedOut(true);
    recordAnalyticsEvent('product.app_opened', {});

    expect(queueSize()).toBe(0);
  });

  it('never throws from the record path, whatever it is handed', () => {
    expect(() =>
      recordAnalyticsEvent('product.not_a_real_event', { a: 1 }),
    ).not.toThrow();
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx jest __tests__/analyticsFlush.test.ts`
Expected: FAIL — `Cannot find module '../src/services/analytics'`.

- [ ] **Step 3: Define the transport interface**

Create `src/services/analytics/analyticsTransport.ts`:

```ts
import type { AnalyticsEvent } from './analyticsEvent';

export type AnalyticsTransport = {
  /**
   * Resolves true when the batch was durably accepted and may be dropped
   * locally. Anything else — false or a rejection — leaves the batch queued.
   */
  send(batch: AnalyticsEvent[]): Promise<boolean>;
};
```

- [ ] **Step 4: Implement the Supabase transport**

Create `src/services/analytics/supabaseAnalyticsTransport.ts`:

```ts
import { Platform } from 'react-native';
import { APP_VERSION } from '../../config/app';
import { getSupabaseClient } from '../api/supabase/client';
import type { AnalyticsEvent } from './analyticsEvent';
import type { AnalyticsTransport } from './analyticsTransport';

/**
 * Writes to a table nobody can read back through the API. The publishable key
 * this uses is bundled in the binary, so the table's protection is that it has
 * no select policy for any role — see the migration for the full reasoning.
 */
export function createSupabaseAnalyticsTransport(
  locale: string,
): AnalyticsTransport {
  return {
    async send(batch: AnalyticsEvent[]) {
      const client = getSupabaseClient();
      if (!client || !batch.length) {
        return false;
      }

      const rows = batch.map(event => ({
        install_id: event.installId,
        session_id: event.sessionId,
        event: event.event,
        props: event.props,
        client_ts: new Date(event.clientTs).toISOString(),
        app_version: APP_VERSION,
        platform: Platform.OS,
        locale,
      }));

      const { error } = await client.from('analytics_events').insert(rows);
      return !error;
    },
  };
}
```

- [ ] **Step 5: Implement the façade**

Create `src/services/analytics/index.ts`:

```ts
import {
  ANALYTICS_OPTED_OUT_KEY,
} from '../storage/keys';
import { kv } from '../storage/mmkv';
import { sanitizeProps, isKnownAnalyticsEvent } from './analyticsEvent';
import { getInstallId, getSessionId } from './analyticsIdentity';
import { dropBatch, enqueue, peekBatch, queueSize } from './analyticsQueue';
import type { AnalyticsTransport } from './analyticsTransport';

const FLUSH_BATCH_SIZE = 50;

let transport: AnalyticsTransport | null = null;
let flushInFlight = false;

export function setAnalyticsTransport(next: AnalyticsTransport | null) {
  transport = next;
}

export function isAnalyticsOptedOut() {
  return kv.getBoolean(ANALYTICS_OPTED_OUT_KEY) === true;
}

export function setAnalyticsOptedOut(next: boolean) {
  kv.set(ANALYTICS_OPTED_OUT_KEY, next);
}

/**
 * Never throws and never awaits at the call site. An analytics failure must be
 * invisible to the person using the app.
 */
export function recordAnalyticsEvent(
  event: string,
  props: Record<string, unknown>,
) {
  try {
    if (isAnalyticsOptedOut() || !isKnownAnalyticsEvent(event)) {
      return;
    }

    enqueue({
      event,
      props: sanitizeProps(event, props),
      clientTs: Date.now(),
      installId: getInstallId(),
      sessionId: getSessionId(),
    });

    if (queueSize() >= FLUSH_BATCH_SIZE) {
      void flushAnalytics();
    }
  } catch {
    // Analytics must never be the reason a capture fails.
  }
}

export async function flushAnalytics(): Promise<void> {
  if (flushInFlight || !transport || isAnalyticsOptedOut()) {
    return;
  }

  flushInFlight = true;
  try {
    const batch = peekBatch(FLUSH_BATCH_SIZE);
    if (!batch.length) {
      return;
    }

    const accepted = await transport.send(batch);
    if (accepted) {
      dropBatch(batch.length);
    }
  } catch {
    // Keep the batch. The next flush retries it.
  } finally {
    flushInFlight = false;
  }
}

export { getInstallId, getSessionId, noteAppForegrounded } from './analyticsIdentity';
export type { AnalyticsTransport } from './analyticsTransport';
```

- [ ] **Step 6: Route `trackEvent` into the queue**

In `src/services/observability/events.ts`, the private `trackEvent` helper
currently forwards only to `observability`. Change it to also record into the
analytics pipe, leaving the Sentry breadcrumb path untouched so crash context
keeps working:

```ts
function trackEvent(name: string, context?: ObservabilityContext) {
  const sanitized = sanitizeContext(context);
  observability.trackEvent(name, sanitized);
  recordAnalyticsEvent(name, sanitized ?? {});
}
```

Import `recordAnalyticsEvent` from `'../analytics'`. Events under `diag.` are
dropped by `recordAnalyticsEvent` because they are not in the guard's allowlist,
which is the intended behaviour: diagnostics stay in Sentry, product events go
to the analytics table.

- [ ] **Step 7: Wire the lifecycle**

In `src/app/AppProvider.tsx`, next to the existing
`observability.trackEvent(OBS_EVENTS.AppOpened)` call and the
`setObservabilityProvider(sentry)` registration:

```tsx
React.useEffect(() => {
  setAnalyticsTransport(createSupabaseAnalyticsTransport(locale));
  void flushAnalytics();

  const subscription = AppState.addEventListener('change', nextState => {
    if (nextState === 'active') {
      noteAppForegrounded();
      void flushAnalytics();
      return;
    }

    if (nextState === 'background') {
      void flushAnalytics();
    }
  });

  return () => subscription.remove();
}, [locale]);
```

- [ ] **Step 8: Add the opt-out row and its copy**

Add to `SETTINGS_COPY_EN`:

```ts
analyticsTitle: 'Usage analytics',
analyticsDescription:
  'Anonymous counts of which screens and actions are used, so the app can be improved. Never your dreams, transcripts, titles, tags or searches — those stay on this device.',
analyticsEnabledValue: 'On',
analyticsDisabledValue: 'Off',
```

and the Ukrainian equivalents to `SETTINGS_COPY_UK` (`DREAM_COPY_UK`-style
parity is enforced by `typeof`, so `tsc` fails if either block is missed).

Render a `Switch` row on `PrivacyScreen.tsx` bound to `isAnalyticsOptedOut()` /
`setAnalyticsOptedOut()`. `PrivacyScreen` is the right home rather than
`SettingsAbout`: it is where the app already explains what it does with data.

- [ ] **Step 9: Run the flush test to see it pass**

Run: `npx jest __tests__/analyticsFlush.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 10: Typecheck, lint, full suite**

Run: `npx tsc --noEmit`, `npx eslint` on changed files, `npx jest`.
Expected: all clean.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: send product analytics to Supabase behind a pluggable transport"
```

- [ ] **Step 12: Report what still needs a device**

The final verification is not automatable from here and must be handed to the
owner as the plan's closing note:

1. Install a build, complete onboarding, save a dream, background the app.
2. Confirm rows appear in `analytics_events`, and that `props` contains no dream
   content on any of them.
3. From a client holding only the bundled publishable key, attempt
   `select * from analytics_events limit 1` and confirm refusal.
