import { recordAnalyticsEvent } from '../analytics';
import { observability } from './index';
import { ObservabilityContext } from './types';

/**
 * What a person did. These reach the analytics table and answer the plan's §9
 * funnel.
 */
export const PRODUCT_EVENTS = {
  AppOpened: 'product.app_opened',
  OnboardingOpened: 'product.onboarding_opened',
  OnboardingCompleted: 'product.onboarding_completed',
  CaptureStarted: 'product.capture_started',
  DraftResumed: 'product.draft_resumed',
  DreamSaved: 'product.dream_saved',
  DreamDetailOpened: 'product.dream_detail_opened',
  MemoryOpened: 'product.memory_opened',
  PatternOpened: 'product.pattern_opened',
  PatternConfirmed: 'product.pattern_confirmed',
  ReminderToggled: 'product.reminder_toggled',
  BiometricLockToggled: 'product.biometric_lock_toggled',
  PracticeHubOpened: 'product.practice_hub_opened',
  LucidPracticeStarted: 'product.lucid_practice_started',
  RealityCheckCompleted: 'product.reality_check_completed',
  WbtbAlarmUsed: 'product.wbtb_alarm_used',
  NightmareRescriptingStarted: 'product.nightmare_rescripting_started',
  NightmareRescriptingCompleted: 'product.nightmare_rescripting_completed',
  GroundingOpened: 'product.grounding_opened',
  DreamSignSaved: 'product.dream_sign_saved',
  SearchUsed: 'product.search_used',
  FiltersApplied: 'product.filters_applied',
  BackupEnabled: 'product.backup_enabled',
  BackupExportStarted: 'product.backup_export_started',
  BackupExportCompleted: 'product.backup_export_completed',
  RestoreStarted: 'product.restore_started',
  RestoreCompleted: 'product.restore_completed',
} as const;

/**
 * What the app did to itself: migrations, health scans, cleanup runs.
 *
 * Kept in its own namespace because every §9 query filters to one side or the
 * other, and a shared namespace makes those queries wrong by default rather
 * than by accident. These stay in Sentry — the analytics guard has no entry for
 * them, so they are dropped before the queue.
 */
export const DIAG_EVENTS = {
  GlobalJsError: 'diag.global_js_error',
  DreamImportPreflightCompleted: 'diag.dream_import_preflight_completed',
  DreamImportTransactionCompleted: 'diag.dream_import_transaction_completed',
  LocalDataTransactionStarted: 'diag.local_data_transaction_started',
  LocalDataTransactionCompleted: 'diag.local_data_transaction_completed',
  LocalDataTransactionFailed: 'diag.local_data_transaction_failed',
  LocalDataTransactionRecovery: 'diag.local_data_transaction_recovery',
  StorageDiagnosticsRead: 'diag.storage_diagnostics_read',
  StorageAudioCleanupRequested: 'diag.storage_audio_cleanup_requested',
  StorageExportsDeleted: 'diag.storage_exports_deleted',
  StorageTranscriptionModelDeleted: 'diag.storage_transcription_model_deleted',
  StorageMigrationResult: 'diag.storage_migration_result',
  ArchiveHealthScanned: 'diag.archive_health_scanned',
  ArchiveHealthRepaired: 'diag.archive_health_repaired',
  ArchiveHealthMaintenance: 'diag.archive_health_maintenance',
  AudioCleanupMaintenance: 'diag.audio_cleanup_maintenance',
  LocalSurfaceLoad: 'diag.local_surface_load',
} as const;

export const OBS_EVENTS = {
  ...PRODUCT_EVENTS,
  ...DIAG_EVENTS,
} as const;

type CaptureEntryMode = 'default' | 'voice' | 'wake';
type CaptureSource = 'manual' | 'reminder';
type DreamSaveMode = 'create' | 'edit';
type SearchSurface = 'home' | 'archive';
type RestoreMode = 'replace' | 'merge';
type OnboardingPath = 'voice' | 'text' | 'no-dream';
type DreamDetailSource = 'home' | 'archive' | 'stats' | 'other';
/**
 * The pattern category, never the signal itself — `signal` is the symbol the
 * person's dreams are about, which §9 forbids collecting. The narrow type stops
 * a one-word edit from shipping it.
 */
type PatternKind = 'word' | 'theme' | 'symbol';
/**
 * Where a practice or grounding surface was entered from — two literals plus
 * `route.params?.entrySource` (union declared on `DreamPractice` in
 * `routes.ts`). Keep this in sync with the actual call sites: a union wider
 * than reality is as wrong as one narrower, just quieter.
 */
type EntrySource =
  | 'manual'
  | 'practice'
  | 'home'
  | 'stats'
  | 'detail'
  | 'onboarding'
  | 'reminder';

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

function trackEvent(name: string, context?: ObservabilityContext) {
  const sanitized = sanitizeContext(context);
  observability.trackEvent(name, sanitized);
  // diag.* events have no entry in the analytics guard, so they are dropped
  // here and stay in Sentry, where they belong.
  recordAnalyticsEvent(name, sanitized ?? {});
}

export function trackAppOpened() {
  trackEvent(PRODUCT_EVENTS.AppOpened);
}

export function trackOnboardingOpened() {
  trackEvent(PRODUCT_EVENTS.OnboardingOpened);
}

export function trackOnboardingCompleted(input: { path: OnboardingPath }) {
  trackEvent(PRODUCT_EVENTS.OnboardingCompleted, {
    path: input.path,
  });
}

// `dreamAgeDays` makes §9's "first old dream reopened" answerable — opening the
// dream you just wrote is not the revisit loop.
export function trackDreamDetailOpened(input: {
  dreamAgeDays: number;
  source: DreamDetailSource;
}) {
  trackEvent(PRODUCT_EVENTS.DreamDetailOpened, {
    dream_age_days: input.dreamAgeDays,
    source: input.source,
  });
}

export function trackMemoryOpened(input: { dreamCount: number }) {
  trackEvent(PRODUCT_EVENTS.MemoryOpened, {
    dream_count: input.dreamCount,
  });
}

export function trackPatternOpened(input: { kind: PatternKind }) {
  trackEvent(PRODUCT_EVENTS.PatternOpened, {
    kind: input.kind,
  });
}

export function trackPatternConfirmed(input: {
  kind: PatternKind;
  action: 'confirm' | 'reject';
}) {
  trackEvent(PRODUCT_EVENTS.PatternConfirmed, {
    kind: input.kind,
    action: input.action,
  });
}

export function trackBackupEnabled(input: { kind: 'local' | 'cloud' }) {
  trackEvent(PRODUCT_EVENTS.BackupEnabled, {
    kind: input.kind,
  });
}

export function trackCaptureStarted(input: {
  captureId: string;
  entryMode: CaptureEntryMode;
  autoStartedRecording: boolean;
  source?: CaptureSource;
}) {
  trackEvent(PRODUCT_EVENTS.CaptureStarted, {
    capture_id: input.captureId,
    entry_mode: input.entryMode,
    auto_started_recording: input.autoStartedRecording,
    source: input.source,
  });
}

export function trackDraftResumed(input: {
  resumeMode: CaptureEntryMode;
  hasAudio: boolean;
  hasText: boolean;
  source?: CaptureSource;
}) {
  trackEvent(PRODUCT_EVENTS.DraftResumed, {
    resume_mode: input.resumeMode,
    has_audio: input.hasAudio,
    has_text: input.hasText,
    source: input.source,
  });
}

// `captureId` correlates this to its `capture_started` (needed for "median time
// to first Save"). `dreamIndex` is a content-free count that makes the 1→2
// transition — the earliest retention signal — visible.
export function trackDreamSaved(input: {
  captureId?: string;
  mode: DreamSaveMode;
  entryMode: CaptureEntryMode;
  hasAudio: boolean;
  hasText: boolean;
  dreamIndex?: number;
}) {
  trackEvent(PRODUCT_EVENTS.DreamSaved, {
    capture_id: input.captureId,
    mode: input.mode,
    entry_mode: input.entryMode,
    has_audio: input.hasAudio,
    has_text: input.hasText,
    dream_index: input.dreamIndex,
  });
}

export function trackReminderToggled(input: { enabled: boolean }) {
  trackEvent(PRODUCT_EVENTS.ReminderToggled, {
    enabled: input.enabled,
  });
}

export function trackBiometricLockToggled(input: { enabled: boolean }) {
  trackEvent(PRODUCT_EVENTS.BiometricLockToggled, {
    enabled: input.enabled,
  });
}

export function trackPracticeHubOpened(input: {
  focus: 'lucid' | 'nightmares';
  source?: EntrySource;
}) {
  trackEvent(PRODUCT_EVENTS.PracticeHubOpened, {
    focus: input.focus,
    source: input.source,
  });
}

export function trackLucidPracticeStarted(input: { source?: EntrySource }) {
  trackEvent(PRODUCT_EVENTS.LucidPracticeStarted, {
    source: input.source,
  });
}

export function trackRealityCheckCompleted(input: { source?: EntrySource }) {
  trackEvent(PRODUCT_EVENTS.RealityCheckCompleted, {
    source: input.source,
  });
}

export function trackWbtbAlarmUsed(input: { source?: EntrySource }) {
  trackEvent(PRODUCT_EVENTS.WbtbAlarmUsed, {
    source: input.source,
  });
}

export function trackNightmareRescriptingStarted(input: {
  source?: EntrySource;
}) {
  trackEvent(PRODUCT_EVENTS.NightmareRescriptingStarted, {
    source: input.source,
  });
}

export function trackNightmareRescriptingCompleted(input: {
  source?: EntrySource;
}) {
  trackEvent(PRODUCT_EVENTS.NightmareRescriptingCompleted, {
    source: input.source,
  });
}

export function trackGroundingOpened(input: { source?: EntrySource }) {
  trackEvent(PRODUCT_EVENTS.GroundingOpened, {
    source: input.source,
  });
}

export function trackDreamSignSaved(input: {
  count: number;
  source?: EntrySource;
}) {
  trackEvent(PRODUCT_EVENTS.DreamSignSaved, {
    count: input.count,
    source: input.source,
  });
}

export function trackSearchUsed(input: {
  surface: SearchSurface;
  queryLength: number;
  resultCount: number;
}) {
  trackEvent(PRODUCT_EVENTS.SearchUsed, {
    surface: input.surface,
    query_length: input.queryLength,
    result_count: input.resultCount,
  });
}

export function trackFiltersApplied(input: {
  surface: SearchSurface;
  filterCount: number;
}) {
  trackEvent(PRODUCT_EVENTS.FiltersApplied, {
    surface: input.surface,
    filter_count: input.filterCount,
  });
}

export function trackBackupExportStarted() {
  trackEvent(PRODUCT_EVENTS.BackupExportStarted);
}

export function trackBackupExportCompleted(input: { dreamCount: number }) {
  trackEvent(PRODUCT_EVENTS.BackupExportCompleted, {
    dream_count: input.dreamCount,
  });
}

export function trackRestoreStarted(input: { mode: RestoreMode }) {
  trackEvent(PRODUCT_EVENTS.RestoreStarted, {
    mode: input.mode,
  });
}

export function trackRestoreCompleted(input: {
  mode: RestoreMode;
  importedDreamCount: number;
  resultingDreamCount: number;
}) {
  trackEvent(PRODUCT_EVENTS.RestoreCompleted, {
    mode: input.mode,
    imported_dream_count: input.importedDreamCount,
    resulting_dream_count: input.resultingDreamCount,
  });
}
