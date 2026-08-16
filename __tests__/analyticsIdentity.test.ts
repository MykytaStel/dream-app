import { kv } from '../src/services/storage/mmkv';
import { ANALYTICS_INSTALL_ID_KEY } from '../src/services/storage/keys';
import {
  __resetSessionForTests,
  getInstallId,
  getSessionId,
  noteAppBackgrounded,
  noteAppForegrounded,
} from '../src/services/analytics/analyticsIdentity';

/**
 * The database column is `uuid`, so a malformed id is not a cosmetic problem —
 * every insert in the batch is rejected.
 */
const UUID_V4_SHAPE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('analytics identity', () => {
  beforeEach(() => {
    kv.remove(ANALYTICS_INSTALL_ID_KEY);
    __resetSessionForTests();
  });

  it('mints an install id the uuid column will accept', () => {
    expect(getInstallId()).toMatch(UUID_V4_SHAPE);
  });

  it('mints a session id the uuid column will accept', () => {
    expect(getSessionId()).toMatch(UUID_V4_SHAPE);
  });

  it('returns the same install id on every call', () => {
    expect(getInstallId()).toBe(getInstallId());
  });

  it('persists the install id across a restart', () => {
    const first = getInstallId();

    __resetSessionForTests();

    expect(getInstallId()).toBe(first);
  });

  it('gives two installs different ids', () => {
    const first = getInstallId();
    kv.remove(ANALYTICS_INSTALL_ID_KEY);

    expect(getInstallId()).not.toBe(first);
  });

  it('keeps the session id stable within a session', () => {
    expect(getSessionId()).toBe(getSessionId());
  });

  it('starts a new session after 30 minutes in the background', () => {
    const before = getSessionId();
    const now = Date.now();

    noteAppBackgrounded(now);
    noteAppForegrounded(now + 31 * 60 * 1000);

    expect(getSessionId()).not.toBe(before);
  });

  it('keeps the session after a short background gap', () => {
    const before = getSessionId();
    const now = Date.now();

    noteAppBackgrounded(now);
    noteAppForegrounded(now + 60 * 1000);

    expect(getSessionId()).toBe(before);
  });

  it('measures time away, not time since the app was opened', () => {
    // A long stretch of use interrupted by a glance elsewhere is one session.
    // Measuring from the last foreground event instead would split it, and
    // would do so for exactly the heaviest users.
    const before = getSessionId();
    const opened = Date.now();
    const twoHoursLater = opened + 2 * 60 * 60 * 1000;

    noteAppBackgrounded(twoHoursLater);
    noteAppForegrounded(twoHoursLater + 10_000);

    expect(getSessionId()).toBe(before);
  });

  it('does not start a new session when the app was never backgrounded', () => {
    const before = getSessionId();

    noteAppForegrounded(Date.now() + 24 * 60 * 60 * 1000);

    expect(getSessionId()).toBe(before);
  });

  it('does not let a session outlive the process that started it', () => {
    // The session id is memory-only on purpose: a restart is a new session,
    // and persisting it would silently merge yesterday's app run into today's.
    const before = getSessionId();

    __resetSessionForTests();

    expect(getSessionId()).not.toBe(before);
  });
});
