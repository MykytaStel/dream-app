import { kv } from '../../../services/storage/mmkv';
import { Dream } from '../model/dream';

const KEY = 'dreams';
const PREVIEW_DREAM_ID = 'preview-dream-kaleidoskop';

export function listDreams(): Dream[] {
  const raw = kv.getString(KEY);
  return raw ? (JSON.parse(raw) as Dream[]) : [];
}

export function saveDream(d: Dream) {
  const all = listDreams();
  const idx = all.findIndex(x => x.id === d.id);
  if (idx >= 0) all[idx] = d; else all.unshift(d);
  kv.set(KEY, JSON.stringify(all));
}

export function getDream(id: string): Dream | undefined {
  return listDreams().find(x => x.id === id);
}

export function deleteDream(id: string) {
  const next = listDreams().filter(dream => dream.id !== id);
  kv.set(KEY, JSON.stringify(next));
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
  kv.set(KEY, JSON.stringify(next));
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
  kv.set(KEY, JSON.stringify(next));
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
