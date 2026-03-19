import { kv } from '../../../services/storage/mmkv';
import { DREAM_DRAFT_STORAGE_KEY } from '../../../services/storage/keys';
import { scheduleDreamWidgetSync } from '../../widgets/services/dreamWidgetSyncService';
import {
  Dream,
  DreamIntensity,
  LucidControlArea,
  LucidPracticeTechnique,
  LucidStabilizationAction,
  Mood,
  NightmareAftereffect,
  NightmareGroundingAction,
  NightmareRescriptStatus,
  PreSleepEmotion,
  StressLevel,
  WakeEmotion,
} from '../model/dream';
import { normalizeTags } from '../model/dreamRules';

export type DreamDraftEntryMode = 'default' | 'voice' | 'wake';

export type DreamDraft = {
  title: string;
  text: string;
  sleepDate: string;
  audioUri?: string;
  entryMode?: DreamDraftEntryMode;
  updatedAt?: number;
  mood?: Mood;
  dreamIntensity?: DreamIntensity;
  lucidity?: Dream['lucidity'];
  wakeEmotions?: WakeEmotion[];
  stressLevel?: StressLevel;
  preSleepEmotions?: PreSleepEmotion[];
  alcoholTaken?: boolean;
  caffeineLate?: boolean;
  medications: string;
  importantEvents: string;
  healthNotes: string;
  tags: string[];
  lucidTechnique?: LucidPracticeTechnique;
  dreamSigns?: string[];
  lucidTrigger?: string;
  controlAreas?: LucidControlArea[];
  stabilizationActions?: LucidStabilizationAction[];
  recallScore?: 1 | 2 | 3 | 4 | 5;
  nightmareExplicit?: boolean;
  nightmareDistress?: 1 | 2 | 3 | 4 | 5;
  nightmareRecurring?: boolean;
  nightmareRecurringKey?: string;
  nightmareWokeFromDream?: boolean;
  nightmareAftereffects?: NightmareAftereffect[];
  nightmareGroundingUsed?: NightmareGroundingAction[];
  nightmareRewrittenEnding?: string;
  nightmareRescriptStatus?: NightmareRescriptStatus;
};

export type DreamDraftSnapshot = {
  resumeMode: DreamDraftEntryMode;
  hasAudio: boolean;
  hasText: boolean;
  wordCount: number;
  hasWakeSignals: boolean;
  hasContext: boolean;
  hasTags: boolean;
  updatedAt?: number;
};

function isDreamDraftEntryMode(value: unknown): value is DreamDraftEntryMode {
  return value === 'default' || value === 'voice' || value === 'wake';
}

function hasDraftContext(draft: Pick<
  DreamDraft,
  | 'stressLevel'
  | 'preSleepEmotions'
  | 'alcoholTaken'
  | 'caffeineLate'
  | 'medications'
  | 'importantEvents'
  | 'healthNotes'
>) {
  return (
    typeof draft.stressLevel === 'number' ||
    Boolean(draft.preSleepEmotions?.length) ||
    typeof draft.alcoholTaken === 'boolean' ||
    typeof draft.caffeineLate === 'boolean' ||
    Boolean(draft.medications.trim()) ||
    Boolean(draft.importantEvents.trim()) ||
    Boolean(draft.healthNotes.trim())
  );
}

function normalizeDraft(raw?: Partial<DreamDraft>): DreamDraft {
  const normalized: DreamDraft = {
    title: raw?.title ?? '',
    text: raw?.text ?? '',
    sleepDate: raw?.sleepDate ?? '',
    audioUri: raw?.audioUri?.trim() || undefined,
    entryMode: isDreamDraftEntryMode(raw?.entryMode) ? raw.entryMode : undefined,
    updatedAt:
      typeof raw?.updatedAt === 'number' && Number.isFinite(raw.updatedAt)
        ? raw.updatedAt
        : undefined,
    mood: raw?.mood,
    dreamIntensity: raw?.dreamIntensity,
    lucidity:
      typeof raw?.lucidity === 'number'
        ? (Math.max(0, Math.min(3, Math.floor(raw.lucidity))) as 0 | 1 | 2 | 3)
        : undefined,
    wakeEmotions: Array.isArray(raw?.wakeEmotions)
      ? Array.from(new Set(raw.wakeEmotions))
      : undefined,
    stressLevel: raw?.stressLevel,
    preSleepEmotions: Array.isArray(raw?.preSleepEmotions)
      ? Array.from(new Set(raw.preSleepEmotions))
      : undefined,
    alcoholTaken: raw?.alcoholTaken,
    caffeineLate: raw?.caffeineLate,
    medications: raw?.medications ?? '',
    importantEvents: raw?.importantEvents ?? '',
    healthNotes: raw?.healthNotes ?? '',
    tags: normalizeTags(raw?.tags ?? []),
  };

  if (raw?.lucidTechnique) {
    normalized.lucidTechnique = raw.lucidTechnique;
  }

  if (Array.isArray(raw?.dreamSigns)) {
    const dreamSigns = Array.from(
      new Set(
        raw.dreamSigns
          .map(value => (typeof value === 'string' ? value.trim() : ''))
          .filter(Boolean),
      ),
    );
    if (dreamSigns.length) {
      normalized.dreamSigns = dreamSigns;
    }
  }

  if (raw?.lucidTrigger?.trim()) {
    normalized.lucidTrigger = raw.lucidTrigger;
  }

  if (Array.isArray(raw?.controlAreas) && raw.controlAreas.length) {
    normalized.controlAreas = Array.from(new Set(raw.controlAreas));
  }

  if (Array.isArray(raw?.stabilizationActions) && raw.stabilizationActions.length) {
    normalized.stabilizationActions = Array.from(new Set(raw.stabilizationActions));
  }

  if (typeof raw?.recallScore === 'number') {
    normalized.recallScore = Math.max(1, Math.min(5, Math.floor(raw.recallScore))) as
      | 1
      | 2
      | 3
      | 4
      | 5;
  }

  if (typeof raw?.nightmareExplicit === 'boolean') {
    normalized.nightmareExplicit = raw.nightmareExplicit;
  }

  if (typeof raw?.nightmareDistress === 'number') {
    normalized.nightmareDistress = Math.max(1, Math.min(5, Math.floor(raw.nightmareDistress))) as
      | 1
      | 2
      | 3
      | 4
      | 5;
  }

  if (typeof raw?.nightmareRecurring === 'boolean') {
    normalized.nightmareRecurring = raw.nightmareRecurring;
  }

  if (raw?.nightmareRecurringKey?.trim()) {
    normalized.nightmareRecurringKey = raw.nightmareRecurringKey;
  }

  if (typeof raw?.nightmareWokeFromDream === 'boolean') {
    normalized.nightmareWokeFromDream = raw.nightmareWokeFromDream;
  }

  if (Array.isArray(raw?.nightmareAftereffects) && raw.nightmareAftereffects.length) {
    normalized.nightmareAftereffects = Array.from(new Set(raw.nightmareAftereffects));
  }

  if (Array.isArray(raw?.nightmareGroundingUsed) && raw.nightmareGroundingUsed.length) {
    normalized.nightmareGroundingUsed = Array.from(new Set(raw.nightmareGroundingUsed));
  }

  if (raw?.nightmareRewrittenEnding?.trim()) {
    normalized.nightmareRewrittenEnding = raw.nightmareRewrittenEnding;
  }

  if (raw?.nightmareRescriptStatus) {
    normalized.nightmareRescriptStatus = raw.nightmareRescriptStatus;
  }

  return normalized;
}

function hasDraftContent(draft: DreamDraft) {
  return Boolean(
    draft.title.trim() ||
      draft.text.trim() ||
      draft.audioUri ||
      draft.mood ||
      typeof draft.lucidity === 'number' ||
      draft.wakeEmotions?.length ||
      draft.tags.length ||
      draft.medications.trim() ||
      draft.importantEvents.trim() ||
      draft.healthNotes.trim() ||
      typeof draft.stressLevel === 'number' ||
      draft.preSleepEmotions?.length ||
      typeof draft.alcoholTaken === 'boolean' ||
      typeof draft.caffeineLate === 'boolean' ||
      draft.dreamSigns?.length ||
      draft.lucidTrigger?.trim() ||
      draft.controlAreas?.length ||
      draft.stabilizationActions?.length ||
      typeof draft.recallScore === 'number' ||
      draft.lucidTechnique ||
      typeof draft.nightmareExplicit === 'boolean' ||
      typeof draft.nightmareDistress === 'number' ||
      typeof draft.nightmareRecurring === 'boolean' ||
      draft.nightmareRecurringKey?.trim() ||
      typeof draft.nightmareWokeFromDream === 'boolean' ||
      draft.nightmareAftereffects?.length ||
      draft.nightmareGroundingUsed?.length ||
      draft.nightmareRewrittenEnding?.trim() ||
      draft.nightmareRescriptStatus,
  );
}

export function getDreamDraft() {
  const raw = kv.getString(DREAM_DRAFT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return normalizeDraft(JSON.parse(raw) as Partial<DreamDraft>);
  } catch {
    return null;
  }
}

export function saveDreamDraft(draft: DreamDraft) {
  const normalized = normalizeDraft({
    ...draft,
    updatedAt:
      typeof draft.updatedAt === 'number' && Number.isFinite(draft.updatedAt)
        ? draft.updatedAt
        : Date.now(),
  });

  if (!hasDraftContent(normalized)) {
    kv.remove(DREAM_DRAFT_STORAGE_KEY);
    scheduleDreamWidgetSync({ draftSnapshot: null });
    return;
  }

  kv.set(DREAM_DRAFT_STORAGE_KEY, JSON.stringify(normalized));
  scheduleDreamWidgetSync({ draftSnapshot: getDreamDraftSnapshot(normalized) });
}

export function clearDreamDraft() {
  kv.remove(DREAM_DRAFT_STORAGE_KEY);
  scheduleDreamWidgetSync({ draftSnapshot: null });
}

export function getDreamDraftSnapshot(
  draft: DreamDraft | null | undefined = getDreamDraft(),
): DreamDraftSnapshot | null {
  if (!draft) {
    return null;
  }

  const text = draft.text.trim();
  const hasAudio = Boolean(draft.audioUri);
  const hasText = Boolean(text);
  const hasWakeSignals = Boolean(
    draft.mood || draft.wakeEmotions?.length || typeof draft.lucidity === 'number',
  );
  const hasContext = hasDraftContext(draft);
  const hasTags = draft.tags.length > 0;
  const wordCount = hasText ? text.split(/\s+/).length : 0;
  const resumeMode =
    draft.entryMode ??
    (hasWakeSignals || hasContext ? 'wake' : hasAudio && !hasText ? 'voice' : 'default');

  return {
    resumeMode,
    hasAudio,
    hasText,
    wordCount,
    hasWakeSignals,
    hasContext,
    hasTags,
    updatedAt: draft.updatedAt,
  };
}
