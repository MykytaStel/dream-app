import { getCloudRuntimeConfig } from '../../../config/cloud';
import { getSupabaseClient } from './client';

export type SupabaseRestConfig = {
  baseUrl: string;
  anonKey: string;
  accessToken: string | null;
};

export async function getSupabaseRestConfig(): Promise<SupabaseRestConfig | null> {
  const runtime = getCloudRuntimeConfig();
  if (!runtime) {
    return null;
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      baseUrl: runtime.url.replace(/\/+$/, ''),
      anonKey: runtime.anonKey,
      accessToken: null,
    };
  }

  try {
    const { data, error } = await client.auth.getSession();
    if (error) {
      return {
        baseUrl: runtime.url.replace(/\/+$/, ''),
        anonKey: runtime.anonKey,
        accessToken: null,
      };
    }

    return {
      baseUrl: runtime.url.replace(/\/+$/, ''),
      anonKey: runtime.anonKey,
      accessToken: data.session?.access_token ?? null,
    };
  } catch {
    return {
      baseUrl: runtime.url.replace(/\/+$/, ''),
      anonKey: runtime.anonKey,
      accessToken: null,
    };
  }
}

