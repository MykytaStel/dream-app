import { observability } from './index';

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

  observability.trackEvent('local_surface_load', {
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
