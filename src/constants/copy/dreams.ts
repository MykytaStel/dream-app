import { AppLocale } from '../../i18n/types';
import { Mood, StressLevel } from '../../features/dreams/model/dream';

const DREAM_COPY_EN = {
  homeTitle: 'Dream log',
  homeSubtitle:
    'Your latest entries are stored locally and ready for future analysis.',
  homeGreeting: 'Good morning',
  homeSectionLabel: 'Recent dreams',
  homeStreakLabel: 'Streak',
  homeTotalLabel: 'Total',
  homeAverageLabel: 'Avg words',
  homeDaysUnit: 'days',
  homeFilterAll: 'All',
  homeFilterActive: 'Active',
  homeFilterArchived: 'Archived',
  openDreamHint: 'Tap any entry to open the full dream.',
  swipeEdit: 'Edit',
  swipeDelete: 'Delete',
  swipeArchive: 'Archive',
  swipeUnarchive: 'Unarchive',
  emptyTitle: 'No dreams yet',
  emptyDescription:
    'Record the first one from the New tab. Keep it fast: title, voice note, or a few raw lines are enough.',
  emptyActiveTitle: 'No active dreams',
  emptyActiveDescription:
    'All entries are archived right now. Switch filter or record a new dream.',
  emptyArchivedTitle: 'No archived dreams',
  emptyArchivedDescription:
    'Archive older entries to keep the timeline focused.',
  untitled: 'Untitled dream',
  archivedTag: 'Archived',
  audioTag: 'Audio',
  audioOnlyPreview: 'Voice note saved. Transcript can be added later.',
  noDetailsPreview: 'No written details yet.',
  detailBack: 'Back',
  detailEdit: 'Edit dream',
  detailArchive: 'Archive dream',
  detailUnarchive: 'Unarchive dream',
  detailDelete: 'Delete dream',
  detailDeleteTitle: 'Delete this dream?',
  detailDeleteDescription:
    'This action removes the entry from local storage and cannot be undone.',
  detailDeleteCancel: 'Cancel',
  detailDeleteConfirm: 'Delete',
  detailMissingTitle: 'Dream not found',
  detailMissingDescription:
    'This entry is no longer available in local storage.',
  detailMetaTitle: 'Dream details',
  detailTranscriptTitle: 'Full entry',
  detailTranscriptEmpty: 'No written transcript saved for this dream.',
  detailTagsEmpty: 'No tags attached yet.',
  detailAudioDescription: 'An original voice note is attached to this dream.',
  detailAudioPathLabel: 'Local file',
  createTitle: 'Capture a dream',
  createSubtitle:
    'Save the memory fast, keep the original voice note, and add just enough structure for future stats.',
  createHeroTitle: 'Capture before it fades',
  createHeroDescription:
    'Write a few raw lines, keep the voice note, and shape the rest later.',
  editTitle: 'Edit dream',
  editSubtitle:
    'Refine the memory, adjust tags and mood, and keep the original story intact.',
  editHeroTitle: 'Polish the memory',
  editHeroDescription:
    'Update details while the dream is still meaningful, without losing the original entry.',
  coreTitle: 'Core details',
  coreDescription: 'Title is optional. A written note or a voice note is enough.',
  titleLabel: 'Dream title',
  titlePlaceholder: 'Flying over old rooftops',
  sleepDateLabel: 'Sleep date',
  sleepDatePlaceholder: 'YYYY-MM-DD',
  textLabel: 'What do you remember?',
  textPlaceholder: 'Write the dream while it is still fresh...',
  wordsUnit: 'words',
  moodTitle: 'Mood after waking',
  moodDescription: 'Optional now, useful later for trends and monthly reports.',
  sleepContextTitle: 'Before sleep context',
  sleepContextDescription:
    'Optional signals before sleep that can help you detect patterns later.',
  stressLabel: 'Stress level',
  alcoholLabel: 'Alcohol before sleep',
  caffeineLabel: 'Late caffeine',
  medicationsLabel: 'Medications or supplements',
  medicationsPlaceholder: 'e.g. melatonin 3mg',
  eventsLabel: 'Important events',
  eventsPlaceholder: 'e.g. exams, conflict, celebration',
  healthNotesLabel: 'Health notes',
  healthNotesPlaceholder: 'e.g. headache, anxiety, low mood',
  boolYes: 'Yes',
  boolNo: 'No',
  detailContextTitle: 'Pre-sleep context',
  detailContextEmpty: 'No pre-sleep context was saved for this dream.',
  tagsTitle: 'Tags',
  tagsDescription: 'Add symbols, people, places, or recurring themes.',
  tagsPlaceholder: 'ocean',
  tagsEmpty: 'No tags yet. Tap add to save your first one.',
  voiceTitle: 'Voice note',
  voiceDescription: 'Keep the raw memory, then use transcription later.',
  voiceIdleHint: 'One tap starts a raw voice capture.',
  startRecording: 'Start recording',
  stopRecording: 'Stop recording',
  recordingHint: 'Recording in progress. Stop when you are done.',
  attachedAudioTitle: 'Voice note attached',
  removeAudio: 'Remove voice note',
  addTag: 'Add',
  saveDream: 'Save dream',
  updateDream: 'Update dream',
  saveErrorTitle: 'Nothing to save',
  saveErrorDescription:
    'Add a title, write what you remember, or attach a voice note first.',
  saveSuccessTitle: 'Saved',
  saveSuccessDescription: 'Your dream was saved locally.',
  updateSuccessTitle: 'Updated',
  updateSuccessDescription: 'Your dream was updated locally.',
  audioErrorTitle: 'Audio error',
};

const DREAM_COPY_UK: typeof DREAM_COPY_EN = {
  ...DREAM_COPY_EN,
  homeTitle: 'Щоденник снів',
  homeSubtitle:
    'Останні записи зберігаються локально і готові до подальшого аналізу.',
  homeGreeting: 'Доброго ранку',
  homeSectionLabel: 'Останні сни',
  homeStreakLabel: 'Серія',
  homeTotalLabel: 'Всього',
  homeAverageLabel: 'Сер. слів',
  homeDaysUnit: 'днів',
  homeFilterAll: 'Усі',
  homeFilterActive: 'Активні',
  homeFilterArchived: 'Архів',
  openDreamHint: 'Натисни на запис, щоб відкрити повний сон.',
  swipeEdit: 'Змінити',
  swipeDelete: 'Видалити',
  swipeArchive: 'Архів',
  swipeUnarchive: 'Розархівувати',
  emptyTitle: 'Поки немає снів',
  emptyDescription:
    'Додай перший запис у вкладці Record. Достатньо назви, голосу або кількох рядків.',
  emptyActiveTitle: 'Немає активних снів',
  emptyActiveDescription: 'Усі записи в архіві. Зміни фільтр або створи новий сон.',
  emptyArchivedTitle: 'Архів порожній',
  emptyArchivedDescription: 'Архівуй старі записи, щоб сфокусувати таймлайн.',
  untitled: 'Сон без назви',
  archivedTag: 'Архів',
  audioTag: 'Аудіо',
  audioOnlyPreview: 'Голосову нотатку збережено. Текст можна додати пізніше.',
  noDetailsPreview: 'Поки без текстового опису.',
  detailBack: 'Назад',
  detailEdit: 'Редагувати сон',
  detailArchive: 'В архів',
  detailUnarchive: 'З архіву',
  detailDelete: 'Видалити сон',
  detailDeleteTitle: 'Видалити цей сон?',
  detailDeleteDescription: 'Запис буде видалено з локального сховища без можливості відновлення.',
  detailDeleteCancel: 'Скасувати',
  detailDeleteConfirm: 'Видалити',
  detailMissingTitle: 'Сон не знайдено',
  detailMissingDescription: 'Цей запис більше недоступний у локальному сховищі.',
  detailMetaTitle: 'Деталі сну',
  detailTranscriptTitle: 'Повний запис',
  detailTranscriptEmpty: 'Для цього сну ще немає текстового опису.',
  detailTagsEmpty: 'Теги ще не додані.',
  detailAudioDescription: 'До цього сну прикріплена оригінальна голосова нотатка.',
  detailAudioPathLabel: 'Локальний файл',
  createTitle: 'Запис сну',
  createSubtitle:
    'Швидко збережи спогад, залиш голосову нотатку і додай мінімальну структуру.',
  createHeroTitle: 'Запиши, поки не зникло',
  createHeroDescription:
    'Додай кілька сирих рядків, збережи голос і доповниш деталі пізніше.',
  editTitle: 'Редагування сну',
  editSubtitle: 'Уточни запис, теги і настрій, не втрачаючи оригінальну історію.',
  editHeroTitle: 'Уточни спогад',
  editHeroDescription: 'Онови деталі, поки сон ще свіжий і важливий.',
  coreTitle: 'Основне',
  coreDescription: 'Назва необовʼязкова. Достатньо тексту або голосової нотатки.',
  titleLabel: 'Назва сну',
  titlePlaceholder: 'Політ над старими дахами',
  sleepDateLabel: 'Дата сну',
  textLabel: 'Що ти памʼятаєш?',
  textPlaceholder: 'Запиши сон, поки він ще свіжий...',
  wordsUnit: 'слів',
  moodTitle: 'Настрій після пробудження',
  moodDescription: 'Опційно зараз, корисно для трендів і місячних звітів.',
  sleepContextTitle: 'Контекст перед сном',
  sleepContextDescription:
    'Опційні фактори перед сном, які допоможуть знайти патерни пізніше.',
  stressLabel: 'Рівень стресу',
  alcoholLabel: 'Алкоголь перед сном',
  caffeineLabel: 'Пізній кофеїн',
  medicationsLabel: 'Препарати або добавки',
  medicationsPlaceholder: 'напр. мелатонін 3мг',
  eventsLabel: 'Важливі події',
  eventsPlaceholder: 'напр. іспит, конфлікт, святкування',
  healthNotesLabel: 'Нотатки про здоровʼя',
  healthNotesPlaceholder: 'напр. головний біль, тривожність, низький настрій',
  boolYes: 'Так',
  boolNo: 'Ні',
  detailContextTitle: 'Контекст перед сном',
  detailContextEmpty: 'Для цього сну контекст перед сном не збережено.',
  tagsTitle: 'Теги',
  tagsDescription: 'Додавай символи, людей, місця або повторювані теми.',
  tagsPlaceholder: 'океан',
  tagsEmpty: 'Тегів ще немає. Додай перший.',
  voiceTitle: 'Голосова нотатка',
  voiceDescription: 'Збережи сирий спогад, а транскрипцію додаси пізніше.',
  voiceIdleHint: 'Один тап запускає запис голосу.',
  startRecording: 'Почати запис',
  stopRecording: 'Зупинити запис',
  recordingHint: 'Йде запис. Зупини, коли завершиш.',
  attachedAudioTitle: 'Голосову нотатку додано',
  removeAudio: 'Видалити голос',
  addTag: 'Додати',
  saveDream: 'Зберегти сон',
  updateDream: 'Оновити сон',
  saveErrorTitle: 'Немає що зберігати',
  saveErrorDescription: 'Додай назву, текст або голосову нотатку.',
  saveSuccessTitle: 'Збережено',
  saveSuccessDescription: 'Сон збережено локально.',
  updateSuccessTitle: 'Оновлено',
  updateSuccessDescription: 'Сон оновлено локально.',
  audioErrorTitle: 'Помилка аудіо',
};

const DREAM_MOODS_EN: Array<{ label: string; value: Mood }> = [
  { label: 'Calm', value: 'neutral' },
  { label: 'Bright', value: 'positive' },
  { label: 'Heavy', value: 'negative' },
];

const DREAM_MOODS_UK: typeof DREAM_MOODS_EN = [
  { label: 'Спокійний', value: 'neutral' },
  { label: 'Світлий', value: 'positive' },
  { label: 'Важкий', value: 'negative' },
];

const DREAM_MOOD_LABELS_EN: Record<Mood, string> = {
  neutral: 'Calm',
  positive: 'Bright',
  negative: 'Heavy',
};

const DREAM_MOOD_LABELS_UK: typeof DREAM_MOOD_LABELS_EN = {
  neutral: 'Спокійний',
  positive: 'Світлий',
  negative: 'Важкий',
};

const DREAM_STRESS_LEVELS_EN: Array<{ label: string; value: StressLevel }> = [
  { label: 'Low', value: 0 },
  { label: 'Moderate', value: 1 },
  { label: 'High', value: 2 },
  { label: 'Overload', value: 3 },
];

const DREAM_STRESS_LEVELS_UK: typeof DREAM_STRESS_LEVELS_EN = [
  { label: 'Низький', value: 0 },
  { label: 'Помірний', value: 1 },
  { label: 'Високий', value: 2 },
  { label: 'Перевантаження', value: 3 },
];

const DREAM_STRESS_LABELS_EN: Record<StressLevel, string> = {
  0: 'Low',
  1: 'Moderate',
  2: 'High',
  3: 'Overload',
};

const DREAM_STRESS_LABELS_UK: typeof DREAM_STRESS_LABELS_EN = {
  0: 'Низький',
  1: 'Помірний',
  2: 'Високий',
  3: 'Перевантаження',
};

export type DreamCopy = typeof DREAM_COPY_EN;

export function getDreamCopy(locale: AppLocale): DreamCopy {
  return locale === 'uk' ? DREAM_COPY_UK : DREAM_COPY_EN;
}

export function getDreamMoods(locale: AppLocale) {
  return locale === 'uk' ? DREAM_MOODS_UK : DREAM_MOODS_EN;
}

export function getDreamMoodLabels(locale: AppLocale) {
  return locale === 'uk' ? DREAM_MOOD_LABELS_UK : DREAM_MOOD_LABELS_EN;
}

export function getDreamStressLevels(locale: AppLocale) {
  return locale === 'uk' ? DREAM_STRESS_LEVELS_UK : DREAM_STRESS_LEVELS_EN;
}

export function getDreamStressLabels(locale: AppLocale) {
  return locale === 'uk' ? DREAM_STRESS_LABELS_UK : DREAM_STRESS_LABELS_EN;
}

export const DREAM_COPY = DREAM_COPY_EN;
export const DREAM_MOODS = DREAM_MOODS_EN;
export const DREAM_MOOD_LABELS = DREAM_MOOD_LABELS_EN;
export const DREAM_STRESS_LEVELS = DREAM_STRESS_LEVELS_EN;
export const DREAM_STRESS_LABELS = DREAM_STRESS_LABELS_EN;
