import { ANALYTICS_OPTED_OUT_KEY } from '../storage/keys';
import { kv } from '../storage/mmkv';
import { isKnownAnalyticsEvent, sanitizeProps } from './analyticsEvent';
import { createUuid, getInstallId, getSessionId } from './analyticsIdentity';
import {
  clearQueue,
  dropBatch,
  enqueue,
  peekBatch,
  queueSize,
} from './analyticsQueue';
import type { AnalyticsTransport } from './analyticsTransport';

const FLUSH_BATCH_SIZE = 50;
const BACKOFF_BASE_MS = 5_000;
const BACKOFF_CEILING_MS = 60 * 60 * 1000;

let transport: AnalyticsTransport | null = null;
let flushInFlight = false;
/**
 * Guards against a batch the server will never accept.
 *
 * A single row that violates a database CHECK rejects the whole INSERT, so the
 * batch is kept and retried — and because recording enough events triggers a
 * flush, without a delay every subsequent user action would fire another
 * doomed 50-row request. The queue's overflow eventually evicts the poison
 * head, but the backoff is what stops the app hammering the network until it
 * does.
 */
let consecutiveFailures = 0;
let nextFlushAllowedAt = 0;

export function setAnalyticsTransport(next: AnalyticsTransport | null) {
  transport = next;
}

export function isAnalyticsOptedOut() {
  return kv.getBoolean(ANALYTICS_OPTED_OUT_KEY) === true;
}

export function setAnalyticsOptedOut(next: boolean) {
  kv.set(ANALYTICS_OPTED_OUT_KEY, next);

  if (next) {
    // Saying no has to apply to what was already captured, not only to what
    // happens next. Otherwise opting back in later would ship a backlog
    // gathered before the person agreed to any of it.
    clearQueue();
  }
}

/**
 * Never throws and never awaits at the call site.
 *
 * Analytics runs alongside someone writing down a dream they are about to
 * forget. Nothing in here is worth interrupting that, so every failure is
 * swallowed on purpose — including an unknown event name, which is dropped
 * rather than sent, because the database's own allowlist would reject the
 * whole batch it travelled in.
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
      id: createUuid(),
      event,
      props: sanitizeProps(event, props),
      clientTs: Date.now(),
      installId: getInstallId(),
      sessionId: getSessionId(),
    });

    if (queueSize() >= FLUSH_BATCH_SIZE) {
      flushAnalytics();
    }
  } catch {
    // Measurement must never be the reason a capture fails.
  }
}

export async function flushAnalytics(now = Date.now()): Promise<void> {
  if (
    flushInFlight ||
    !transport ||
    isAnalyticsOptedOut() ||
    now < nextFlushAllowedAt
  ) {
    return;
  }

  flushInFlight = true;
  try {
    const batch = peekBatch(FLUSH_BATCH_SIZE);
    if (!batch.length) {
      return;
    }

    if (await transport.send(batch)) {
      dropBatch(batch.length);
      consecutiveFailures = 0;
      nextFlushAllowedAt = 0;
      return;
    }

    noteFlushFailure(now);
  } catch {
    // Keep the batch. The next flush retries it, which is the whole reason
    // the queue is durable.
    noteFlushFailure(now);
  } finally {
    flushInFlight = false;
  }
}

function noteFlushFailure(now: number) {
  consecutiveFailures += 1;
  nextFlushAllowedAt =
    now +
    Math.min(
      BACKOFF_CEILING_MS,
      BACKOFF_BASE_MS * 2 ** (consecutiveFailures - 1),
    );
}

export function __resetFlushBackoffForTests() {
  consecutiveFailures = 0;
  nextFlushAllowedAt = 0;
}

export {
  getInstallId,
  getSessionId,
  noteAppBackgrounded,
  noteAppForegrounded,
} from './analyticsIdentity';
export { createSupabaseAnalyticsTransport } from './supabaseAnalyticsTransport';
export type { AnalyticsTransport } from './analyticsTransport';
