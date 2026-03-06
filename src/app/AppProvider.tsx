import React from 'react';
import { ThemeProvider } from '@shopify/restyle';
import { theme } from '../theme/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ensurePreviewDream } from '../features/dreams/repository/dreamsRepository';
import {
  getDreamReminderSettings,
  scheduleDreamReminder,
} from '../features/reminders/services/dreamReminderService';
import { observability } from '../services/observability';
import { OBS_EVENTS } from '../services/observability/events';
import { I18nProvider } from '../i18n/I18nProvider';

const qc = new QueryClient();
export const AppProviders: React.FC<React.PropsWithChildren> = ({ children }) => {
  React.useEffect(() => {
    ensurePreviewDream();
    observability.trackEvent(OBS_EVENTS.AppOpened);
    scheduleDreamReminder(getDreamReminderSettings()).catch(error => {
      observability.captureError(error, { event: 'schedule_dream_reminder_on_launch' });
    });
  }, []);

  React.useEffect(() => {
    type GlobalErrorHandler = (error: Error, isFatal?: boolean) => void;
    type ErrorUtilsShape = {
      getGlobalHandler?: () => GlobalErrorHandler;
      setGlobalHandler?: (handler: GlobalErrorHandler) => void;
    };
    const maybeErrorUtils = (globalThis as { ErrorUtils?: ErrorUtilsShape }).ErrorUtils;
    const previous = maybeErrorUtils?.getGlobalHandler?.();

    if (!maybeErrorUtils?.setGlobalHandler || !previous) {
      return;
    }

    maybeErrorUtils.setGlobalHandler((error, isFatal) => {
      observability.captureError(error, {
        isFatal: Boolean(isFatal),
        event: OBS_EVENTS.GlobalJsError,
      });
      previous(error, isFatal);
    });

    return () => {
      maybeErrorUtils.setGlobalHandler?.(previous);
    };
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
