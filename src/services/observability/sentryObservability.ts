import * as Sentry from '@sentry/react-native';
import type { ErrorEvent } from '@sentry/core';
import { APP_VERSION } from '../../config/app';
import { redactSentryEvent } from './sentryRedaction';
import {
  ObservabilityContext,
  ObservabilityLevel,
  ObservabilityService,
} from './types';

type RuntimeEnvShape = {
  SENTRY_DSN?: string;
};

// Same accessor the cloud config uses. There is deliberately no bundled
// fallback: without a DSN in the environment, crash reporting stays off and the
// app runs exactly as it did before.
function getRuntimeEnv(): RuntimeEnvShape {
  const maybeProcess = globalThis as { process?: { env?: RuntimeEnvShape } };
  return maybeProcess.process?.env ?? {};
}

export function getSentryDsn(): string {
  return getRuntimeEnv().SENTRY_DSN?.trim() ?? '';
}

export class SentryObservabilityService implements ObservabilityService {
  captureError(error: unknown, context?: ObservabilityContext) {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  }

  captureMessage(
    message: string,
    level: ObservabilityLevel = 'info',
    context?: ObservabilityContext,
  ) {
    Sentry.captureMessage(message, {
      level,
      ...(context ? { extra: context } : {}),
    });
  }

  trackEvent(name: string, properties?: ObservabilityContext) {
    Sentry.addBreadcrumb({
      category: 'app',
      message: name,
      level: 'info',
      data: properties,
    });
  }
}

/**
 * Returns the provider when a DSN is configured, and null otherwise so the
 * caller leaves the console provider in place.
 */
export function initSentry(): ObservabilityService | null {
  const dsn = getSentryDsn();

  if (!dsn) {
    return null;
  }

  Sentry.init({
    dsn,
    release: APP_VERSION,
    // Dream content must never reach the server, whatever the SDK defaults to.
    sendDefaultPii: false,
    beforeSend: (event: ErrorEvent) => redactSentryEvent(event),
  });

  return new SentryObservabilityService();
}
