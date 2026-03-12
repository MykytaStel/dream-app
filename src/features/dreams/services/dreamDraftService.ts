import { kv } from '../../../services/storage/mmkv';
import { DREAM_DRAFT_STORAGE_KEY } from '../../../services/storage/keys';
import { Mood, PreSleepEmotion, StressLevel, WakeEmotion } from '../model/dream';
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
  wakeEmotions?: WakeEmotion[];
  stressLevel?: StressLevel;
  preSleepEmotions?: PreSleepEmotion[];
  alcoholTaken?: boolean;
  caffeineLate?: boolean;
  medications: string;
  importantEvents: string;
  healthNotes: string;
  tags: string[];
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
  return {
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
}

function hasDraftContent(draft: DreamDraft) {
  return Boolean(
    draft.title.trim() ||
      draft.text.trim() ||
      draft.audioUri ||
      draft.mood ||
      draft.wakeEmotions?.length ||
      draft.tags.length ||
      draft.medications.trim() ||
      draft.importantEvents.trim() ||
      draft.healthNotes.trim() ||
      typeof draft.stressLevel === 'number' ||
      draft.preSleepEmotions?.length ||
      typeof draft.alcoholTaken === 'boolean' ||
      typeof draft.caffeineLate === 'boolean',
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
    return;
  }

  kv.set(DREAM_DRAFT_STORAGE_KEY, JSON.stringify(normalized));
}

export function clearDreamDraft() {
  kv.remove(DREAM_DRAFT_STORAGE_KEY);
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
  const hasWakeSignals = Boolean(draft.mood || draft.wakeEmotions?.length);
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
