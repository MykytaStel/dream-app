import { observability } from './index';
import { ObservabilityContext } from './types';

export const OBS_EVENTS = {
  AppOpened: 'app_opened',
  GlobalJsError: 'global_js_error',
  CaptureStarted: 'capture_started',
  DraftResumed: 'draft_resumed',
  DreamSaved: 'dream_saved',
  ReminderToggled: 'reminder_toggled',
  PracticeHubOpened: 'practice_hub_opened',
  LucidPracticeStarted: 'lucid_practice_started',
  RealityCheckCompleted: 'reality_check_completed',
  WbtbAlarmUsed: 'wbtb_alarm_used',
  NightmareRescriptingStarted: 'nightmare_rescripting_started',
  NightmareRescriptingCompleted: 'nightmare_rescripting_completed',
  GroundingOpened: 'grounding_opened',
  DreamSignSaved: 'dream_sign_saved',
  SearchUsed: 'search_used',
  FiltersApplied: 'filters_applied',
  BackupExportStarted: 'backup_export_started',
  BackupExportCompleted: 'backup_export_completed',
  RestoreStarted: 'restore_started',
  RestoreCompleted: 'restore_completed',
} as const;

type CaptureEntryMode = 'default' | 'voice' | 'wake';
type CaptureSource = 'manual' | 'reminder';
type DreamSaveMode = 'create' | 'edit';
type SearchSurface = 'home' | 'archive';
type RestoreMode = 'replace' | 'merge';

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

function trackEvent(name: string, context?: ObservabilityContext) {
  observability.trackEvent(name, sanitizeContext(context));
}

export function trackCaptureStarted(input: {
  entryMode: CaptureEntryMode;
  autoStartedRecording: boolean;
  source?: CaptureSource;
}) {
  trackEvent(OBS_EVENTS.CaptureStarted, {
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
  trackEvent(OBS_EVENTS.DraftResumed, {
    resume_mode: input.resumeMode,
    has_audio: input.hasAudio,
    has_text: input.hasText,
    source: input.source,
  });
}

export function trackDreamSaved(input: {
  mode: DreamSaveMode;
  entryMode: CaptureEntryMode;
  hasAudio: boolean;
  hasText: boolean;
}) {
  trackEvent(OBS_EVENTS.DreamSaved, {
    mode: input.mode,
    entry_mode: input.entryMode,
    has_audio: input.hasAudio,
    has_text: input.hasText,
  });
}

export function trackReminderToggled(input: { enabled: boolean }) {
  trackEvent(OBS_EVENTS.ReminderToggled, {
    enabled: input.enabled,
  });
}

export function trackPracticeHubOpened(input: { focus: 'lucid' | 'nightmares'; source?: string }) {
  trackEvent(OBS_EVENTS.PracticeHubOpened, {
    focus: input.focus,
    source: input.source,
  });
}

export function trackLucidPracticeStarted(input: { source?: string }) {
  trackEvent(OBS_EVENTS.LucidPracticeStarted, {
    source: input.source,
  });
}

export function trackRealityCheckCompleted(input: { source?: string }) {
  trackEvent(OBS_EVENTS.RealityCheckCompleted, {
    source: input.source,
  });
}

export function trackWbtbAlarmUsed(input: { source?: string }) {
  trackEvent(OBS_EVENTS.WbtbAlarmUsed, {
    source: input.source,
  });
}

export function trackNightmareRescriptingStarted(input: { source?: string }) {
  trackEvent(OBS_EVENTS.NightmareRescriptingStarted, {
    source: input.source,
  });
}

export function trackNightmareRescriptingCompleted(input: { source?: string }) {
  trackEvent(OBS_EVENTS.NightmareRescriptingCompleted, {
    source: input.source,
  });
}

export function trackGroundingOpened(input: { source?: string }) {
  trackEvent(OBS_EVENTS.GroundingOpened, {
    source: input.source,
  });
}

export function trackDreamSignSaved(input: { count: number; source?: string }) {
  trackEvent(OBS_EVENTS.DreamSignSaved, {
    count: input.count,
    source: input.source,
  });
}

export function trackSearchUsed(input: {
  surface: SearchSurface;
  queryLength: number;
  resultCount: number;
}) {
  trackEvent(OBS_EVENTS.SearchUsed, {
    surface: input.surface,
    query_length: input.queryLength,
    result_count: input.resultCount,
  });
}

export function trackFiltersApplied(input: {
  surface: SearchSurface;
  filterCount: number;
}) {
  trackEvent(OBS_EVENTS.FiltersApplied, {
    surface: input.surface,
    filter_count: input.filterCount,
  });
}

export function trackBackupExportStarted() {
  trackEvent(OBS_EVENTS.BackupExportStarted);
}

export function trackBackupExportCompleted(input: { dreamCount: number }) {
  trackEvent(OBS_EVENTS.BackupExportCompleted, {
    dream_count: input.dreamCount,
  });
}

export function trackRestoreStarted(input: { mode: RestoreMode }) {
  trackEvent(OBS_EVENTS.RestoreStarted, {
    mode: input.mode,
  });
}

export function trackRestoreCompleted(input: {
  mode: RestoreMode;
  importedDreamCount: number;
  resultingDreamCount: number;
}) {
  trackEvent(OBS_EVENTS.RestoreCompleted, {
    mode: input.mode,
    imported_dream_count: input.importedDreamCount,
    resulting_dream_count: input.resultingDreamCount,
  });
}
