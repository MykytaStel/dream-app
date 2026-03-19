import { kv } from '../../../services/storage/mmkv';
import {
  DREAMS_INDEX_STORAGE_KEY,
  DREAMS_META_STORAGE_KEY,
  DREAMS_STORAGE_KEY,
} from '../../../services/storage/keys';
import { Dream, DreamTranscriptSource, DreamTranscriptStatus } from '../model/dream';
import { DreamAnalysisRecord } from '../../analysis/model/dreamAnalysis';
import {
  clearDreamDeletionTombstone,
  applyRemoteDreamDeletionTombstone,
  saveDreamDeletionTombstone,
} from './dreamDeletionTombstonesRepository';
import {
  DreamSyncBundle,
  hydrateDreamFromSyncBundle,
} from '../../../services/api/contracts/dreamSync';
import {
  sanitizeDream,
  sortDreamsStable,
  validateDreamForSave,
} from '../model/dreamRules';
import { reconcileDerivedReviewState } from '../../stats/services/reviewShelfStateService';
import { scheduleDreamWidgetSync } from '../../widgets/services/dreamWidgetSyncService';

const PREVIEW_DREAM_ID = 'preview-dream-kaleidoskop';
let dreamCache: Dream[] | null = null;
let dreamCacheRaw: string | null = null;
let dreamIndexCache: DreamListItem[] | null = null;
let dreamIndexCacheRaw: string | null = null;
let dreamMetaCache: DreamsMeta | null = null;
let dreamMetaCacheRaw: string | null = null;

export type DreamListItem = {
  id: string;
  createdAt: number;
  updatedAt?: number;
  archivedAt?: number;
  starredAt?: number;
  sleepDate?: string;
  title?: string;
  mood?: Dream['mood'];
  hasAudio: boolean;
  transcriptPreview?: string;
  textPreview?: string;
};

export type DreamsMeta = {
  totalCount: number;
  activeCount: number;
  archivedCount: number;
  starredCount: number;
  audioOnlyCount: number;
  latestSleepDate?: string;
  monthKeys: string[];
};

function toLocalDateKey(epoch: number) {
  const date = new Date(epoch);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function getDreamMonthKey(dream: Pick<Dream, 'createdAt' | 'sleepDate'>) {
  const dateKey = dream.sleepDate || toLocalDateKey(dream.createdAt);
  return dateKey.slice(0, 7);
}

function buildDreamListItem(dream: Dream): DreamListItem {
  const textPreview = dream.text?.trim() || undefined;
  const transcriptPreview = dream.transcript?.trim() || undefined;

  return {
    id: dream.id,
    createdAt: dream.createdAt,
    updatedAt: dream.updatedAt,
    archivedAt: dream.archivedAt,
    starredAt: dream.starredAt,
    sleepDate: dream.sleepDate,
    title: dream.title?.trim() || undefined,
    mood: dream.mood,
    hasAudio: Boolean(dream.audioUri?.trim()),
    transcriptPreview,
    textPreview,
  };
}

function buildDreamsMeta(dreams: Dream[]): DreamsMeta {
  const monthKeys = Array.from(new Set(dreams.map(getDreamMonthKey))).sort((a, b) =>
    b.localeCompare(a),
  );

  return {
    totalCount: dreams.length,
    activeCount: dreams.filter(dream => typeof dream.archivedAt !== 'number').length,
    archivedCount: dreams.filter(dream => typeof dream.archivedAt === 'number').length,
    starredCount: dreams.filter(dream => typeof dream.starredAt === 'number').length,
    audioOnlyCount: dreams.filter(
      dream =>
        Boolean(dream.audioUri?.trim()) &&
        !dream.text?.trim() &&
        !dream.transcript?.trim(),
    ).length,
    latestSleepDate: dreams[0]?.sleepDate,
    monthKeys,
  };
}

function persistDreamIndex(dreams: Dream[]) {
  const index = dreams.map(buildDreamListItem);
  const raw = JSON.stringify(index);
  kv.set(DREAMS_INDEX_STORAGE_KEY, raw);
  dreamIndexCache = index;
  dreamIndexCacheRaw = raw;
}

function persistDreamsMeta(dreams: Dream[]) {
  const meta = buildDreamsMeta(dreams);
  const raw = JSON.stringify(meta);
  kv.set(DREAMS_META_STORAGE_KEY, raw);
  dreamMetaCache = meta;
  dreamMetaCacheRaw = raw;
}

function resetDreamIndexCache() {
  dreamIndexCache = null;
  dreamIndexCacheRaw = null;
}

function resetDreamMetaCache() {
  dreamMetaCache = null;
  dreamMetaCacheRaw = null;
}

export function listDreams(): Dream[] {
  const raw = kv.getString(DREAMS_STORAGE_KEY);
  if (!raw) {
    dreamCache = [];
    dreamCacheRaw = null;
    kv.remove(DREAMS_INDEX_STORAGE_KEY);
    kv.remove(DREAMS_META_STORAGE_KEY);
    resetDreamIndexCache();
    resetDreamMetaCache();
    return [];
  }

  if (dreamCache && dreamCacheRaw === raw) {
    return dreamCache;
  }

  try {
    const parsed = JSON.parse(raw) as Dream[];
    const normalized = sortDreamsStable(parsed.map(sanitizeDream));
    dreamCache = normalized;
    dreamCacheRaw = raw;
    return normalized;
  } catch {
    dreamCache = [];
    dreamCacheRaw = raw;
    return [];
  }
}

function persistDreams(dreams: Dream[]) {
  const normalized = sortDreamsStable(dreams.map(sanitizeDream));
  const raw = JSON.stringify(normalized);
  kv.set(DREAMS_STORAGE_KEY, raw);
  persistDreamIndex(normalized);
  persistDreamsMeta(normalized);
  dreamCache = normalized;
  dreamCacheRaw = raw;
  scheduleDreamWidgetSync({ dreams: normalized });
  // Defer shelf reconciliation — not needed synchronously and can be expensive with many dreams
  setTimeout(() => reconcileDerivedReviewState(normalized), 0);
}

function normalizeDreamListItem(raw: Partial<DreamListItem>): DreamListItem | null {
  if (!raw.id || typeof raw.id !== 'string') {
    return null;
  }

  const createdAt =
    typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt)
      ? raw.createdAt
      : undefined;
  if (!createdAt) {
    return null;
  }

  return {
    id: raw.id,
    createdAt,
    updatedAt:
      typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt)
        ? raw.updatedAt
        : undefined,
    archivedAt:
      typeof raw.archivedAt === 'number' && Number.isFinite(raw.archivedAt)
        ? raw.archivedAt
        : undefined,
    starredAt:
      typeof raw.starredAt === 'number' && Number.isFinite(raw.starredAt)
        ? raw.starredAt
        : undefined,
    sleepDate: typeof raw.sleepDate === 'string' ? raw.sleepDate : undefined,
    title: typeof raw.title === 'string' ? raw.title : undefined,
    mood:
      raw.mood === 'neutral' || raw.mood === 'positive' || raw.mood === 'negative'
        ? raw.mood
        : undefined,
    hasAudio: Boolean(raw.hasAudio),
    transcriptPreview:
      typeof raw.transcriptPreview === 'string' ? raw.transcriptPreview : undefined,
    textPreview: typeof raw.textPreview === 'string' ? raw.textPreview : undefined,
  };
}

export function listDreamListItems(): DreamListItem[] {
  const raw = kv.getString(DREAMS_INDEX_STORAGE_KEY);
  if (!raw) {
    const dreams = listDreams();
    persistDreamIndex(dreams);
    return dreamIndexCache ?? [];
  }

  if (dreamIndexCache && dreamIndexCacheRaw === raw) {
    return dreamIndexCache;
  }

  try {
    const parsed = JSON.parse(raw) as Array<Partial<DreamListItem>>;
    const normalized = parsed
      .map(normalizeDreamListItem)
      .filter((item): item is DreamListItem => Boolean(item))
      .sort((left, right) => {
        const leftUpdatedAt = left.updatedAt ?? left.createdAt;
        const rightUpdatedAt = right.updatedAt ?? right.createdAt;
        return rightUpdatedAt - leftUpdatedAt;
      });
    dreamIndexCache = normalized;
    dreamIndexCacheRaw = raw;
    return normalized;
  } catch {
    resetDreamIndexCache();
    const dreams = listDreams();
    persistDreamIndex(dreams);
    return dreamIndexCache ?? [];
  }
}

function normalizeDreamsMeta(raw: Partial<DreamsMeta>): DreamsMeta | null {
  if (typeof raw.totalCount !== 'number' || !Array.isArray(raw.monthKeys)) {
    return null;
  }

  return {
    totalCount: raw.totalCount,
    activeCount: typeof raw.activeCount === 'number' ? raw.activeCount : 0,
    archivedCount: typeof raw.archivedCount === 'number' ? raw.archivedCount : 0,
    starredCount: typeof raw.starredCount === 'number' ? raw.starredCount : 0,
    audioOnlyCount: typeof raw.audioOnlyCount === 'number' ? raw.audioOnlyCount : 0,
    latestSleepDate:
      typeof raw.latestSleepDate === 'string' ? raw.latestSleepDate : undefined,
    monthKeys: raw.monthKeys.filter((value): value is string => typeof value === 'string'),
  };
}

export function getDreamsMeta(): DreamsMeta {
  const raw = kv.getString(DREAMS_META_STORAGE_KEY);
  if (!raw) {
    const dreams = listDreams();
    persistDreamsMeta(dreams);
    return dreamMetaCache ?? buildDreamsMeta(dreams);
  }

  if (dreamMetaCache && dreamMetaCacheRaw === raw) {
    return dreamMetaCache;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DreamsMeta>;
    const normalized = normalizeDreamsMeta(parsed);
    if (!normalized) {
      throw new Error('invalid-dreams-meta');
    }

    dreamMetaCache = normalized;
    dreamMetaCacheRaw = raw;
    return normalized;
  } catch {
    resetDreamMetaCache();
    const dreams = listDreams();
    persistDreamsMeta(dreams);
    return dreamMetaCache ?? buildDreamsMeta(dreams);
  }
}

export function replaceAllDreams(dreams: Dream[]) {
  persistDreams(dreams);
}

function removeUndefinedSyncError<T extends Dream>(dream: T): T {
  if (dream.syncError) {
    return dream;
  }

  const nextDream = { ...dream };
  delete nextDream.syncError;
  return nextDream as T;
}

function markDreamAsLocalChange(dream: Dream, changedAt = Date.now()) {
  return removeUndefinedSyncError({
    ...dream,
    updatedAt: Math.max(changedAt, dream.createdAt),
    syncStatus: 'local',
    syncError: undefined,
  });
}

function updateDreamById(
  id: string,
  updater: (dream: Dream) => Dream,
  options: { markLocalChange?: boolean } = {},
) {
  const all = listDreams();
  const idx = all.findIndex(dream => dream.id === id);
  if (idx < 0) {
    throw new Error(`Dream not found: ${id}`);
  }

  const nextDream = sanitizeDream(
    options.markLocalChange === false
      ? updater(all[idx])
      : markDreamAsLocalChange(updater(all[idx])),
  );
  all[idx] = nextDream;
  persistDreams(all);
  return nextDream;
}

export function saveDream(d: Dream) {
  const validationError = validateDreamForSave(d);
  if (validationError) {
    throw new Error(validationError);
  }

  const all = listDreams();
  const idx = all.findIndex(x => x.id === d.id);
  const existingDream = idx >= 0 ? all[idx] : undefined;
  const nextDream = sanitizeDream(
    markDreamAsLocalChange(
      {
        ...existingDream,
        ...d,
        audioRemotePath: d.audioRemotePath ?? existingDream?.audioRemotePath,
        lastSyncedAt: d.lastSyncedAt ?? existingDream?.lastSyncedAt,
      },
      existingDream ? Date.now() : (d.updatedAt ?? d.createdAt),
    ),
  );

  if (idx >= 0) {
    all[idx] = nextDream;
  } else {
    all.unshift(nextDream);
  }

  persistDreams(all);
  clearDreamDeletionTombstone(d.id);
}

export function getDream(id: string): Dream | undefined {
  return listDreams().find(x => x.id === id);
}

export function deleteDream(id: string) {
  saveDreamDeletionTombstone(id);
  persistDreams(listDreams().filter(dream => dream.id !== id));
}

export function applyRemoteDreamDeletion(id: string, deletedAt: number) {
  persistDreams(listDreams().filter(dream => dream.id !== id));
  return applyRemoteDreamDeletionTombstone(id, deletedAt);
}

export function archiveDream(id: string) {
  const next = listDreams().map(dream =>
    dream.id === id
      ? markDreamAsLocalChange({
          ...dream,
          archivedAt: Date.now(),
        })
      : dream,
  );
  persistDreams(next);
  return next.find(dream => dream.id === id);
}

export function starDream(id: string) {
  return updateDreamById(id, dream => ({
    ...dream,
    starredAt: Date.now(),
  }));
}

export function unstarDream(id: string) {
  return updateDreamById(id, dream => {
    const nextDream: Dream = { ...dream, starredAt: undefined };
    delete nextDream.starredAt;
    return nextDream;
  });
}

export function unarchiveDream(id: string) {
  const next = listDreams().map(dream => {
    if (dream.id !== id) {
      return dream;
    }

    const nextDream: Dream = { ...dream, archivedAt: undefined };
    delete nextDream.archivedAt;
    return nextDream;
  });
  persistDreams(next);
  return next.find(dream => dream.id === id);
}

export function updateDreamTranscriptState(
  id: string,
  input: {
    transcriptStatus: DreamTranscriptStatus;
    transcript?: string;
    transcriptSource?: DreamTranscriptSource;
    transcriptUpdatedAt?: number;
  },
) {
  return updateDreamById(id, dream => {
    const nextDream: Dream = {
      ...dream,
      transcriptStatus: input.transcriptStatus,
      transcriptUpdatedAt: input.transcriptUpdatedAt ?? Date.now(),
    };

    if (typeof input.transcript === 'string') {
      nextDream.transcript = input.transcript;
    }

    if (input.transcriptSource) {
      nextDream.transcriptSource = input.transcriptSource;
    }

    return nextDream;
  });
}

export function saveDreamTranscriptEdit(id: string, transcript: string) {
  return updateDreamById(id, dream => ({
    ...dream,
    transcript,
    transcriptStatus: 'ready',
    transcriptSource: 'edited',
    transcriptUpdatedAt: Date.now(),
  }));
}

export function clearDreamTranscript(id: string) {
  return updateDreamById(id, dream => {
    const nextDream: Dream = {
      ...dream,
      transcript: undefined,
      transcriptSource: undefined,
      transcriptUpdatedAt: undefined,
      transcriptStatus: dream.audioUri?.trim() ? 'idle' : undefined,
    };

    delete nextDream.transcript;
    delete nextDream.transcriptSource;
    delete nextDream.transcriptUpdatedAt;

    if (!nextDream.transcriptStatus) {
      delete nextDream.transcriptStatus;
    }

    return nextDream;
  });
}

export function setDreamAudioUri(id: string, audioUri: string) {
  return updateDreamById(id, dream => ({
    ...dream,
    audioUri,
  }));
}

export function saveDreamAnalysis(id: string, analysis: DreamAnalysisRecord) {
  return updateDreamById(id, dream => ({
    ...dream,
    analysis,
  }));
}

export function clearDreamAnalysis(id: string) {
  return updateDreamById(id, dream => {
    const nextDream: Dream = {
      ...dream,
      analysis: undefined,
    };

    delete nextDream.analysis;
    return nextDream;
  });
}

export function markDreamSyncing(id: string) {
  return updateDreamById(
    id,
    dream =>
      removeUndefinedSyncError({
        ...dream,
        syncStatus: 'syncing',
        syncError: undefined,
      }),
    { markLocalChange: false },
  );
}

export function markDreamSynced(
  id: string,
  input: { audioRemotePath?: string; syncedAt?: number } = {},
) {
  const syncedAt = input.syncedAt ?? Date.now();

  return updateDreamById(
    id,
    dream =>
      removeUndefinedSyncError({
        ...dream,
        audioRemotePath: input.audioRemotePath ?? dream.audioRemotePath,
        syncStatus: 'synced',
        lastSyncedAt: syncedAt,
        syncError: undefined,
      }),
    { markLocalChange: false },
  );
}

export function markDreamSyncError(id: string, errorMessage?: string) {
  return updateDreamById(
    id,
    dream => ({
      ...dream,
      syncStatus: 'error',
      syncError: errorMessage?.trim() || 'sync-error',
    }),
    { markLocalChange: false },
  );
}

export function upsertDreamFromSyncBundle(bundle: DreamSyncBundle) {
  const nextDream = hydrateDreamFromSyncBundle(bundle);
  const all = listDreams();
  const idx = all.findIndex(dream => dream.id === nextDream.id);

  if (idx >= 0) {
    all[idx] = nextDream;
  } else {
    all.unshift(nextDream);
  }

  persistDreams(all);
  clearDreamDeletionTombstone(nextDream.id);
  return nextDream;
}

export function ensurePreviewDream() {
  if (!__DEV__) {
    return;
  }

  const all = listDreams();
  if (all.some(dream => dream.id === PREVIEW_DREAM_ID)) {
    return;
  }

  const today = new Date();
  const offset = today.getTimezoneOffset() * 60_000;
  const sleepDate = new Date(today.getTime() - offset).toISOString().slice(0, 10);

  saveDream({
    id: PREVIEW_DREAM_ID,
    createdAt: Date.now() - 1000 * 60 * 45,
    sleepDate,
    title: 'Staircase over the sea',
    text:
      'I was climbing a narrow staircase made of blue glass, floating above a dark quiet sea. Each step lit up under my feet, and somewhere in the distance I could hear a city waking up. At the top there was a small room full of postcards from places I had never visited, but somehow remembered.',
    tags: ['ocean', 'glass', 'stairs', 'city'],
    mood: 'positive',
    sleepContext: {
      stressLevel: 1,
      alcoholTaken: false,
      caffeineLate: true,
      importantEvents: 'Late-night product planning and release prep.',
    },
  });
}
