import {
  Dream,
  LucidControlArea,
  LucidPractice,
  LucidPracticeTechnique,
  LucidStabilizationAction,
  NightmareAftereffect,
  NightmareGroundingAction,
  NightmareSupport,
  NightmareRescriptStatus,
  DreamSyncStatus,
  DreamTranscriptSource,
  DreamTranscriptStatus,
  PreSleepEmotion,
  SleepContext,
  WakeEmotion,
} from './dream';
import { DreamAnalysisProvider, DreamAnalysisStatus } from '../../analysis/model/dreamAnalysis';

const SLEEP_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TRANSCRIPT_STATUS_VALUES: DreamTranscriptStatus[] = ['idle', 'processing', 'ready', 'error'];
const TRANSCRIPT_SOURCE_VALUES: DreamTranscriptSource[] = ['generated', 'edited'];
const ANALYSIS_PROVIDER_VALUES: DreamAnalysisProvider[] = ['manual', 'openai'];
const ANALYSIS_STATUS_VALUES: DreamAnalysisStatus[] = ['idle', 'ready', 'error'];
const SYNC_STATUS_VALUES: DreamSyncStatus[] = ['local', 'syncing', 'synced', 'error'];
const WAKE_EMOTION_VALUES: WakeEmotion[] = [
  'calm',
  'uneasy',
  'curious',
  'heavy',
  'inspired',
  'disoriented',
];
const PRE_SLEEP_EMOTION_VALUES: PreSleepEmotion[] = [
  'peaceful',
  'anxious',
  'restless',
  'hopeful',
  'drained',
  'lonely',
];
const LUCID_PRACTICE_TECHNIQUE_VALUES: LucidPracticeTechnique[] = [
  'mild',
  'wbtb',
  'ssild',
  'reality_check',
  'intention',
];
const LUCID_CONTROL_AREA_VALUES: LucidControlArea[] = [
  'scene',
  'movement',
  'characters',
  'body',
  'emotion',
  'waking',
];
const LUCID_STABILIZATION_ACTION_VALUES: LucidStabilizationAction[] = [
  'hands',
  'breathing',
  'spinning',
  'touch',
  'voice',
  'anchor',
];
const NIGHTMARE_AFTEREFFECT_VALUES: NightmareAftereffect[] = [
  'panic',
  'sweating',
  'racing-heart',
  'fear-to-sleep',
  'disoriented',
  'sadness',
];
const NIGHTMARE_GROUNDING_ACTION_VALUES: NightmareGroundingAction[] = [
  'light',
  'breathing',
  'water',
  'journal',
  'body-check',
  'safe-sound',
];
const NIGHTMARE_RESCRIPT_STATUS_VALUES: NightmareRescriptStatus[] = [
  'none',
  'drafted',
  'rehearsed',
];
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

function normalizeEmotionSelection<T extends string>(values: unknown, allowedValues: readonly T[]) {
  if (!Array.isArray(values)) {
    return undefined;
  }

  const allowed = new Set(allowedValues);
  const normalized = Array.from(
    new Set(
      values.filter((value): value is T => typeof value === 'string' && allowed.has(value as T)),
    ),
  );

  return normalized.length ? normalized : undefined;
}

function normalizeSelection<T extends string>(value: unknown, allowedValues: readonly T[]) {
  if (typeof value !== 'string') {
    return undefined;
  }

  return allowedValues.includes(value as T) ? (value as T) : undefined;
}

function normalizeFreeformList(values: unknown) {
  if (!Array.isArray(values)) {
    return undefined;
  }

  const normalized = Array.from(
    new Set(
      values
        .map(value => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''))
        .filter(Boolean),
    ),
  ).slice(0, 12);

  return normalized.length ? normalized : undefined;
}

function normalizeTranscriptStatus(rawStatus: Dream['transcriptStatus']) {
  if (!rawStatus) {
    return undefined;
  }

  return TRANSCRIPT_STATUS_VALUES.includes(rawStatus) ? rawStatus : undefined;
}

function normalizeTranscriptSource(rawSource: Dream['transcriptSource']) {
  if (!rawSource) {
    return undefined;
  }

  return TRANSCRIPT_SOURCE_VALUES.includes(rawSource) ? rawSource : undefined;
}

function normalizeSyncStatus(rawStatus: Dream['syncStatus']) {
  if (!rawStatus) {
    return undefined;
  }

  return SYNC_STATUS_VALUES.includes(rawStatus) ? rawStatus : undefined;
}

function normalizeTranscriptFields(input: Dream) {
  const transcript = normalizeOptionalText(input.transcript);
  const transcriptUpdatedAt =
    typeof input.transcriptUpdatedAt === 'number' && Number.isFinite(input.transcriptUpdatedAt)
      ? input.transcriptUpdatedAt
      : undefined;
  const hasAudio = Boolean(input.audioUri?.trim());
  let transcriptStatus = normalizeTranscriptStatus(input.transcriptStatus);
  let transcriptSource = normalizeTranscriptSource(input.transcriptSource);

  if (transcriptStatus === 'processing') {
    const startedAt = transcriptUpdatedAt ?? 0;
    if (!startedAt || Date.now() - startedAt > STALE_TRANSCRIPT_PROCESSING_MS) {
      transcriptStatus = 'error';
    }
  }

  if (transcript) {
    if (!transcriptStatus || transcriptStatus === 'idle') {
      transcriptStatus = 'ready';
    }
    if (!transcriptSource) {
      transcriptSource = hasAudio ? 'generated' : 'edited';
    }
  } else if (hasAudio) {
    if (!transcriptStatus || transcriptStatus === 'ready') {
      transcriptStatus = 'idle';
    }
    transcriptSource = undefined;
  } else if (transcriptStatus === 'ready') {
    transcriptStatus = 'idle';
    transcriptSource = undefined;
  } else if (!transcriptStatus) {
    transcriptStatus = undefined;
    transcriptSource = undefined;
  }

  return {
    transcript,
    transcriptStatus,
    transcriptSource,
    transcriptUpdatedAt:
      transcript || transcriptStatus === 'processing' || transcriptStatus === 'error'
        ? transcriptUpdatedAt
        : undefined,
  };
}

function normalizeAnalysisFields(input: Dream) {
  const analysis = input.analysis;
  if (!analysis) {
    return undefined;
  }

  const provider = ANALYSIS_PROVIDER_VALUES.includes(analysis.provider)
    ? analysis.provider
    : undefined;
  const status = ANALYSIS_STATUS_VALUES.includes(analysis.status) ? analysis.status : undefined;
  const summary = normalizeOptionalText(analysis.summary);
  const errorMessage = normalizeOptionalText(analysis.errorMessage);
  const generatedAt =
    typeof analysis.generatedAt === 'number' && Number.isFinite(analysis.generatedAt)
      ? analysis.generatedAt
      : undefined;
  const themes = Array.isArray(analysis.themes)
    ? Array.from(
        new Set(
          analysis.themes
            .map(theme => normalizeOptionalText(theme))
            .filter((theme): theme is string => Boolean(theme))
            .map(theme => theme.toLowerCase()),
        ),
      )
    : undefined;

  if (!provider || !status) {
    return undefined;
  }

  if (status === 'ready' && !summary && !themes?.length) {
    return undefined;
  }

  if (status === 'error' && !errorMessage) {
    return undefined;
  }

  if (status === 'idle' && !summary && !themes?.length && !errorMessage) {
    return undefined;
  }

  return {
    provider,
    status,
    summary,
    themes: themes?.length ? themes : undefined,
    generatedAt,
    errorMessage,
  };
}

function normalizeSyncFields(input: Dream) {
  const updatedAt =
    typeof input.updatedAt === 'number' && Number.isFinite(input.updatedAt)
      ? Math.max(input.updatedAt, input.createdAt)
      : input.createdAt;
  const audioRemotePath = normalizeOptionalText(input.audioRemotePath);
  let syncStatus = normalizeSyncStatus(input.syncStatus) ?? 'local';
  const lastSyncedAt =
    typeof input.lastSyncedAt === 'number' && Number.isFinite(input.lastSyncedAt)
      ? input.lastSyncedAt
      : undefined;
  let syncError = normalizeOptionalText(input.syncError);

  if (syncStatus === 'synced' && !lastSyncedAt) {
    syncStatus = 'local';
  }

  if (syncStatus !== 'error') {
    syncError = undefined;
  }

  return {
    updatedAt,
    audioRemotePath,
    syncStatus,
    lastSyncedAt,
    syncError,
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
    preSleepEmotions: normalizeEmotionSelection(
      context.preSleepEmotions,
      PRE_SLEEP_EMOTION_VALUES,
    ),
    alcoholTaken: context.alcoholTaken,
    caffeineLate: context.caffeineLate,
    medications: normalizeOptionalText(context.medications),
    importantEvents: normalizeOptionalText(context.importantEvents),
    healthNotes: normalizeOptionalText(context.healthNotes),
  };

  const hasValues =
    typeof normalized.stressLevel === 'number' ||
    Boolean(normalized.preSleepEmotions?.length) ||
    typeof normalized.alcoholTaken === 'boolean' ||
    typeof normalized.caffeineLate === 'boolean' ||
    Boolean(normalized.medications) ||
    Boolean(normalized.importantEvents) ||
    Boolean(normalized.healthNotes);

  return hasValues ? normalized : undefined;
}

function normalizeLucidity(value: Dream['lucidity']) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.max(0, Math.min(3, Math.floor(value))) as 0 | 1 | 2 | 3;
}

function normalizeLucidPractice(value?: LucidPractice) {
  if (!value) {
    return undefined;
  }

  const normalized: LucidPractice = {
    technique: normalizeSelection(value.technique, LUCID_PRACTICE_TECHNIQUE_VALUES),
    dreamSigns: normalizeFreeformList(value.dreamSigns),
    trigger: normalizeOptionalText(value.trigger),
    controlAreas: normalizeEmotionSelection(value.controlAreas, LUCID_CONTROL_AREA_VALUES),
    stabilizationActions: normalizeEmotionSelection(
      value.stabilizationActions,
      LUCID_STABILIZATION_ACTION_VALUES,
    ),
    recallScore:
      typeof value.recallScore === 'number' && Number.isFinite(value.recallScore)
        ? (Math.max(1, Math.min(5, Math.floor(value.recallScore))) as 1 | 2 | 3 | 4 | 5)
        : undefined,
  };

  const hasValues =
    Boolean(normalized.technique) ||
    Boolean(normalized.dreamSigns?.length) ||
    Boolean(normalized.trigger) ||
    Boolean(normalized.controlAreas?.length) ||
    Boolean(normalized.stabilizationActions?.length) ||
    typeof normalized.recallScore === 'number';

  return hasValues ? normalized : undefined;
}

function normalizeNightmareSupport(value?: NightmareSupport) {
  if (!value) {
    return undefined;
  }

  const normalized: NightmareSupport = {
    explicit: typeof value.explicit === 'boolean' ? value.explicit : undefined,
    distress:
      typeof value.distress === 'number' && Number.isFinite(value.distress)
        ? (Math.max(1, Math.min(5, Math.floor(value.distress))) as 1 | 2 | 3 | 4 | 5)
        : undefined,
    recurring: typeof value.recurring === 'boolean' ? value.recurring : undefined,
    recurringKey: normalizeOptionalText(value.recurringKey)?.toLowerCase(),
    wokeFromDream: typeof value.wokeFromDream === 'boolean' ? value.wokeFromDream : undefined,
    aftereffects: normalizeEmotionSelection(value.aftereffects, NIGHTMARE_AFTEREFFECT_VALUES),
    groundingUsed: normalizeEmotionSelection(
      value.groundingUsed,
      NIGHTMARE_GROUNDING_ACTION_VALUES,
    ),
    rewrittenEnding: normalizeOptionalText(value.rewrittenEnding),
    rescriptStatus: normalizeSelection(value.rescriptStatus, NIGHTMARE_RESCRIPT_STATUS_VALUES),
  };

  const hasValues =
    typeof normalized.explicit === 'boolean' ||
    typeof normalized.distress === 'number' ||
    typeof normalized.recurring === 'boolean' ||
    Boolean(normalized.recurringKey) ||
    typeof normalized.wokeFromDream === 'boolean' ||
    Boolean(normalized.aftereffects?.length) ||
    Boolean(normalized.groundingUsed?.length) ||
    Boolean(normalized.rewrittenEnding) ||
    Boolean(normalized.rescriptStatus);

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
  const syncFields = normalizeSyncFields(input);

  return {
    ...input,
    updatedAt: syncFields.updatedAt,
    starredAt:
      typeof input.starredAt === 'number' && Number.isFinite(input.starredAt)
        ? input.starredAt
        : undefined,
    sleepDate: resolveDreamSleepDate(input.sleepDate, input.createdAt),
    title: normalizeOptionalText(input.title),
    text: normalizeOptionalText(input.text),
    transcript: transcriptFields.transcript,
    transcriptStatus: transcriptFields.transcriptStatus,
    transcriptSource: transcriptFields.transcriptSource,
    transcriptUpdatedAt: transcriptFields.transcriptUpdatedAt,
    audioRemotePath: syncFields.audioRemotePath,
    syncStatus: syncFields.syncStatus,
    lastSyncedAt: syncFields.lastSyncedAt,
    syncError: syncFields.syncError,
    analysis: normalizeAnalysisFields(input),
    tags: normalizeTags(input.tags ?? []),
    lucidity: normalizeLucidity(input.lucidity),
    wakeEmotions: normalizeEmotionSelection(input.wakeEmotions, WAKE_EMOTION_VALUES),
    sleepContext: normalizeSleepContext(input.sleepContext),
    lucidPractice: normalizeLucidPractice(input.lucidPractice),
    nightmare: normalizeNightmareSupport(input.nightmare),
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
