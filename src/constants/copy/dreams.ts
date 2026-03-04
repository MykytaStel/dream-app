import { Mood } from '../../features/dreams/model/dream';

export const DREAM_COPY = {
  homeTitle: 'Dream log',
  homeSubtitle:
    'Your latest entries are stored locally and ready for future analysis.',
  homeGreeting: 'Good morning',
  homeSectionLabel: 'Recent dreams',
  homeStreakLabel: 'Streak',
  homeTotalLabel: 'Total',
  homeAverageLabel: 'Avg words',
  homeDaysUnit: 'days',
  emptyTitle: 'No dreams yet',
  emptyDescription:
    'Record the first one from the New tab. Keep it fast: title, voice note, or a few raw lines are enough.',
  untitled: 'Untitled dream',
  audioOnlyPreview: 'Voice note saved. Transcript can be added later.',
  noDetailsPreview: 'No written details yet.',
  createTitle: 'Capture a dream',
  createSubtitle:
    'Save the memory fast, keep the original voice note, and add just enough structure for future stats.',
  createHeroTitle: 'Capture before it fades',
  createHeroDescription:
    'Write a few raw lines, keep the voice note, and shape the rest later.',
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
  saveErrorTitle: 'Nothing to save',
  saveErrorDescription:
    'Add a title, write what you remember, or attach a voice note first.',
  saveSuccessTitle: 'Saved',
  saveSuccessDescription: 'Your dream was saved locally.',
  audioErrorTitle: 'Audio error',
} as const;

export const DREAM_MOODS: Array<{ label: string; value: Mood }> = [
  { label: 'Calm', value: 'neutral' },
  { label: 'Bright', value: 'positive' },
  { label: 'Heavy', value: 'negative' },
];

export const DREAM_MOOD_LABELS: Record<Mood, string> = {
  neutral: 'Calm',
  positive: 'Bright',
  negative: 'Heavy',
};
