import { ObservabilityContext, ObservabilityLevel, ObservabilityService } from './types';

function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  return String(error);
}

export class ConsoleObservabilityService implements ObservabilityService {
  captureError(error: unknown, context?: ObservabilityContext) {
    console.error('[obs:error]', normalizeError(error), context ?? {});
  }

  captureMessage(
    message: string,
    level: ObservabilityLevel = 'info',
    context?: ObservabilityContext,
  ) {
    const payload = { message, level, context: context ?? {} };

    if (level === 'error') {
      console.error('[obs:message]', payload);
      return;
    }

    if (level === 'warning') {
      console.warn('[obs:message]', payload);
      return;
    }

    console.log('[obs:message]', payload);
  }

  trackEvent(name: string, properties?: ObservabilityContext) {
    console.log('[obs:event]', { name, properties: properties ?? {} });
  }
}
