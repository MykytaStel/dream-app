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
    id: `id-${n}`,
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

    expect(peekBatch(10).map(event => event.clientTs)).toEqual([1, 2]);
  });

  it('lives in storage, so it survives the process dying', () => {
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
    // The first five are gone, not the last five.
    expect(all[0].clientTs).toBe(5);
    expect(all[all.length - 1].clientTs).toBe(ANALYTICS_QUEUE_CAPACITY + 4);
  });

  it('drops exactly the events that were sent', () => {
    enqueue(makeEvent(1));
    enqueue(makeEvent(2));
    enqueue(makeEvent(3));

    dropBatch(2);

    expect(peekBatch(10).map(event => event.clientTs)).toEqual([3]);
  });

  it('peekBatch does not remove anything', () => {
    enqueue(makeEvent(1));

    peekBatch(10);

    expect(queueSize()).toBe(1);
  });

  it('tolerates a corrupted queue rather than throwing', () => {
    kv.set(ANALYTICS_QUEUE_KEY, 'not json at all');

    expect(() => enqueue(makeEvent(1))).not.toThrow();
    expect(peekBatch(10).map(event => event.clientTs)).toEqual([1]);
  });
});
