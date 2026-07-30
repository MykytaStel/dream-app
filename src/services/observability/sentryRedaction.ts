import type { ErrorEvent } from '@sentry/core';

/**
 * Pure redaction logic, deliberately kept free of any runtime Sentry import so
 * it can be tested without transpiling the SDK — and so the rule that protects
 * dream content is verifiable on its own.
 *
 * The `@sentry/core` import is type-only and erased at compile time.
 */

/**
 * Fields that may carry dream content. Sentry must never receive them, no
 * matter which layer produced the event.
 *
 * A denylist rather than an allowlist: the context type already restricts
 * values to primitives, so what we guard against is a caller putting dream
 * text into one of those primitives.
 */
const REDACTED_KEYS = [
  'text',
  'title',
  'transcript',
  'body',
  'content',
  'note',
  'notes',
  'tag',
  'tags',
  'audiouri',
  'audiopath',
  'audiostoragepath',
  'email',
  'displayname',
  'rewrittenending',
  'dreamtitle',
  'dreamtext',
];

const REDACTED = '[redacted]';

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[_-]/g, '');
}

function isRedactedKey(key: string): boolean {
  return REDACTED_KEYS.includes(normalizeKey(key));
}

function redactRecord(
  input: Record<string, unknown>,
  depth = 0,
): Record<string, unknown> {
  if (depth > 4) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => {
      if (isRedactedKey(key)) {
        return [key, REDACTED];
      }

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return [key, redactRecord(value as Record<string, unknown>, depth + 1)];
      }

      return [key, value];
    }),
  );
}

/**
 * Strips anything that could carry dream content before an event leaves the
 * device.
 */
export function redactSentryEvent(event: ErrorEvent): ErrorEvent {
  const redacted: ErrorEvent = { ...event };

  // A user identity is not needed to debug a crash.
  delete redacted.user;
  delete redacted.request;

  if (redacted.extra) {
    redacted.extra = redactRecord(redacted.extra);
  }

  if (redacted.contexts) {
    redacted.contexts = redactRecord(
      redacted.contexts,
    ) as ErrorEvent['contexts'];
  }

  if (redacted.tags) {
    redacted.tags = redactRecord(redacted.tags) as ErrorEvent['tags'];
  }

  if (redacted.breadcrumbs) {
    redacted.breadcrumbs = redacted.breadcrumbs.map(crumb => ({
      ...crumb,
      data: crumb.data ? redactRecord(crumb.data) : crumb.data,
    }));
  }

  return redacted;
}
