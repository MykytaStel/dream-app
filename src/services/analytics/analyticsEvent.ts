export type AnalyticsPropValue = string | number | boolean;

export type AnalyticsEvent = {
  /**
   * Minted on the device at enqueue time and used as the row's primary key,
   * so a retry after a lost response cannot insert the same event twice.
   * Delivery is at-least-once — the flush happens as the app backgrounds,
   * which is exactly when the OS may suspend the process between the insert
   * committing and the response arriving.
   */
  id: string;
  event: string;
  props: Record<string, AnalyticsPropValue>;
  clientTs: number;
  installId: string;
  sessionId: string;
};

/**
 * An allowlist, not a denylist.
 *
 * `sentryRedaction.ts` guards the crash path with a denylist, and its reasoning
 * holds there: the context type already restricts values to primitives, so what
 * it guards against is a caller putting dream text into one of them, and a key
 * nobody thought about is seen by one vendor's error viewer.
 *
 * This pipe fails differently. A key nobody thought about is written to a
 * database row and read back in aggregate for months. So each event declares
 * what it may carry, and anything undeclared is dropped — an unconsidered
 * property is absent rather than present.
 *
 * The plan's §9 prohibition is the acceptance criterion: dream text,
 * transcript, titles, tags, symbols, search queries and mood values never leave
 * the device. Note what is allowed instead of each: `query_length` rather than
 * the query, `dream_count` rather than the dreams, `kind` rather than the
 * symbol.
 */
const ALLOWED_PROPS: Record<string, readonly string[]> = {
  'product.app_opened': [],
  'product.onboarding_opened': [],
  'product.onboarding_completed': ['path'],
  'product.capture_started': [
    'capture_id',
    'entry_mode',
    'auto_started_recording',
    'source',
  ],
  'product.draft_resumed': ['resume_mode', 'has_audio', 'has_text', 'source'],
  'product.dream_saved': [
    'capture_id',
    'mode',
    'entry_mode',
    'has_audio',
    'has_text',
    'dream_index',
  ],
  'product.dream_detail_opened': ['dream_age_days', 'source'],
  'product.memory_opened': ['dream_count'],
  'product.pattern_opened': ['kind'],
  'product.pattern_confirmed': ['kind', 'action'],
  'product.search_used': ['surface', 'query_length', 'result_count'],
  'product.filters_applied': ['surface', 'filter_count'],
  'product.reminder_toggled': ['enabled'],
  'product.biometric_lock_toggled': ['enabled'],
  'product.backup_enabled': ['kind'],
  'product.backup_export_started': [],
  'product.backup_export_completed': ['dream_count'],
  'product.restore_started': ['mode'],
  'product.restore_completed': [
    'mode',
    'imported_dream_count',
    'resulting_dream_count',
  ],
  'product.practice_hub_opened': ['focus', 'source'],
  'product.lucid_practice_started': ['source'],
  'product.reality_check_completed': ['source'],
  'product.wbtb_alarm_used': ['source'],
  'product.nightmare_rescripting_started': ['source'],
  'product.nightmare_rescripting_completed': ['source'],
  'product.grounding_opened': ['source'],
  'product.dream_sign_saved': ['count', 'source'],
};

/**
 * No allowed key is free-form today — every one resolves to a closed union, a
 * boolean, a number or a generated id. This cap is defence in depth against a
 * future edit that changes that quietly: an essay cannot ride in on an allowed
 * key even if someone widens one.
 */
const MAX_STRING_LENGTH = 64;

function isPrimitive(value: unknown): value is AnalyticsPropValue {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

export function sanitizeProps(
  event: string,
  props: Record<string, unknown>,
): Record<string, AnalyticsPropValue> {
  const allowed = ALLOWED_PROPS[event];
  if (!allowed) {
    return {};
  }

  const clean: Record<string, AnalyticsPropValue> = {};
  for (const key of allowed) {
    const value = props[key];
    if (isPrimitive(value)) {
      clean[key] =
        typeof value === 'string' ? value.slice(0, MAX_STRING_LENGTH) : value;
    }
  }

  return clean;
}

export function isKnownAnalyticsEvent(event: string) {
  return Object.prototype.hasOwnProperty.call(ALLOWED_PROPS, event);
}

export function listKnownAnalyticsEvents(): string[] {
  return Object.keys(ALLOWED_PROPS);
}
