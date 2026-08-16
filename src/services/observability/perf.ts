import { observability } from './index';
import { DIAG_EVENTS } from './events';

const SLOW_SURFACE_THRESHOLD_MS = 24;

export function trackLocalSurfaceLoad(
  surface: string,
  startedAt: number,
  itemCount: number,
) {
  if (!__DEV__) {
    return;
  }

  const durationMs = Date.now() - startedAt;

  observability.trackEvent(DIAG_EVENTS.LocalSurfaceLoad, {
    surface,
    durationMs,
    itemCount,
  });

  if (durationMs >= SLOW_SURFACE_THRESHOLD_MS) {
    observability.captureMessage('Slow local surface load', 'warning', {
      surface,
      durationMs,
      itemCount,
    });
  }
}
