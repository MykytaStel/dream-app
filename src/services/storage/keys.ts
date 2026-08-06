export const STORAGE_SCHEMA_VERSION_KEY = 'storage-schema-version';
export const CURRENT_STORAGE_SCHEMA_VERSION = 12;

export const DREAMS_STORAGE_KEY = 'dreams';
export const DREAMS_INDEX_STORAGE_KEY = 'dreams-index';
export const DREAMS_META_STORAGE_KEY = 'dreams-meta';
export const DREAM_DELETION_TOMBSTONES_STORAGE_KEY =
  'dream-deletion-tombstones';
export const DREAM_DRAFT_STORAGE_KEY = 'dream-draft';
/**
 * Prefix for the draft kept while editing a dream that already exists, one key
 * per dream.
 *
 * Deliberately not the key above. That one is the unfinished *new* dream: the
 * widget renders it and the home screen offers to resume it, neither of which
 * an edit in progress should trigger.
 */
export const DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX = 'dream-edit-draft:';
export const LAST_VIEWED_DREAM_STORAGE_KEY = 'last-viewed-dream';
export const MONTHLY_REPORT_SAVED_MONTHS_STORAGE_KEY =
  'monthly-report-saved-months';
export const PINNED_DREAM_THREADS_STORAGE_KEY = 'pinned-dream-threads';
export const REVIEW_SAVED_STATE_STORAGE_KEY = 'review-saved-state';
export const MEMORY_PATTERN_FEEDBACK_STORAGE_KEY = 'memory-pattern-feedback';
export const BACKUP_ONBOARDING_SEEN_KEY = 'backup-onboarding-seen';
export const APP_LOCALE_KEY = 'app-locale';
export const APP_THEME_KEY = 'app-theme';
/**
 * Whether the app shows its explanatory prose.
 *
 * Sits next to the theme because it is the same kind of preference: how the
 * app presents itself, not what it stores.
 */
export const APP_CALM_MODE_KEY = 'app-calm-mode';
/** Whether capture screens dim themselves during the dark hours. */
export const APP_NIGHT_CAPTURE_KEY = 'app-night-capture';
export const WIDGET_SNAPSHOT_STORAGE_KEY = 'widget-snapshot';
export const DREAM_ANALYSIS_SETTINGS_KEY = 'dream-analysis-settings';
export const CLOUD_SESSION_STORAGE_KEY = 'cloud-session';
export const CLOUD_SYNC_ENABLED_KEY = 'cloud-sync-enabled';
export const CLOUD_SYNC_SNAPSHOT_STORAGE_KEY = 'cloud-sync-snapshot';
export const CLOUD_SYNC_EVENTS_STORAGE_KEY = 'cloud-sync-events';
export const CLOUD_SUPABASE_URL_STORAGE_KEY = 'cloud-supabase-url';
export const CLOUD_SUPABASE_ANON_KEY_STORAGE_KEY = 'cloud-supabase-anon-key';

/** Last completed/skipped/failed housekeeping attempt; never contains URIs. */
export const AUDIO_CLEANUP_LAST_ATTEMPT_STORAGE_KEY =
  'maintenance-audio-cleanup-last-attempt';
/** Aggregate scan/repair history only; never contains dream IDs or file paths. */
export const ARCHIVE_HEALTH_HISTORY_STORAGE_KEY = 'archive-health-history';

export const REMINDER_SETTINGS_KEY = 'dream-reminder-settings';
export const DREAM_PRACTICE_REMINDER_SETTINGS_KEY =
  'dream-practice-reminder-settings';
export const REMINDER_PENDING_WAKE_OPEN_KEY =
  'dream-reminder-pending-open-record';

export const BIOMETRIC_LOCK_ENABLED_KEY = 'biometric-lock-enabled';

export const ONBOARDING_SEEN_KEY = 'onboarding-seen';

export const LAST_STREAK_CELEBRATED_KEY = 'last-streak-celebrated';

export const WIDGET_PIN_PROMPT_SEEN_KEY = 'widget-pin-prompt-seen';
