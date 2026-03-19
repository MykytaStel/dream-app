export const DREAM_WIDGET_URL_PREFIX = 'dreamapp://';

export const DREAM_WIDGET_PATHS = {
  Capture: 'capture',
  Draft: 'draft',
  Memory: 'memory',
  Dream: 'dream',
} as const;

function buildWidgetUrl(path: string) {
  return `${DREAM_WIDGET_URL_PREFIX}${path}`;
}

export function getDreamWidgetCaptureUrl() {
  return buildWidgetUrl(DREAM_WIDGET_PATHS.Capture);
}

export function getDreamWidgetDraftUrl() {
  return buildWidgetUrl(DREAM_WIDGET_PATHS.Draft);
}

export function getDreamWidgetMemoryUrl() {
  return buildWidgetUrl(DREAM_WIDGET_PATHS.Memory);
}

export function getDreamWidgetDreamUrl(dreamId: string) {
  return buildWidgetUrl(`${DREAM_WIDGET_PATHS.Dream}/${encodeURIComponent(dreamId)}`);
}
