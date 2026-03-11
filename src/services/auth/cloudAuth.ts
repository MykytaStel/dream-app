import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '../api/supabase/client';
import {
  clearCloudSession,
  saveCloudSession,
  type CloudSession,
} from './session';

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function toCloudSession(session: Session | null): CloudSession {
  const user = session?.user;
  if (!user?.id) {
    return clearCloudSession();
  }

  return saveCloudSession({
    status: 'signed-in',
    provider: 'supabase',
    userId: user.id,
    email: user.email,
    isAnonymous: Boolean(user.is_anonymous),
  });
}

export async function syncCloudSessionFromAuth() {
  const client = getSupabaseClient();
  if (!client) {
    return clearCloudSession();
  }

  const { data, error } = await client.auth.getSession();
  if (error) {
    throw error;
  }

  return toCloudSession(data.session);
}

export function startCloudAuthSessionSync(options?: {
  onSessionChange?: (session: CloudSession) => void;
  onError?: (error: unknown) => void;
}) {
  const client = getSupabaseClient();
  if (!client) {
    const cleared = clearCloudSession();
    options?.onSessionChange?.(cleared);
    return () => undefined;
  }

  syncCloudSessionFromAuth()
    .then(session => {
      options?.onSessionChange?.(session);
    })
    .catch(error => {
      options?.onError?.(error);
    });

  const {
    data: { subscription },
  } = client.auth.onAuthStateChange((_event, session) => {
    options?.onSessionChange?.(toCloudSession(session));
  });

  return () => {
    subscription.unsubscribe();
  };
}

export async function signInToCloudAnonymously() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase runtime config is missing.');
  }

  const { data, error } = await client.auth.signInAnonymously();
  if (error) {
    throw error;
  }

  if (data.session) {
    return toCloudSession(data.session);
  }

  return syncCloudSessionFromAuth();
}

export async function signInToCloudWithPassword(input: {
  email: string;
  password: string;
}) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase runtime config is missing.');
  }

  const { data, error } = await client.auth.signInWithPassword({
    email: normalizeEmail(input.email),
    password: input.password,
  });
  if (error) {
    throw error;
  }

  if (data.session) {
    return toCloudSession(data.session);
  }

  return syncCloudSessionFromAuth();
}

export async function upgradeCloudAnonymousSession(input: {
  email: string;
  password: string;
}) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase runtime config is missing.');
  }

  const session = await syncCloudSessionFromAuth();
  if (session.status !== 'signed-in' || !session.isAnonymous) {
    throw new Error('anonymous-cloud-session-required');
  }

  const { error } = await client.auth.updateUser({
    email: normalizeEmail(input.email),
    password: input.password,
  });
  if (error) {
    throw error;
  }

  return syncCloudSessionFromAuth();
}

export async function signOutFromCloud() {
  const client = getSupabaseClient();
  if (!client) {
    return clearCloudSession();
  }

  const { error } = await client.auth.signOut();
  if (error) {
    throw error;
  }

  return clearCloudSession();
}
