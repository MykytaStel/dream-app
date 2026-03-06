import { Dream, DreamTranscriptStatus, SleepContext } from './dream';

const SLEEP_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TRANSCRIPT_STATUS_VALUES: DreamTranscriptStatus[] = ['idle', 'processing', 'ready', 'error'];
const STALE_TRANSCRIPT_PROCESSING_MS = 1000 * 60 * 15;
export const DREAM_SAVE_VALIDATION = {
  missingContent: 'missing-content',
  invalidSleepDate: 'invalid-sleep-date',
} as const;

export type DreamSaveValidationError =
  (typeof DREAM_SAVE_VALIDATION)[keyof typeof DREAM_SAVE_VALIDATION];

export function isValidSleepDate(value: string) {
  if (!SLEEP_DATE_REGEX.test(value)) {
    return false;
  }

  const [yearRaw, monthRaw, dayRaw] = value.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day
  );
}

function formatLocalDate(epoch: number) {
  const date = new Date(epoch);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function normalizeOptionalText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeTranscriptStatus(rawStatus: Dream['transcriptStatus']) {
  if (!rawStatus) {
    return undefined;
  }

  return TRANSCRIPT_STATUS_VALUES.includes(rawStatus) ? rawStatus : undefined;
}

function normalizeTranscriptFields(input: Dream) {
  const transcript = normalizeOptionalText(input.transcript);
  const transcriptUpdatedAt =
    typeof input.transcriptUpdatedAt === 'number' && Number.isFinite(input.transcriptUpdatedAt)
      ? input.transcriptUpdatedAt
      : undefined;
  const hasAudio = Boolean(input.audioUri?.trim());
  let transcriptStatus = normalizeTranscriptStatus(input.transcriptStatus);

  if (transcriptStatus === 'processing') {
    const startedAt = transcriptUpdatedAt ?? 0;
    if (!startedAt || Date.now() - startedAt > STALE_TRANSCRIPT_PROCESSING_MS) {
      transcriptStatus = 'error';
    }
  }

  if (transcript) {
    if (transcriptStatus !== 'processing') {
      transcriptStatus = 'ready';
    }
  } else if (hasAudio) {
    if (!transcriptStatus || transcriptStatus === 'ready') {
      transcriptStatus = 'idle';
    }
  } else if (transcriptStatus === 'ready') {
    transcriptStatus = 'idle';
  } else if (!transcriptStatus) {
    transcriptStatus = undefined;
  }

  return {
    transcript,
    transcriptStatus,
    transcriptUpdatedAt:
      transcript || transcriptStatus === 'processing' || transcriptStatus === 'error'
        ? transcriptUpdatedAt
        : undefined,
  };
}

export function normalizeTag(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function normalizeTags(tags: string[]) {
  const normalized: string[] = [];
  const seen = new Set<string>();

  tags.forEach(tag => {
    const cleanTag = normalizeTag(tag);
    if (!cleanTag || seen.has(cleanTag)) {
      return;
    }

    seen.add(cleanTag);
    normalized.push(cleanTag);
  });

  return normalized;
}

function normalizeSleepContext(context?: SleepContext): SleepContext | undefined {
  if (!context) {
    return undefined;
  }

  const normalized: SleepContext = {
    stressLevel: context.stressLevel,
    alcoholTaken: context.alcoholTaken,
    caffeineLate: context.caffeineLate,
    medications: normalizeOptionalText(context.medications),
    importantEvents: normalizeOptionalText(context.importantEvents),
    healthNotes: normalizeOptionalText(context.healthNotes),
  };

  const hasValues =
    typeof normalized.stressLevel === 'number' ||
    typeof normalized.alcoholTaken === 'boolean' ||
    typeof normalized.caffeineLate === 'boolean' ||
    Boolean(normalized.medications) ||
    Boolean(normalized.importantEvents) ||
    Boolean(normalized.healthNotes);

  return hasValues ? normalized : undefined;
}

export function resolveDreamSleepDate(rawSleepDate: string | undefined, createdAt: number) {
  const cleanDate = rawSleepDate?.trim();
  if (cleanDate && isValidSleepDate(cleanDate)) {
    return cleanDate;
  }

  return formatLocalDate(createdAt);
}

export function hasDreamContent(input: Pick<Dream, 'text' | 'audioUri'>) {
  return Boolean(input.text?.trim() || input.audioUri?.trim());
}

export function validateDreamForSave(input: Pick<Dream, 'text' | 'audioUri' | 'sleepDate'>) {
  if (!hasDreamContent(input)) {
    return DREAM_SAVE_VALIDATION.missingContent;
  }

  const cleanSleepDate = input.sleepDate?.trim();
  if (cleanSleepDate && !isValidSleepDate(cleanSleepDate)) {
    return DREAM_SAVE_VALIDATION.invalidSleepDate;
  }

  return null;
}

export function sanitizeDream(input: Dream): Dream {
  const transcriptFields = normalizeTranscriptFields(input);

  return {
    ...input,
    sleepDate: resolveDreamSleepDate(input.sleepDate, input.createdAt),
    title: normalizeOptionalText(input.title),
    text: normalizeOptionalText(input.text),
    transcript: transcriptFields.transcript,
    transcriptStatus: transcriptFields.transcriptStatus,
    transcriptUpdatedAt: transcriptFields.transcriptUpdatedAt,
    tags: normalizeTags(input.tags ?? []),
    sleepContext: normalizeSleepContext(input.sleepContext),
  };
}

function getSortSleepDate(dream: Dream) {
  return resolveDreamSleepDate(dream.sleepDate, dream.createdAt);
}

export function sortDreamsStable(dreams: Dream[]) {
  return [...dreams].sort((a, b) => {
    const dateCompare = getSortSleepDate(b).localeCompare(getSortSleepDate(a));
    if (dateCompare !== 0) {
      return dateCompare;
    }

    if (b.createdAt !== a.createdAt) {
      return b.createdAt - a.createdAt;
    }

    return b.id.localeCompare(a.id);
  });
}
