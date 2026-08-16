import { kv } from '../src/services/storage/mmkv';
import {
  ANALYTICS_OPTED_OUT_KEY,
  ANALYTICS_QUEUE_KEY,
} from '../src/services/storage/keys';
import {
  __resetFlushBackoffForTests,
  flushAnalytics,
  recordAnalyticsEvent,
  setAnalyticsOptedOut,
  setAnalyticsTransport,
} from '../src/services/analytics';
import { queueSize } from '../src/services/analytics/analyticsQueue';

describe('analytics flush', () => {
  beforeEach(() => {
    kv.remove(ANALYTICS_QUEUE_KEY);
    kv.remove(ANALYTICS_OPTED_OUT_KEY);
    setAnalyticsTransport(null);
    __resetFlushBackoffForTests();
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

  it('retries the kept batch on the next flush', async () => {
    let attempts = 0;
    setAnalyticsTransport({
      send: async () => {
        attempts += 1;
        return attempts > 1;
      },
    });
    recordAnalyticsEvent('product.app_opened', {});

    await flushAnalytics(0);
    expect(queueSize()).toBe(1);

    // Past the backoff window the first failure opened.
    await flushAnalytics(60_000);
    expect(queueSize()).toBe(0);
  });

  it('backs off after a failure instead of retrying immediately', async () => {
    const send = jest.fn(async () => false);
    setAnalyticsTransport({ send });
    recordAnalyticsEvent('product.app_opened', {});

    await flushAnalytics(0);
    expect(send).toHaveBeenCalledTimes(1);

    // A batch the server will never accept must not turn every later user
    // action into another doomed request.
    await flushAnalytics(1_000);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('widens the backoff window as failures repeat', async () => {
    const send = jest.fn(async () => false);
    setAnalyticsTransport({ send });
    recordAnalyticsEvent('product.app_opened', {});

    await flushAnalytics(0);
    await flushAnalytics(10_000);
    expect(send).toHaveBeenCalledTimes(2);

    // The second failure's window is longer than the first's.
    await flushAnalytics(15_000);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('clears the backoff once a batch is accepted', async () => {
    let attempts = 0;
    const send = jest.fn(async () => {
      attempts += 1;
      return attempts > 1;
    });
    setAnalyticsTransport({ send });
    recordAnalyticsEvent('product.app_opened', {});

    await flushAnalytics(0);
    await flushAnalytics(60_000);
    expect(queueSize()).toBe(0);

    recordAnalyticsEvent('product.app_opened', {});
    await flushAnalytics(60_001);

    expect(send).toHaveBeenCalledTimes(3);
  });

  it('discards what was already captured when someone opts out', () => {
    recordAnalyticsEvent('product.app_opened', {});
    expect(queueSize()).toBe(1);

    setAnalyticsOptedOut(true);

    // Saying no applies to what was already collected, not only to what comes
    // next — otherwise opting back in later would ship the backlog.
    expect(queueSize()).toBe(0);
  });

  it('gives every event its own id, so a retry cannot duplicate a row', () => {
    recordAnalyticsEvent('product.app_opened', {});
    recordAnalyticsEvent('product.app_opened', {});

    const queued = JSON.parse(
      kv.getString(ANALYTICS_QUEUE_KEY) ?? '[]',
    ) as Array<{ id: string }>;

    expect(queued).toHaveLength(2);
    expect(queued[0].id).not.toBe(queued[1].id);
  });

  it('does nothing with no transport registered yet', async () => {
    recordAnalyticsEvent('product.app_opened', {});

    await flushAnalytics();

    // Queued, not dropped: events recorded before the transport is ready are
    // the first ones of the session and matter most for the funnel.
    expect(queueSize()).toBe(1);
  });

  it('records nothing at all once opted out', () => {
    setAnalyticsOptedOut(true);
    recordAnalyticsEvent('product.app_opened', {});

    expect(queueSize()).toBe(0);
  });

  it('sends nothing already queued once opted out', async () => {
    const send = jest.fn(async () => true);
    setAnalyticsTransport({ send });
    recordAnalyticsEvent('product.app_opened', {});

    setAnalyticsOptedOut(true);
    await flushAnalytics();

    expect(send).not.toHaveBeenCalled();
  });

  it('drops a diag event rather than queueing it', () => {
    recordAnalyticsEvent('diag.storage_migration_result', { status: 'ok' });

    expect(queueSize()).toBe(0);
  });

  it('never throws from the record path, whatever it is handed', () => {
    expect(() =>
      recordAnalyticsEvent('product.not_a_real_event', { a: 1 }),
    ).not.toThrow();
  });

  it('strips forbidden props before they ever reach the queue', () => {
    setAnalyticsTransport({ send: async () => true });
    recordAnalyticsEvent('product.dream_saved', {
      dream_index: 2,
      text: 'I was flying over the sea',
      title: 'The sea dream',
    });

    const queued = kv.getString(ANALYTICS_QUEUE_KEY) ?? '';

    expect(queued).not.toMatch(/flying over the sea/);
    expect(queued).not.toMatch(/The sea dream/);
    expect(queued).toMatch(/dream_index/);
  });
});
