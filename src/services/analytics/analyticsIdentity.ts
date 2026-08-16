import { ANALYTICS_INSTALL_ID_KEY } from '../storage/keys';
import { kv } from '../storage/mmkv';

/**
 * A session ends after this long in the background. Long enough that glancing
 * at a notification does not split a morning capture into two sessions, short
 * enough that yesterday and today are never the same one.
 */
const SESSION_IDLE_MS = 30 * 60 * 1000;

const HEX = '0123456789abcdef';
/** The four values the v4 variant nibble is allowed to take. */
const VARIANT_NIBBLE = '89ab';

/**
 * A v4 UUID. The database column is `uuid`, so anything else is rejected at
 * insert time rather than landing malformed.
 *
 * Math.random is adequate here and deliberately so: what this id needs is
 * collision resistance, not unpredictability. Guessing someone else's install
 * id buys nothing, because anyone holding the publishable key can already
 * write a row claiming any id they like — see the migration's note on why
 * forgery is bounded rather than prevented.
 */
export function createUuid(): string {
  let out = '';

  for (let i = 0; i < 36; i += 1) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      out += '-';
    } else if (i === 14) {
      out += '4';
    } else if (i === 19) {
      out += VARIANT_NIBBLE[Math.floor(Math.random() * VARIANT_NIBBLE.length)];
    } else {
      out += HEX[Math.floor(Math.random() * 16)];
    }
  }

  return out;
}

let sessionId: string | null = null;
let backgroundedAt: number | null = null;

/**
 * Minted by the app, not derived from any device identifier, and deliberately
 * unrelated to the Supabase auth user id used by cloud sync.
 *
 * A reinstall produces a new one. That is honest rather than a defect: the app
 * genuinely cannot tell it is the same person, and the alternatives all mean
 * reaching for a device identifier.
 */
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

/** Called when the app leaves the foreground, to start the idle clock. */
export function noteAppBackgrounded(now = Date.now()) {
  backgroundedAt = now;
}

/**
 * Called when the app returns to the foreground. A stay of SESSION_IDLE_MS or
 * more *in the background* starts a new session.
 *
 * Deliberately measured from when the app was backgrounded rather than from
 * the last foreground event: the latter is the time the app has been in use,
 * so a two-hour session interrupted by a ten-second glance elsewhere would
 * split — fragmenting sessions for exactly the heaviest users.
 */
export function noteAppForegrounded(now = Date.now()) {
  if (backgroundedAt !== null && now - backgroundedAt >= SESSION_IDLE_MS) {
    sessionId = createUuid();
  }

  backgroundedAt = null;
}

export function __resetSessionForTests() {
  sessionId = null;
  backgroundedAt = null;
}
