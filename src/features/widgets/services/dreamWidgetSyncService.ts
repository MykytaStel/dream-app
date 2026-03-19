import { getStoredLocale } from '../../../i18n/localeStore';
import { AppLocale } from '../../../i18n/types';
import { kv } from '../../../services/storage/mmkv';
import {
  DREAM_DRAFT_STORAGE_KEY,
  DREAMS_STORAGE_KEY,
  WIDGET_SNAPSHOT_STORAGE_KEY,
} from '../../../services/storage/keys';
import { Dream } from '../../dreams/model/dream';
import { sanitizeDream, sortDreamsStable } from '../../dreams/model/dreamRules';
import { buildDreamWidgetSnapshot, type DreamWidgetDraftSnapshot } from '../model/dreamWidget';
import { publishDreamWidgetSnapshot } from './dreamWidgetHostService';

type DreamWidgetSyncInput = {
  dreams?: Dream[];
  draftSnapshot?: DreamWidgetDraftSnapshot | null;
  locale?: AppLocale;
};

type DraftRecord = Partial<{
  title: string;
  text: string;
  audioUri: string;
  entryMode: 'default' | 'voice' | 'wake';
  updatedAt: number;
  mood: unknown;
  lucidity: number;
  wakeEmotions: unknown[];
  stressLevel: number;
  preSleepEmotions: unknown[];
  alcoholTaken: boolean;
  caffeineLate: boolean;
  medications: string;
  importantEvents: string;
  healthNotes: string;
  tags: unknown[];
}>;

let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingInput: DreamWidgetSyncInput = {};

function readStoredDreams(): Dream[] {
  const raw = kv.getString(DREAMS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Dream[];
    return sortDreamsStable(parsed.map(sanitizeDream));
  } catch {
    return [];
  }
}

function normalizeEntryMode(value: unknown): DreamWidgetDraftSnapshot['resumeMode'] | undefined {
  return value === 'default' || value === 'voice' || value === 'wake' ? value : undefined;
}

function readStoredDraftSnapshot(): DreamWidgetDraftSnapshot | null {
  const raw = kv.getString(DREAM_DRAFT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const draft = JSON.parse(raw) as DraftRecord;
    const title = typeof draft.title === 'string' ? draft.title.trim() : '';
    const text = typeof draft.text === 'string' ? draft.text.trim() : '';
    const hasAudio = typeof draft.audioUri === 'string' && Boolean(draft.audioUri.trim());
    const hasText = Boolean(title || text);
    const wakeEmotionCount = Array.isArray(draft.wakeEmotions) ? draft.wakeEmotions.length : 0;
    const preSleepEmotionCount = Array.isArray(draft.preSleepEmotions)
      ? draft.preSleepEmotions.length
      : 0;
    const tagCount = Array.isArray(draft.tags) ? draft.tags.length : 0;
    const hasWakeSignals =
      Boolean(draft.mood) || typeof draft.lucidity === 'number' || wakeEmotionCount > 0;
    const hasContext =
      typeof draft.stressLevel === 'number' ||
      preSleepEmotionCount > 0 ||
      typeof draft.alcoholTaken === 'boolean' ||
      typeof draft.caffeineLate === 'boolean' ||
      Boolean(draft.medications?.trim()) ||
      Boolean(draft.importantEvents?.trim()) ||
      Boolean(draft.healthNotes?.trim());

    if (!hasAudio && !hasText && !hasWakeSignals && !hasContext && tagCount === 0) {
      return null;
    }

    return {
      resumeMode:
        normalizeEntryMode(draft.entryMode) ??
        (hasWakeSignals || hasContext ? 'wake' : hasAudio && !hasText ? 'voice' : 'default'),
      hasAudio,
      hasText,
      wordCount: text ? text.split(/\s+/).length : 0,
      hasWakeSignals,
      hasContext,
      hasTags: tagCount > 0,
      updatedAt:
        typeof draft.updatedAt === 'number' && Number.isFinite(draft.updatedAt)
          ? draft.updatedAt
          : undefined,
    };
  } catch {
    return null;
  }
}

export async function syncDreamWidgetSnapshot(input: DreamWidgetSyncInput = {}) {
  const snapshot = buildDreamWidgetSnapshot({
    dreams: input.dreams ?? readStoredDreams(),
    draftSnapshot:
      input.draftSnapshot !== undefined ? input.draftSnapshot : readStoredDraftSnapshot(),
    locale: input.locale ?? getStoredLocale(),
  });
  const raw = JSON.stringify(snapshot);
  kv.set(WIDGET_SNAPSHOT_STORAGE_KEY, raw);
  await publishDreamWidgetSnapshot(snapshot);
  return snapshot;
}

export function scheduleDreamWidgetSync(input: DreamWidgetSyncInput = {}) {
  pendingInput = {
    ...pendingInput,
    ...input,
  };

  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  syncTimeout = setTimeout(() => {
    const nextInput = pendingInput;
    pendingInput = {};
    syncTimeout = null;
    void syncDreamWidgetSnapshot(nextInput);
  }, 120);
}
