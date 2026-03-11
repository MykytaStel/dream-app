import { kv } from '../src/services/storage/mmkv';
import {
  clearCloudRuntimeConfig,
  getCloudRuntimeConfig,
  getCloudRuntimeConfigDraft,
  isCloudRuntimeConfigured,
  saveCloudRuntimeConfig,
} from '../src/config/cloud';

describe('cloud runtime config', () => {
  const bundledConfig = {
    url: 'https://vjpxswrjjrhhkllhcvbw.supabase.co',
    anonKey: 'sb_publishable_lXs5c9Lmu_pOp1voqRTvPw_vMrSjIiv',
  };

  beforeEach(() => {
    kv.clearAll();
  });

  test('falls back to the bundled config when no override exists', () => {
    expect(getCloudRuntimeConfigDraft()).toEqual(bundledConfig);
    expect(getCloudRuntimeConfig()).toEqual(bundledConfig);
    expect(isCloudRuntimeConfigured()).toBe(true);
  });

  test('persists and validates a runtime config', () => {
    expect(
      saveCloudRuntimeConfig({
        url: 'https://demo-project.supabase.co',
        anonKey: 'anon-key',
      }),
    ).toEqual({
      url: 'https://demo-project.supabase.co',
      anonKey: 'anon-key',
    });

    expect(getCloudRuntimeConfigDraft()).toEqual({
      url: 'https://demo-project.supabase.co',
      anonKey: 'anon-key',
    });
    expect(isCloudRuntimeConfigured()).toBe(true);

    clearCloudRuntimeConfig();
    expect(getCloudRuntimeConfig()).toEqual(bundledConfig);
    expect(isCloudRuntimeConfigured()).toBe(true);
  });
});
