import {
  DreamIntensity,
  Mood,
  PreSleepEmotion,
  StressLevel,
  WakeEmotion,
} from '../../../features/dreams/model/dream';
import { DREAM_COPY_EN } from './en';
import { DREAM_COPY_UK } from './uk';

// Mood options shown in the UI — 8 dream tone values (legacy positive/neutral/negative hidden)
export const DREAM_MOODS_EN: Array<{ label: string; value: Mood }> = [
  { label: 'Peaceful', value: 'peaceful' },
  { label: 'Joyful', value: 'joyful' },
  { label: 'Mysterious', value: 'mysterious' },
  { label: 'Nostalgic', value: 'nostalgic' },
  { label: 'Melancholic', value: 'melancholic' },
  { label: 'Anxious', value: 'anxious' },
  { label: 'Dark', value: 'dark' },
  { label: 'Surreal', value: 'surreal' },
];

export const DREAM_MOODS_UK: typeof DREAM_MOODS_EN = [
  { label: 'Спокійний', value: 'peaceful' },
  { label: 'Радісний', value: 'joyful' },
  { label: 'Таємничий', value: 'mysterious' },
  { label: 'Ностальгійний', value: 'nostalgic' },
  { label: 'Меланхолійний', value: 'melancholic' },
  { label: 'Тривожний', value: 'anxious' },
  { label: 'Темний', value: 'dark' },
  { label: 'Сюрреальний', value: 'surreal' },
];

export const DREAM_MOOD_LABELS_EN: Record<Mood, string> = {
  // legacy
  neutral: 'Calm',
  positive: 'Bright',
  negative: 'Heavy',
  // tones
  peaceful: 'Peaceful',
  joyful: 'Joyful',
  mysterious: 'Mysterious',
  nostalgic: 'Nostalgic',
  melancholic: 'Melancholic',
  anxious: 'Anxious',
  dark: 'Dark',
  surreal: 'Surreal',
};

export const DREAM_MOOD_LABELS_UK: typeof DREAM_MOOD_LABELS_EN = {
  // legacy
  neutral: 'Спокійний',
  positive: 'Світлий',
  negative: 'Важкий',
  // tones
  peaceful: 'Спокійний',
  joyful: 'Радісний',
  mysterious: 'Таємничий',
  nostalgic: 'Ностальгійний',
  melancholic: 'Меланхолійний',
  anxious: 'Тривожний',
  dark: 'Темний',
  surreal: 'Сюрреальний',
};

export const DREAM_STRESS_LEVELS_EN: Array<{
  label: string;
  value: StressLevel;
}> = [
  { label: 'Low', value: 0 },
  { label: 'Moderate', value: 1 },
  { label: 'High', value: 2 },
  { label: 'Overload', value: 3 },
];

export const DREAM_STRESS_LEVELS_UK: typeof DREAM_STRESS_LEVELS_EN = [
  { label: 'Низький', value: 0 },
  { label: 'Помірний', value: 1 },
  { label: 'Високий', value: 2 },
  { label: 'Перевантаження', value: 3 },
];

export const DREAM_STRESS_LABELS_EN: Record<StressLevel, string> = {
  0: 'Low',
  1: 'Moderate',
  2: 'High',
  3: 'Overload',
};

export const DREAM_STRESS_LABELS_UK: typeof DREAM_STRESS_LABELS_EN = {
  0: 'Низький',
  1: 'Помірний',
  2: 'Високий',
  3: 'Перевантаження',
};

export const DREAM_INTENSITY_LEVELS_EN: Array<{
  label: string;
  value: DreamIntensity;
}> = [
  { label: 'Faint', value: 1 },
  { label: 'Soft', value: 2 },
  { label: 'Moderate', value: 3 },
  { label: 'Vivid', value: 4 },
  { label: 'Intense', value: 5 },
];

export const DREAM_INTENSITY_LEVELS_UK: typeof DREAM_INTENSITY_LEVELS_EN = [
  { label: 'Ледь', value: 1 },
  { label: 'Слабко', value: 2 },
  { label: 'Помірно', value: 3 },
  { label: 'Яскраво', value: 4 },
  { label: 'Інтенсивно', value: 5 },
];

export const DREAM_LUCIDITY_LEVELS_EN = [
  { label: DREAM_COPY_EN.lucidityNoneLabel, value: 0 as const },
  { label: DREAM_COPY_EN.lucidityBriefLabel, value: 1 as const },
  { label: DREAM_COPY_EN.lucidityAwareLabel, value: 2 as const },
  { label: DREAM_COPY_EN.lucidityControlLabel, value: 3 as const },
];

export const DREAM_LUCIDITY_LEVELS_UK: typeof DREAM_LUCIDITY_LEVELS_EN = [
  { label: DREAM_COPY_UK.lucidityNoneLabel, value: 0 as const },
  { label: DREAM_COPY_UK.lucidityBriefLabel, value: 1 as const },
  { label: DREAM_COPY_UK.lucidityAwareLabel, value: 2 as const },
  { label: DREAM_COPY_UK.lucidityControlLabel, value: 3 as const },
];

export const DREAM_WAKE_EMOTIONS_EN: Array<{
  label: string;
  value: WakeEmotion;
}> = [
  { label: 'Calm', value: 'calm' },
  { label: 'Uneasy', value: 'uneasy' },
  { label: 'Curious', value: 'curious' },
  { label: 'Heavy', value: 'heavy' },
  { label: 'Inspired', value: 'inspired' },
  { label: 'Disoriented', value: 'disoriented' },
];

export const DREAM_WAKE_EMOTIONS_UK: typeof DREAM_WAKE_EMOTIONS_EN = [
  { label: 'Спокій', value: 'calm' },
  { label: 'Тривога', value: 'uneasy' },
  { label: 'Цікавість', value: 'curious' },
  { label: 'Важкість', value: 'heavy' },
  { label: 'Натхнення', value: 'inspired' },
  { label: 'Дезорієнтація', value: 'disoriented' },
];

export const DREAM_PRE_SLEEP_EMOTIONS_EN: Array<{
  label: string;
  value: PreSleepEmotion;
}> = [
  { label: 'Peaceful', value: 'peaceful' },
  { label: 'Anxious', value: 'anxious' },
  { label: 'Restless', value: 'restless' },
  { label: 'Hopeful', value: 'hopeful' },
  { label: 'Drained', value: 'drained' },
  { label: 'Lonely', value: 'lonely' },
];

export const DREAM_PRE_SLEEP_EMOTIONS_UK: typeof DREAM_PRE_SLEEP_EMOTIONS_EN = [
  { label: 'Спокій', value: 'peaceful' },
  { label: 'Тривога', value: 'anxious' },
  { label: 'Неспокій', value: 'restless' },
  { label: 'Надія', value: 'hopeful' },
  { label: 'Виснаження', value: 'drained' },
  { label: 'Самотність', value: 'lonely' },
];

export const DREAM_WAKE_EMOTION_LABELS_EN: Record<WakeEmotion, string> =
  Object.fromEntries(
    DREAM_WAKE_EMOTIONS_EN.map(option => [option.value, option.label]),
  ) as Record<WakeEmotion, string>;

export const DREAM_WAKE_EMOTION_LABELS_UK: typeof DREAM_WAKE_EMOTION_LABELS_EN =
  Object.fromEntries(
    DREAM_WAKE_EMOTIONS_UK.map(option => [option.value, option.label]),
  ) as Record<WakeEmotion, string>;

export const DREAM_PRE_SLEEP_EMOTION_LABELS_EN: Record<
  PreSleepEmotion,
  string
> = Object.fromEntries(
  DREAM_PRE_SLEEP_EMOTIONS_EN.map(option => [option.value, option.label]),
) as Record<PreSleepEmotion, string>;

export const DREAM_PRE_SLEEP_EMOTION_LABELS_UK: typeof DREAM_PRE_SLEEP_EMOTION_LABELS_EN =
  Object.fromEntries(
    DREAM_PRE_SLEEP_EMOTIONS_UK.map(option => [option.value, option.label]),
  ) as Record<PreSleepEmotion, string>;

export const DREAM_LUCIDITY_LABELS_EN: Record<0 | 1 | 2 | 3, string> =
  Object.fromEntries(
    DREAM_LUCIDITY_LEVELS_EN.map(option => [option.value, option.label]),
  ) as Record<0 | 1 | 2 | 3, string>;

export const DREAM_LUCIDITY_LABELS_UK: typeof DREAM_LUCIDITY_LABELS_EN =
  Object.fromEntries(
    DREAM_LUCIDITY_LEVELS_UK.map(option => [option.value, option.label]),
  ) as Record<0 | 1 | 2 | 3, string>;
