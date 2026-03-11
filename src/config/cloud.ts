import { kv } from '../services/storage/mmkv';
import {
  CLOUD_SUPABASE_ANON_KEY_STORAGE_KEY,
  CLOUD_SUPABASE_URL_STORAGE_KEY,
} from '../services/storage/keys';

export type CloudRuntimeConfigDraft = {
  url: string;
  anonKey: string;
};

export type CloudRuntimeConfig = CloudRuntimeConfigDraft;

type RuntimeEnvShape = {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
};

const BUNDLED_SUPABASE_URL = 'https://vjpxswrjjrhhkllhcvbw.supabase.co';
const BUNDLED_SUPABASE_ANON_KEY =
  'sb_publishable_lXs5c9Lmu_pOp1voqRTvPw_vMrSjIiv';

function getRuntimeEnv(): RuntimeEnvShape {
  const maybeProcess = globalThis as {
    process?: {
      env?: RuntimeEnvShape;
    };
  };

  return maybeProcess.process?.env ?? {};
}

function normalizeConfigValue(value?: string | null) {
  return value?.trim() ?? '';
}

function readBundledConfigDraft(): CloudRuntimeConfigDraft {
  const env = getRuntimeEnv();

  return {
    url: normalizeConfigValue(env.SUPABASE_URL) || BUNDLED_SUPABASE_URL,
    anonKey:
      normalizeConfigValue(env.SUPABASE_ANON_KEY) || BUNDLED_SUPABASE_ANON_KEY,
  };
}

function isValidSupabaseUrl(value: string) {
  try {
    const url = String(new URL(value));
    return url.startsWith('https://') || url.startsWith('http://');
  } catch {
    return false;
  }
}

export function getCloudRuntimeConfigDraft(): CloudRuntimeConfigDraft {
  const bundled = readBundledConfigDraft();

  return {
    url:
      normalizeConfigValue(kv.getString(CLOUD_SUPABASE_URL_STORAGE_KEY)) ||
      bundled.url,
    anonKey:
      normalizeConfigValue(kv.getString(CLOUD_SUPABASE_ANON_KEY_STORAGE_KEY)) ||
      bundled.anonKey,
  };
}

export function getCloudRuntimeConfig(): CloudRuntimeConfig | null {
  const draft = getCloudRuntimeConfigDraft();

  if (!draft.url || !draft.anonKey || !isValidSupabaseUrl(draft.url)) {
    return null;
  }

  return draft;
}

export function isCloudRuntimeConfigured() {
  return getCloudRuntimeConfig() !== null;
}

export function saveCloudRuntimeConfig(next: CloudRuntimeConfigDraft) {
  kv.set(CLOUD_SUPABASE_URL_STORAGE_KEY, normalizeConfigValue(next.url));
  kv.set(
    CLOUD_SUPABASE_ANON_KEY_STORAGE_KEY,
    normalizeConfigValue(next.anonKey),
  );
  return getCloudRuntimeConfig();
}

export function clearCloudRuntimeConfig() {
  kv.remove(CLOUD_SUPABASE_URL_STORAGE_KEY);
  kv.remove(CLOUD_SUPABASE_ANON_KEY_STORAGE_KEY);
}
