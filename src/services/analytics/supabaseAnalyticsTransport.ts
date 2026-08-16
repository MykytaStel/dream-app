import { Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { APP_VERSION } from '../../config/app';
import { getBundledCloudConfig } from '../../config/cloud';
import { getStoredLocale } from '../../i18n/localeStore';
import type { AnalyticsEvent } from './analyticsEvent';
import type { AnalyticsTransport } from './analyticsTransport';

/**
 * Writes to a table nobody can read back through the API.
 *
 * The publishable key this uses ships inside the app binary, so the table's
 * protection is that it has no select policy for any role — see
 * `supabase/migrations/20260813_000006_analytics_events.sql` for the full
 * reasoning. Nothing here is a secret, and nothing here needs to be.
 *
 * Deliberately independent of cloud sync, in two senses. It does not require
 * sync to be enabled — gating on that would have measured only cloud users and
 * quietly biased every §9 number. And it builds its own client from the
 * bundled project rather than the resolved runtime config, so a person who
 * repoints sync at their own Supabase does not end up posting analytics at a
 * project with no such table.
 *
 * Its own client also means it never inherits the sync session: these rows are
 * written as `anon` even when someone is signed in, which is what keeps
 * install_id unjoinable to auth.users.id.
 */
let analyticsClient: SupabaseClient | null = null;

function getAnalyticsClient(): SupabaseClient | null {
  if (analyticsClient) {
    return analyticsClient;
  }

  const config = getBundledCloudConfig();
  if (!config) {
    return null;
  }

  analyticsClient = createClient(config.url, config.anonKey, {
    auth: {
      // No session, no refresh, no storage: this client only ever inserts
      // anonymous rows, and giving it an identity would defeat the point.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Client-Info': `kaleidoskop-analytics/${APP_VERSION}`,
      },
    },
  });

  return analyticsClient;
}

export function createSupabaseAnalyticsTransport(): AnalyticsTransport {
  return {
    async send(batch: AnalyticsEvent[]) {
      const client = getAnalyticsClient();
      if (!client || !batch.length) {
        return false;
      }

      const rows = batch.map(event => ({
        id: event.id,
        install_id: event.installId,
        session_id: event.sessionId,
        event: event.event,
        props: event.props,
        client_ts: new Date(event.clientTs).toISOString(),
        app_version: APP_VERSION,
        platform: Platform.OS,
        // Read at send time rather than captured at construction: someone
        // who switches language mid-session should have later events
        // attributed to the language they are actually reading.
        locale: getStoredLocale(),
      }));

      const { error } = await client.from('analytics_events').insert(rows);
      return !error;
    },
  };
}
