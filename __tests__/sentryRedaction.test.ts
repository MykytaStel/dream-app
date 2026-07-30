import type { ErrorEvent } from '@sentry/core';
import { redactSentryEvent } from '../src/services/observability/sentryRedaction';

const DREAM_TEXT = 'I was falling through a glass ocean and could not wake up';

function serialize(event: ErrorEvent): string {
  return JSON.stringify(event);
}

describe('redactSentryEvent', () => {
  test('removes dream text from extra', () => {
    const event = {
      extra: { text: DREAM_TEXT, dreamId: 'dream-1' },
    } as unknown as ErrorEvent;

    const result = redactSentryEvent(event);

    expect(serialize(result)).not.toContain(DREAM_TEXT);
    expect(result.extra?.dreamId).toBe('dream-1');
  });

  test('removes title, transcript and tags', () => {
    const event = {
      extra: {
        title: 'The glass ocean',
        transcript: DREAM_TEXT,
        tags: 'water,falling',
      },
    } as unknown as ErrorEvent;

    const result = redactSentryEvent(event);
    const payload = serialize(result);

    expect(payload).not.toContain('The glass ocean');
    expect(payload).not.toContain(DREAM_TEXT);
    expect(payload).not.toContain('water,falling');
  });

  test('redacts nested content', () => {
    const event = {
      extra: { dream: { title: 'Nested', text: DREAM_TEXT } },
    } as unknown as ErrorEvent;

    expect(serialize(redactSentryEvent(event))).not.toContain(DREAM_TEXT);
  });

  test('drops user identity and request data entirely', () => {
    const event = {
      user: { id: 'user-1', email: 'dreamer@example.com' },
      request: { url: 'https://example.com/dreams/1', data: DREAM_TEXT },
    } as unknown as ErrorEvent;

    const result = redactSentryEvent(event);

    expect(result.user).toBeUndefined();
    expect(result.request).toBeUndefined();
    expect(serialize(result)).not.toContain('dreamer@example.com');
  });

  test('redacts breadcrumb data', () => {
    const event = {
      breadcrumbs: [
        { category: 'app', message: 'dream_saved', data: { text: DREAM_TEXT } },
      ],
    } as unknown as ErrorEvent;

    expect(serialize(redactSentryEvent(event))).not.toContain(DREAM_TEXT);
  });

  test('handles snake_case and camelCase spellings alike', () => {
    const event = {
      extra: {
        audio_storage_path: '/dreams/audio/1.m4a',
        dreamTitle: 'The glass ocean',
        rewrittenEnding: DREAM_TEXT,
      },
    } as unknown as ErrorEvent;

    const payload = serialize(redactSentryEvent(event));

    expect(payload).not.toContain('/dreams/audio/1.m4a');
    expect(payload).not.toContain('The glass ocean');
    expect(payload).not.toContain(DREAM_TEXT);
  });

  test('keeps the technical fields that make a crash debuggable', () => {
    const event = {
      exception: {
        values: [{ type: 'TypeError', value: 'x is not a function' }],
      },
      extra: { event: 'widget_snapshot_sync_failed', screen: 'Archive' },
      tags: { platform: 'ios' },
    } as unknown as ErrorEvent;

    const result = redactSentryEvent(event);

    expect(result.exception?.values?.[0]?.type).toBe('TypeError');
    expect(result.extra?.event).toBe('widget_snapshot_sync_failed');
    expect(result.extra?.screen).toBe('Archive');
    expect(result.tags?.platform).toBe('ios');
  });
});
