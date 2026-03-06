import { kv } from '../../../services/storage/mmkv';
import { DREAMS_STORAGE_KEY } from '../../../services/storage/keys';
import { Dream, DreamTranscriptSource, DreamTranscriptStatus } from '../model/dream';
import {
  sanitizeDream,
  sortDreamsStable,
  validateDreamForSave,
} from '../model/dreamRules';

const PREVIEW_DREAM_ID = 'preview-dream-kaleidoskop';

export function listDreams(): Dream[] {
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

function persistDreams(dreams: Dream[]) {
  kv.set(DREAMS_STORAGE_KEY, JSON.stringify(sortDreamsStable(dreams.map(sanitizeDream))));
}

function updateDreamById(id: string, updater: (dream: Dream) => Dream) {
  const all = listDreams();
  const idx = all.findIndex(dream => dream.id === id);
  if (idx < 0) {
    throw new Error(`Dream not found: ${id}`);
  }

  const nextDream = sanitizeDream(updater(all[idx]));
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
  const nextDream = sanitizeDream(d);
  const idx = all.findIndex(x => x.id === nextDream.id);

  if (idx >= 0) {
    all[idx] = nextDream;
  } else {
    all.unshift(nextDream);
  }

  persistDreams(all);
}

export function getDream(id: string): Dream | undefined {
  return listDreams().find(x => x.id === id);
}

export function deleteDream(id: string) {
  persistDreams(listDreams().filter(dream => dream.id !== id));
}

export function archiveDream(id: string) {
  const next = listDreams().map(dream =>
    dream.id === id
      ? {
          ...dream,
          archivedAt: Date.now(),
        }
      : dream,
  );
  persistDreams(next);
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
