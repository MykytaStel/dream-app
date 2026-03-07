import { Dream, Mood, PreSleepEmotion, WakeEmotion } from '../model/dream';
import { replaceAllDreams, listDreams } from '../repository/dreamsRepository';

const SEED_ID_PREFIX = 'seed-dream-';
const DREAM_TITLE_FRAGMENTS = [
  'Glass hallway',
  'Ocean station',
  'Night market',
  'Red staircase',
  'Quiet forest',
  'Mirror apartment',
  'Falling city',
  'Sunlit tunnel',
];
const DREAM_TAG_GROUPS = [
  ['ocean', 'stairs', 'glass'],
  ['forest', 'house', 'fog'],
  ['train', 'platform', 'night'],
  ['mirror', 'hallway', 'blue-light'],
  ['river', 'bridge', 'echo'],
  ['birds', 'roof', 'wind'],
];
const DREAM_TEXT_VARIANTS = [
  'I kept moving through familiar rooms that shifted shape every time I looked away.',
  'The whole dream felt quiet, but every small object seemed brighter than usual.',
  'Someone kept pointing me toward a place I almost remembered but never reached.',
  'The space felt safe and strange at the same time, like a memory from another life.',
];
const TRANSCRIPT_VARIANTS = [
  'There was a slow conversation near the water, and everyone sounded far away.',
  'I kept repeating the same image out loud so I would not lose it by morning.',
  'The dream replayed like fragments from different nights stitched together.',
];
const IMPORTANT_EVENTS = [
  'Late product planning before bed.',
  'Heavy work day and a long evening walk.',
  'Family call, then fell asleep quickly.',
  'Read for an hour and went to sleep restless.',
];
const MEDICATIONS = ['melatonin', 'magnesium', ''];
const HEALTH_NOTES = ['tired', 'headache', 'light anxiety', ''];
const WAKE_EMOTIONS: WakeEmotion[] = [
  'calm',
  'curious',
  'uneasy',
  'heavy',
  'inspired',
  'disoriented',
];
const PRE_SLEEP_EMOTIONS: PreSleepEmotion[] = [
  'peaceful',
  'hopeful',
  'restless',
  'anxious',
  'drained',
  'lonely',
];
const MOODS: Mood[] = ['positive', 'neutral', 'negative'];

function getSeedDreamId(index: number) {
  return `${SEED_ID_PREFIX}${index + 1}`;
}

function formatLocalDate(epoch: number) {
  const date = new Date(epoch);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function getTitle(index: number) {
  const base = DREAM_TITLE_FRAGMENTS[index % DREAM_TITLE_FRAGMENTS.length];
  return `${base} ${Math.floor(index / DREAM_TITLE_FRAGMENTS.length) + 1}`;
}

function getTags(index: number) {
  const base = DREAM_TAG_GROUPS[index % DREAM_TAG_GROUPS.length];
  const extra = index % 5 === 0 ? ['kaleidoscope'] : [];
  return Array.from(new Set([...base, ...extra]));
}

function getWakeEmotions(index: number) {
  return [WAKE_EMOTIONS[index % WAKE_EMOTIONS.length]].filter(Boolean);
}

function getPreSleepEmotions(index: number) {
  return [PRE_SLEEP_EMOTIONS[index % PRE_SLEEP_EMOTIONS.length]].filter(Boolean);
}

function buildSeedDream(index: number, now: number): Dream {
  const createdAt = now - index * 1000 * 60 * 60 * 12;
  const textVariant = DREAM_TEXT_VARIANTS[index % DREAM_TEXT_VARIANTS.length];
  const transcriptVariant = TRANSCRIPT_VARIANTS[index % TRANSCRIPT_VARIANTS.length];
  const hasTranscriptOnly = index % 4 === 0;
  const hasAnalysis = index % 6 === 0;

  return {
    id: getSeedDreamId(index),
    createdAt,
    sleepDate: formatLocalDate(createdAt),
    title: getTitle(index),
    text: hasTranscriptOnly ? undefined : `${textVariant} ${transcriptVariant}`,
    transcript: hasTranscriptOnly ? transcriptVariant : undefined,
    transcriptSource: hasTranscriptOnly ? 'edited' : undefined,
    transcriptUpdatedAt: hasTranscriptOnly ? createdAt + 1000 * 60 * 6 : undefined,
    tags: getTags(index),
    mood: MOODS[index % MOODS.length],
    wakeEmotions: getWakeEmotions(index),
    sleepContext: {
      stressLevel: (index % 4) as 0 | 1 | 2 | 3,
      preSleepEmotions: getPreSleepEmotions(index),
      alcoholTaken: index % 9 === 0,
      caffeineLate: index % 3 === 0,
      medications: MEDICATIONS[index % MEDICATIONS.length] || undefined,
      importantEvents: IMPORTANT_EVENTS[index % IMPORTANT_EVENTS.length],
      healthNotes: HEALTH_NOTES[index % HEALTH_NOTES.length] || undefined,
    },
    starredAt: index % 11 === 0 ? createdAt + 1000 * 60 * 20 : undefined,
    archivedAt: index % 7 === 0 ? createdAt + 1000 * 60 * 45 : undefined,
    analysis: hasAnalysis
      ? {
          provider: 'manual',
          status: 'ready',
          generatedAt: createdAt + 1000 * 60 * 12,
          summary:
            'The dream keeps circling around transition, distance, and a place that feels almost remembered.',
          themes: ['transition', 'distance', 'memory'],
        }
      : undefined,
  };
}

export function countSeedDreams() {
  return listDreams().filter(dream => dream.id.startsWith(SEED_ID_PREFIX)).length;
}

export function seedDreamSamples(targetCount: number) {
  const existingDreams = listDreams();
  const preservedDreams = existingDreams.filter(dream => !dream.id.startsWith(SEED_ID_PREFIX));
  const currentSeedCount = existingDreams.length - preservedDreams.length;
  const nextSeedCount = Math.max(targetCount, currentSeedCount);
  const now = Date.now();
  const seededDreams = Array.from({ length: nextSeedCount }, (_, index) => buildSeedDream(index, now));

  replaceAllDreams([...preservedDreams, ...seededDreams]);

  return nextSeedCount;
}

export function clearSeedDreams() {
  const preservedDreams = listDreams().filter(dream => !dream.id.startsWith(SEED_ID_PREFIX));
  replaceAllDreams(preservedDreams);
  return preservedDreams.length;
}
