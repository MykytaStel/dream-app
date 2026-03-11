import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { APP_VERSION } from '../../../config/app';
import { getCloudRuntimeConfig } from '../../../config/cloud';
import { supabaseAuthStorage } from './storage';

let cachedClient: SupabaseClient | null = null;
let cachedConfigSignature: string | null = null;

function createConfigSignature(url: string, anonKey: string) {
  return `${url}::${anonKey}`;
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getCloudRuntimeConfig();
  if (!config) {
    cachedClient = null;
    cachedConfigSignature = null;
    return null;
  }

  const nextSignature = createConfigSignature(config.url, config.anonKey);
  if (cachedClient && cachedConfigSignature === nextSignature) {
    return cachedClient;
  }

  cachedClient = createClient(config.url, config.anonKey, {
    auth: {
      storage: supabaseAuthStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Client-Info': `kaleidoskop-rn/${APP_VERSION}`,
      },
    },
  });
  cachedConfigSignature = nextSignature;

  return cachedClient;
}

export function resetSupabaseClient() {
  cachedClient = null;
  cachedConfigSignature = null;
}
