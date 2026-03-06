import { kv } from '../../../services/storage/mmkv';
import { DREAMS_STORAGE_KEY } from '../../../services/storage/keys';
import { Dream } from '../model/dream';
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
