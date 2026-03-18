import React from 'react';
import { ThemeProvider } from '@shopify/restyle';
import { theme } from '../theme/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { syncDreamReminderState } from '../features/reminders/services/dreamReminderService';
import { observability } from '../services/observability';
import {
  installGlobalErrorReporting,
  reportError,
} from '../services/observability/errorReporting';
import { OBS_EVENTS } from '../services/observability/events';
import { I18nProvider } from '../i18n/I18nProvider';
import { runStorageMigrations } from '../services/storage/migrations';

const qc = new QueryClient();
export const AppProviders: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  React.useEffect(() => {
    try {
      runStorageMigrations();
    } catch (error) {
      reportError(error, { event: 'storage_migration_failed' });
    }

    observability.trackEvent(OBS_EVENTS.AppOpened);
    syncDreamReminderState().catch(error => {
      reportError(error, {
        event: 'schedule_dream_reminder_on_launch',
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
          <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
};
