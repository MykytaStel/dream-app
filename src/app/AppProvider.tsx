import React from 'react';
import { AppState, Platform, StatusBar } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { syncDreamReminderState } from '../features/reminders/services/dreamReminderService';
import { syncDreamPracticeReminderState } from '../features/reminders/services/dreamPracticeReminderService';
import { setObservabilityProvider } from '../services/observability';
import {
  installGlobalErrorReporting,
  reportError,
} from '../services/observability/errorReporting';
import { initSentry } from '../services/observability/sentryObservability';
import { trackAppOpened } from '../services/observability/events';
import {
  createSupabaseAnalyticsTransport,
  flushAnalytics,
  noteAppBackgrounded,
  noteAppForegrounded,
  setAnalyticsTransport,
} from '../services/analytics';
import { I18nProvider } from '../i18n/I18nProvider';
import { AppThemeProvider, useAppTheme } from '../theme/AppThemeProvider';
import { CalmModeProvider } from './CalmModeProvider';
import { syncDreamWidgetSnapshot } from '../features/widgets/services/dreamWidgetSyncService';

const qc = new QueryClient();

function ThemedSystemChrome() {
  const { appearance, theme } = useAppTheme();

  if (Platform.OS === 'ios') {
    return null;
  }

  return (
    <StatusBar
      animated
      barStyle={appearance === 'dark' ? 'light-content' : 'dark-content'}
      backgroundColor={theme.colors.background}
    />
  );
}

export const AppProviders: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  React.useEffect(() => {
    // Storage recovery and migrations are completed by the startup gates before
    // providers mount, so every provider observes one stable current schema.
    const sentry = initSentry();
    if (sentry) {
      setObservabilityProvider(sentry);
    }

    syncDreamWidgetSnapshot().catch(error => {
      reportError(error, { event: 'widget_snapshot_sync_failed' });
    });

    trackAppOpened();
    syncDreamReminderState().catch(error => {
      reportError(error, {
        event: 'schedule_dream_reminder_on_launch',
      });
    });
    syncDreamPracticeReminderState().catch(error => {
      reportError(error, {
        event: 'schedule_dream_practice_reminder_on_launch',
      });
    });
  }, []);

  React.useEffect(() => {
    setAnalyticsTransport(createSupabaseAnalyticsTransport());
    flushAnalytics();

    // Backgrounding is the reliable moment to send: the person has stopped,
    // and the OS gives a short window before it stops giving anything.
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        noteAppForegrounded();
        flushAnalytics();
        return;
      }

      if (nextState === 'background') {
        // Start the idle clock before flushing: the session boundary is time
        // spent away, not time since the app was last opened.
        noteAppBackgrounded();
        flushAnalytics();
      }
    });

    return () => subscription.remove();
  }, []);

  React.useEffect(() => {
    return installGlobalErrorReporting();
  }, []);

  return (
    <QueryClientProvider client={qc}>
      <SafeAreaProvider>
        <I18nProvider>
          <AppThemeProvider>
            <CalmModeProvider>
              <ThemedSystemChrome />
              {children}
            </CalmModeProvider>
          </AppThemeProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
};
