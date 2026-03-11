import { kv } from '../../../services/storage/mmkv';
import { DREAMS_STORAGE_KEY } from '../../../services/storage/keys';
import { Dream, DreamTranscriptSource, DreamTranscriptStatus } from '../model/dream';
import { DreamAnalysisRecord } from '../../analysis/model/dreamAnalysis';
import {
  clearDreamDeletionTombstone,
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

const PREVIEW_DREAM_ID = 'preview-dream-kaleidoskop';
let dreamCache: Dream[] | null = null;
let dreamCacheRaw: string | null = null;

export function listDreams(): Dream[] {
  const raw = kv.getString(DREAMS_STORAGE_KEY);
  if (!raw) {
    dreamCache = [];
    dreamCacheRaw = null;
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
  dreamCache = normalized;
  dreamCacheRaw = raw;
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
