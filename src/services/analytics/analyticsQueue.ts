import { ANALYTICS_QUEUE_KEY } from '../storage/keys';
import { kv } from '../storage/mmkv';
import type { AnalyticsEvent } from './analyticsEvent';

/**
 * A week offline should cost the oldest events, not the newest: the recent ones
 * describe what the person is doing now, which is what the funnel is about.
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
    // A corrupted queue is analytics data, not user data. Dropping it silently
    // is strictly better than surfacing an error about it to someone who was
    // trying to write down a dream.
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
