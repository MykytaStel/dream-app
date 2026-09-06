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

// The project's ingest key. Like the Supabase publishable key in
// `src/config/cloud.ts`, a Sentry DSN is a client credential by design — it
// ships inside every build and only permits writing new events, never reading
// them (https://docs.sentry.io/product/sentry-basics/dsn-explainer/). Bundling
// it is what makes crash reporting work in a release build without threading an
// env var through Xcode and Gradle, the same footgun `nodeExecutableAndArgs`
// once was. `SENTRY_DSN` in the environment still overrides it; an empty string
// (here or in the env) disables crash reporting entirely.
const BUNDLED_SENTRY_DSN =
  'https://241182ada21c549745bb8014e30f5601@o4512041364094976.ingest.de.sentry.io/4512041368485968';

function getRuntimeEnv(): RuntimeEnvShape {
  const maybeProcess = globalThis as { process?: { env?: RuntimeEnvShape } };
  return maybeProcess.process?.env ?? {};
}

export function getSentryDsn(): string {
  const fromEnv = getRuntimeEnv().SENTRY_DSN?.trim();
  return fromEnv ?? BUNDLED_SENTRY_DSN;
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
 * The environment tag on every event. Dev builds report too — so the pipeline
 * can be verified without a store build — but under `development`, which is one
 * inbound filter away from silence in the Sentry project if it gets noisy.
 */
export function getSentryEnvironment(): string {
  return __DEV__ ? 'development' : 'production';
}

/**
 * Returns the provider when crash reporting should run, and null otherwise so
 * the caller leaves the console provider in place. Runs whenever a DSN is
 * configured; the jest environment has none, so tests never call `Sentry.init`.
 */
export function initSentry(): ObservabilityService | null {
  const dsn = getSentryDsn();

  if (!dsn) {
    return null;
  }

  Sentry.init({
    dsn,
    release: APP_VERSION,
    environment: getSentryEnvironment(),
    // Dream content must never reach the server, whatever the SDK defaults to.
    sendDefaultPii: false,
    beforeSend: (event: ErrorEvent) => redactSentryEvent(event),
  });

  return new SentryObservabilityService();
}
