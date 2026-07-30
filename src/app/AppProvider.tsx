import React from 'react';
import { Platform, StatusBar } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { syncDreamReminderState } from '../features/reminders/services/dreamReminderService';
import { syncDreamPracticeReminderState } from '../features/reminders/services/dreamPracticeReminderService';
import {
  observability,
  setObservabilityProvider,
} from '../services/observability';
import {
  installGlobalErrorReporting,
  reportError,
} from '../services/observability/errorReporting';
import { initSentry } from '../services/observability/sentryObservability';
import { OBS_EVENTS } from '../services/observability/events';
import { I18nProvider } from '../i18n/I18nProvider';
import { runStorageMigrations } from '../services/storage/migrations';
import { AppThemeProvider, useAppTheme } from '../theme/AppThemeProvider';
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
    // Registered before anything else runs, so a failure during startup is
    // still reported. Returns null when no DSN is configured, which leaves the
    // console provider in place.
    const sentry = initSentry();
    if (sentry) {
      setObservabilityProvider(sentry);
    }

    try {
      runStorageMigrations();
    } catch (error) {
      reportError(error, { event: 'storage_migration_failed' });
    }

    // Kept outside the try: it is async, so a rejection would never have
    // reached that catch. Its own failure is reported separately.
    syncDreamWidgetSnapshot().catch(error => {
      reportError(error, { event: 'widget_snapshot_sync_failed' });
    });

    observability.trackEvent(OBS_EVENTS.AppOpened);
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
    return installGlobalErrorReporting();
  }, []);

  return (
    <QueryClientProvider client={qc}>
      <SafeAreaProvider>
        <I18nProvider>
          <AppThemeProvider>
            <ThemedSystemChrome />
            {children}
          </AppThemeProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
};
