export type ObservabilityLevel = 'info' | 'warning' | 'error';

export type ObservabilityContext = Record<string, string | number | boolean | null | undefined>;

export interface ObservabilityService {
  captureError(error: unknown, context?: ObservabilityContext): void;
  captureMessage(
    message: string,
    level?: ObservabilityLevel,
    context?: ObservabilityContext,
  ): void;
  trackEvent(name: string, properties?: ObservabilityContext): void;
}
