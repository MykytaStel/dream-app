import { kv } from '../src/services/storage/mmkv';
import {
  clearCloudSession,
  getCloudSession,
  getCloudSyncEnabled,
  saveCloudSession,
  setCloudSyncEnabled,
} from '../src/services/auth/session';

describe('cloud session service', () => {
  beforeEach(() => {
    kv.clearAll();
  });

  test('defaults to signed-out with sync disabled', () => {
    expect(getCloudSession()).toEqual({ status: 'signed-out' });
    expect(getCloudSyncEnabled()).toBe(false);
  });

  test('persists signed-in session and sync preference', () => {
    saveCloudSession({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-1',
      email: 'dreamer@example.com',
    });

    expect(getCloudSession()).toEqual({
      status: 'signed-in',
      provider: 'supabase',
      userId: 'user-1',
      email: 'dreamer@example.com',
    });
    expect(getCloudSyncEnabled()).toBe(true);

    setCloudSyncEnabled(false);
    expect(getCloudSyncEnabled()).toBe(false);

    clearCloudSession();
    expect(getCloudSession()).toEqual({ status: 'signed-out' });
    expect(getCloudSyncEnabled()).toBe(false);
  });
});
