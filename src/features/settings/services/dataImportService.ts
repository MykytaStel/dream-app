import RNFS from 'react-native-fs';
import { isAppLocale, type AppLocale } from '../../../i18n/types';
import { saveLocale } from '../../../i18n/localeStore';
import { kv } from '../../../services/storage/mmkv';
import {
  CURRENT_STORAGE_SCHEMA_VERSION,
  STORAGE_SCHEMA_VERSION_KEY,
} from '../../../services/storage/keys';
import { saveDreamAnalysisSettings } from '../../analysis/services/dreamAnalysisSettingsService';
import { listDreams, replaceAllDreams } from '../../dreams/repository/dreamsRepository';
import {
  getDreamDraft,
  clearDreamDraft,
  saveDreamDraft,
  type DreamDraft,
} from '../../dreams/services/dreamDraftService';
import { applyDreamReminderSettings } from '../../reminders/services/dreamReminderService';
import {
  DREAM_EXPORT_VERSION,
  getExportDirectoryPath,
  type DreamExportV1,
} from './dataExportService';

type RecordShape = Record<string, unknown>;

export type LocalDreamExportFile = {
  fileName: string;
  filePath: string;
  modifiedAt: number;
};

export type DreamImportMode = 'replace' | 'merge';

export type DreamImportDiff = {
  currentDreamCount: number;
  importDreamCount: number;
  overlappingDreamCount: number;
  newDreamCount: number;
  resultingDreamCount: number;
};

export type DreamImportPreview = {
  fileName: string;
  filePath: string;
  exportedAt: string;
  appVersion: string;
  locale: AppLocale;
  storageSchemaVersion: number;
  version: number;
  mode: DreamImportMode;
  settingsAction: 'replace' | 'keep-current';
  draftAction: 'replace' | 'keep-current' | 'import-if-empty';
  summary: DreamExportV1['summary'];
  diff: DreamImportDiff;
};

function isRecordShape(value: unknown): value is RecordShape {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function buildSummaryFromDreams(input: {
  dreams: unknown[];
  draft: DreamDraft | null;
}): DreamExportV1['summary'] {
  const dreams = input.dreams.filter(isRecordShape);

  return {
    dreamCount: dreams.length,
    archivedDreamCount: dreams.filter(dream => typeof dream.archivedAt === 'number').length,
    audioDreamCount: dreams.filter(dream => typeof dream.audioUri === 'string' && dream.audioUri.trim())
      .length,
    transcribedDreamCount: dreams.filter(
      dream => typeof dream.transcript === 'string' && dream.transcript.trim(),
    ).length,
    editedTranscriptCount: dreams.filter(dream => dream.transcriptSource === 'edited').length,
    analyzedDreamCount: dreams.filter(
      dream =>
        isRecordShape(dream.analysis) && typeof dream.analysis.status === 'string' && dream.analysis.status === 'ready',
    ).length,
    starredDreamCount: dreams.filter(dream => typeof dream.starredAt === 'number').length,
    draftIncluded: Boolean(input.draft),
  };
}

function parseDreamExport(value: unknown): DreamExportV1 {
  if (!isRecordShape(value)) {
    throw new Error('Backup file is not a valid JSON object.');
  }

  if (value.version !== DREAM_EXPORT_VERSION) {
    throw new Error(`Unsupported backup version: ${String(value.version)}.`);
  }

  if (!isAppLocale(value.locale)) {
    throw new Error('Backup locale is not supported.');
  }

  if (!Array.isArray(value.dreams)) {
    throw new Error('Backup is missing the dreams array.');
  }

  if (!isRecordShape(value.reminderSettings)) {
    throw new Error('Backup is missing reminder settings.');
  }

  if (!isRecordShape(value.analysisSettings)) {
    throw new Error('Backup is missing analysis settings.');
  }

  const draft = value.draft;
  if (draft !== null && draft !== undefined && !isRecordShape(draft)) {
    throw new Error('Backup draft block is invalid.');
  }

  if (
    typeof value.storageSchemaVersion === 'number' &&
    Number.isFinite(value.storageSchemaVersion) &&
    value.storageSchemaVersion > CURRENT_STORAGE_SCHEMA_VERSION
  ) {
    throw new Error('Backup was created with a newer storage schema.');
  }

  const summary =
    isRecordShape(value.summary) &&
    typeof value.summary.dreamCount === 'number' &&
    typeof value.summary.archivedDreamCount === 'number' &&
    typeof value.summary.audioDreamCount === 'number' &&
    typeof value.summary.transcribedDreamCount === 'number' &&
    typeof value.summary.editedTranscriptCount === 'number' &&
    typeof value.summary.analyzedDreamCount === 'number' &&
    typeof value.summary.starredDreamCount === 'number' &&
    typeof value.summary.draftIncluded === 'boolean'
      ? (value.summary as DreamExportV1['summary'])
      : buildSummaryFromDreams({
          dreams: value.dreams,
          draft: (draft as DreamDraft | null | undefined) ?? null,
        });

  return {
    version: DREAM_EXPORT_VERSION,
    exportedAt:
      typeof value.exportedAt === 'string' && value.exportedAt.trim()
        ? value.exportedAt
        : new Date(0).toISOString(),
    appVersion:
      typeof value.appVersion === 'string' && value.appVersion.trim()
        ? value.appVersion
        : 'unknown',
    platform: value.platform === 'android' || value.platform === 'ios' ? value.platform : 'ios',
    locale: value.locale,
    storageSchemaVersion:
      typeof value.storageSchemaVersion === 'number' && Number.isFinite(value.storageSchemaVersion)
        ? value.storageSchemaVersion
        : CURRENT_STORAGE_SCHEMA_VERSION,
    summary,
    dreams: value.dreams as DreamExportV1['dreams'],
    draft: (draft as DreamDraft | null | undefined) ?? null,
    reminderSettings: value.reminderSettings as DreamExportV1['reminderSettings'],
    analysisSettings: value.analysisSettings as DreamExportV1['analysisSettings'],
  };
}

function mergeDreamCollections(currentDreams: DreamExportV1['dreams'], importedDreams: DreamExportV1['dreams']) {
  const merged = new Map(currentDreams.map(dream => [dream.id, dream] as const));

  for (const dream of importedDreams) {
    merged.set(dream.id, dream);
  }

  return Array.from(merged.values());
}

function buildImportDiff(
  payload: DreamExportV1,
  mode: DreamImportMode,
  currentDreams: DreamExportV1['dreams'],
): DreamImportDiff {
  const currentIds = new Set(currentDreams.map(dream => dream.id));
  let overlappingDreamCount = 0;

  for (const dream of payload.dreams) {
    if (currentIds.has(dream.id)) {
      overlappingDreamCount += 1;
    }
  }

  const newDreamCount = payload.dreams.length - overlappingDreamCount;
  const resultingDreamCount =
    mode === 'replace'
      ? payload.dreams.length
      : currentDreams.length + newDreamCount;

  return {
    currentDreamCount: currentDreams.length,
    importDreamCount: payload.dreams.length,
    overlappingDreamCount,
    newDreamCount,
    resultingDreamCount,
  };
}

function createPreviewFromPayload(
  payload: DreamExportV1,
  input: {
    fileName: string;
    filePath: string;
    mode: DreamImportMode;
    currentDreams: DreamExportV1['dreams'];
  },
): DreamImportPreview {
  return {
    fileName: input.fileName,
    filePath: input.filePath,
    exportedAt: payload.exportedAt,
    appVersion: payload.appVersion,
    locale: payload.locale,
    storageSchemaVersion: payload.storageSchemaVersion,
    version: payload.version,
    mode: input.mode,
    settingsAction: input.mode === 'replace' ? 'replace' : 'keep-current',
    draftAction: input.mode === 'replace' ? 'replace' : 'import-if-empty',
    summary: payload.summary,
    diff: buildImportDiff(payload, input.mode, input.currentDreams),
  };
}

export async function listLocalDreamExportFiles() {
  const directoryPath = getExportDirectoryPath();
  const exists = await RNFS.exists(directoryPath);

  if (!exists) {
    return [] as LocalDreamExportFile[];
  }

  const entries = await RNFS.readDir(directoryPath);

  return entries
    .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
    .map(entry => ({
      fileName: entry.name,
      filePath: entry.path,
      modifiedAt: entry.mtime instanceof Date ? entry.mtime.getTime() : 0,
    }))
    .sort((left, right) => right.modifiedAt - left.modifiedAt);
}

async function readDreamImportPayload(filePath: string) {
  const raw = await RNFS.readFile(filePath, 'utf8');
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error('Backup file could not be parsed.');
  }

  return parseDreamExport(parsed);
}

export async function loadDreamImportPreview(filePath: string, mode: DreamImportMode) {
  const payload = await readDreamImportPayload(filePath);
  const fileName = filePath.split('/').filter(Boolean).pop() ?? filePath;
  return createPreviewFromPayload(payload, {
    fileName,
    filePath,
    mode,
    currentDreams: listDreams(),
  });
}

export async function restoreDreamImportFromFile(filePath: string, mode: DreamImportMode) {
  const payload = await readDreamImportPayload(filePath);
  const currentDreams = listDreams();
  const nextDreams =
    mode === 'replace'
      ? payload.dreams
      : mergeDreamCollections(currentDreams, payload.dreams);

  replaceAllDreams(nextDreams);

  if (mode === 'replace') {
    if (payload.draft) {
      saveDreamDraft(payload.draft);
    } else {
      clearDreamDraft();
    }

    saveLocale(payload.locale);
    saveDreamAnalysisSettings(payload.analysisSettings);
    await applyDreamReminderSettings(payload.reminderSettings);
  } else if (!getDreamDraft() && payload.draft) {
    saveDreamDraft(payload.draft);
  }

  kv.set(STORAGE_SCHEMA_VERSION_KEY, String(CURRENT_STORAGE_SCHEMA_VERSION));

  return createPreviewFromPayload(payload, {
    fileName: filePath.split('/').filter(Boolean).pop() ?? filePath,
    filePath,
    mode,
    currentDreams,
  });
}
