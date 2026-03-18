import { OBS_EVENTS } from './events';
import { observability } from './index';
import { ObservabilityContext } from './types';

type GlobalErrorHandler = (error: Error, isFatal?: boolean) => void;
type ErrorUtilsShape = {
  getGlobalHandler?: () => GlobalErrorHandler;
  setGlobalHandler?: (handler: GlobalErrorHandler) => void;
};

function sanitizeContext(
  context?: ObservabilityContext,
): ObservabilityContext | undefined {
  if (!context) {
    return undefined;
  }

  const entries = Object.entries(context).filter(([, value]) => value !== undefined);
  if (!entries.length) {
    return undefined;
  }

  return Object.fromEntries(entries);
}

export function reportError(error: unknown, context?: ObservabilityContext) {
  observability.captureError(error, sanitizeContext(context));
}

export function reportActionError(
  action: string,
  error: unknown,
  context?: ObservabilityContext,
) {
  reportError(error, {
    ...context,
    action,
    error_source: 'action',
  });
}

export function installGlobalErrorReporting(): () => void {
  const maybeErrorUtils = (globalThis as { ErrorUtils?: ErrorUtilsShape }).ErrorUtils;
  const previous = maybeErrorUtils?.getGlobalHandler?.();

  if (!maybeErrorUtils?.setGlobalHandler || !previous) {
    return () => {};
  }

  maybeErrorUtils.setGlobalHandler((error, isFatal) => {
    reportError(error, {
      error_source: 'global',
      event: OBS_EVENTS.GlobalJsError,
      isFatal: Boolean(isFatal),
    });
    previous(error, isFatal);
  });

  return () => {
    maybeErrorUtils.setGlobalHandler?.(previous);
  };
}
