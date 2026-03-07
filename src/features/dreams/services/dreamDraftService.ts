import { kv } from '../../../services/storage/mmkv';
import { DREAM_DRAFT_STORAGE_KEY } from '../../../services/storage/keys';
import { Mood, PreSleepEmotion, StressLevel, WakeEmotion } from '../model/dream';
import { normalizeTags } from '../model/dreamRules';

export type DreamDraft = {
  title: string;
  text: string;
  sleepDate: string;
  audioUri?: string;
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

function normalizeDraft(raw?: Partial<DreamDraft>): DreamDraft {
  return {
    title: raw?.title ?? '',
    text: raw?.text ?? '',
    sleepDate: raw?.sleepDate ?? '',
    audioUri: raw?.audioUri?.trim() || undefined,
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
  const normalized = normalizeDraft(draft);

  if (!hasDraftContent(normalized)) {
    kv.remove(DREAM_DRAFT_STORAGE_KEY);
    return;
  }

  kv.set(DREAM_DRAFT_STORAGE_KEY, JSON.stringify(normalized));
}

export function clearDreamDraft() {
  kv.remove(DREAM_DRAFT_STORAGE_KEY);
}
