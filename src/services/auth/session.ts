import { kv } from '../storage/mmkv';
import {
  CLOUD_SESSION_STORAGE_KEY,
  CLOUD_SYNC_ENABLED_KEY,
} from '../storage/keys';

export type CloudSession =
  | { status: 'signed-out' }
  | {
      status: 'signed-in';
      provider: 'supabase';
      userId: string;
      email?: string;
      isAnonymous?: boolean;
    };

function isSignedInSession(
  value: unknown,
): value is Extract<CloudSession, { status: 'signed-in' }> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const session = value as Record<string, unknown>;
  return (
    session.status === 'signed-in' &&
    session.provider === 'supabase' &&
    typeof session.userId === 'string' &&
    Boolean(session.userId.trim()) &&
    (typeof session.email === 'undefined' ||
      typeof session.email === 'string') &&
    (typeof session.isAnonymous === 'undefined' ||
      typeof session.isAnonymous === 'boolean')
  );
}

export function getCloudSession(): CloudSession {
  const raw = kv.getString(CLOUD_SESSION_STORAGE_KEY);
  if (!raw) {
    return { status: 'signed-out' };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isSignedInSession(parsed)) {
      return {
        status: 'signed-in',
        provider: 'supabase',
        userId: parsed.userId.trim(),
        email: parsed.email?.trim() || undefined,
        isAnonymous: parsed.isAnonymous,
      };
    }
  } catch {
    kv.remove(CLOUD_SESSION_STORAGE_KEY);
  }

  return { status: 'signed-out' };
}

export function saveCloudSession(
  session: Extract<CloudSession, { status: 'signed-in' }>,
) {
  kv.set(CLOUD_SESSION_STORAGE_KEY, JSON.stringify(session));
  if (typeof kv.getBoolean(CLOUD_SYNC_ENABLED_KEY) !== 'boolean') {
    kv.set(CLOUD_SYNC_ENABLED_KEY, true);
  }

  return getCloudSession();
}

export function clearCloudSession() {
  kv.remove(CLOUD_SESSION_STORAGE_KEY);
  kv.set(CLOUD_SYNC_ENABLED_KEY, false);
  return getCloudSession();
}

export function getCloudSyncEnabled() {
  return (
    getCloudSession().status === 'signed-in' &&
    (kv.getBoolean(CLOUD_SYNC_ENABLED_KEY) ?? true)
  );
}

export function setCloudSyncEnabled(enabled: boolean) {
  kv.set(CLOUD_SYNC_ENABLED_KEY, Boolean(enabled));
  return getCloudSyncEnabled();
}
