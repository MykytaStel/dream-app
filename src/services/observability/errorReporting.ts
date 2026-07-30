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

  const entries = Object.entries(context).filter(
    ([, value]) => value !== undefined,
  );
  if (!entries.length) {
    return undefined;
  }

  return Object.fromEntries(entries);
}

export function reportError(error: unknown, context?: ObservabilityContext) {
  observability.captureError(error, sanitizeContext(context));
}

/**
 * A stored value could not be read and a default was used instead.
 *
 * These failures are recoverable by design, but they are never expected: each
 * one means the user quietly lost a setting, a draft or a piece of state. They
 * are reported so that corruption is visible rather than merely survivable.
 *
 * `storageKey` is the key name, never its contents.
 */
export function reportStorageReadFailure(
  storageKey: string,
  error: unknown,
  context?: ObservabilityContext,
) {
  reportError(error, {
    ...context,
    storage_key: storageKey,
    error_source: 'storage_read',
  });
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
  const maybeErrorUtils = (globalThis as { ErrorUtils?: ErrorUtilsShape })
    .ErrorUtils;
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
