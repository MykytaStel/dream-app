import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { generatePDF } from 'react-native-html-to-pdf';
import { APP_VERSION_LABEL } from '../../../config/app';
import { AppLocale } from '../../../i18n/types';
import { getStoredLocale } from '../../../i18n/localeStore';
import { CURRENT_STORAGE_SCHEMA_VERSION } from '../../../services/storage/keys';
import { DreamAnalysisSettings } from '../../analysis/model/dreamAnalysis';
import { getDreamAnalysisSettings } from '../../analysis/services/dreamAnalysisSettingsService';
import { Dream } from '../../dreams/model/dream';
import { listDreams } from '../../dreams/repository/dreamsRepository';
import { DreamDraft, getDreamDraft } from '../../dreams/services/dreamDraftService';
import {
  DreamReminderSettings,
  getDreamReminderSettings,
} from '../../reminders/services/dreamReminderService';
import { getDerivedReviewStateSnapshot } from '../../stats/services/reviewShelfStateService';
import { buildDreamArchivePdfHtml } from './dreamArchivePdf';

export const DREAM_EXPORT_VERSION = 7;
const DREAM_EXPORT_DIRECTORY = 'exports';
const PDF_OUTPUT_DIRECTORY = 'Documents';

export type DreamBackup = Omit<
  Dream,
  'audioRemotePath' | 'syncStatus' | 'lastSyncedAt' | 'syncError'
>;

export type DreamExportV1 = {
  version: typeof DREAM_EXPORT_VERSION;
  exportedAt: string;
  appVersion: string;
  platform: typeof Platform.OS;
  locale: AppLocale;
  storageSchemaVersion: number;
  summary: {
    dreamCount: number;
    archivedDreamCount: number;
    audioDreamCount: number;
    transcribedDreamCount: number;
    editedTranscriptCount: number;
    analyzedDreamCount: number;
    starredDreamCount: number;
    draftIncluded: boolean;
  };
  dreams: DreamBackup[];
  draft: DreamDraft | null;
  reminderSettings: DreamReminderSettings;
  analysisSettings: DreamAnalysisSettings;
  reviewState: {
    updatedAt: number;
    savedMonths: Array<{
      monthKey: string;
      savedAt: number;
    }>;
    savedThreads: Array<{
      signal: string;
      kind: 'word' | 'theme' | 'symbol';
      savedAt: number;
    }>;
  };
};

function buildCurrentDreamExportSnapshot() {
  const reviewState = getDerivedReviewStateSnapshot();
  return buildDreamExportSnapshot({
    locale: getStoredLocale(),
    dreams: listDreams(),
    draft: getDreamDraft(),
    reminderSettings: getDreamReminderSettings(),
    analysisSettings: getDreamAnalysisSettings(),
    reviewState: {
      updatedAt: reviewState.updatedAt,
      savedMonths: reviewState.savedMonths,
      savedThreads: reviewState.savedThreads,
    },
  });
}

function stripTransientDreamFields(dream: Dream): DreamBackup {
  const backup = { ...dream };
  delete backup.audioRemotePath;
  delete backup.syncStatus;
  delete backup.lastSyncedAt;
  delete backup.syncError;
  return backup;
}

export function buildDreamExportSnapshot(input: {
  exportedAt?: string;
  appVersion?: string;
  locale: AppLocale;
  platform?: typeof Platform.OS;
  dreams: Dream[];
  draft: DreamDraft | null;
  reminderSettings: DreamReminderSettings;
  analysisSettings: DreamAnalysisSettings;
  reviewState: DreamExportV1['reviewState'];
  storageSchemaVersion?: number;
}): DreamExportV1 {
  const backupDreams = input.dreams.map(stripTransientDreamFields);

  return {
    version: DREAM_EXPORT_VERSION,
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    appVersion: input.appVersion ?? APP_VERSION_LABEL,
    platform: input.platform ?? Platform.OS,
    locale: input.locale,
    storageSchemaVersion: input.storageSchemaVersion ?? CURRENT_STORAGE_SCHEMA_VERSION,
    summary: {
      dreamCount: backupDreams.length,
      archivedDreamCount: backupDreams.filter(dream => typeof dream.archivedAt === 'number').length,
      audioDreamCount: backupDreams.filter(dream => Boolean(dream.audioUri?.trim())).length,
      transcribedDreamCount: backupDreams.filter(dream => Boolean(dream.transcript?.trim())).length,
      editedTranscriptCount: backupDreams.filter(dream => dream.transcriptSource === 'edited')
        .length,
      analyzedDreamCount: backupDreams.filter(dream => dream.analysis?.status === 'ready').length,
      starredDreamCount: backupDreams.filter(dream => typeof dream.starredAt === 'number').length,
      draftIncluded: Boolean(input.draft),
    },
    dreams: backupDreams,
    draft: input.draft,
    reminderSettings: input.reminderSettings,
    analysisSettings: input.analysisSettings,
    reviewState: input.reviewState,
  };
}

export function createDreamExportFileName(exportedAt: string) {
  const compactTimestamp = exportedAt.replace(/[:.]/g, '-');
  return `kaleidoskop-export-${compactTimestamp}.json`;
}

export function createDreamPdfExportFileName(exportedAt: string) {
  const compactTimestamp = exportedAt.replace(/[:.]/g, '-');
  return `kaleidoskop-archive-${compactTimestamp}.pdf`;
}

function getExportDirectoryPath() {
  const baseDirectory =
    Platform.OS === 'android' && RNFS.ExternalDirectoryPath
      ? RNFS.ExternalDirectoryPath
      : RNFS.DocumentDirectoryPath;

  return `${baseDirectory}/${DREAM_EXPORT_DIRECTORY}`;
}

export { getExportDirectoryPath };

export async function exportDreamDataSnapshot() {
  const payload = buildCurrentDreamExportSnapshot();
  const directoryPath = getExportDirectoryPath();
  const fileName = createDreamExportFileName(payload.exportedAt);
  const filePath = `${directoryPath}/${fileName}`;

  await RNFS.mkdir(directoryPath);
  await RNFS.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');

  return {
    filePath,
    payload,
  };
}

export async function exportDreamArchivePdf() {
  const payload = buildCurrentDreamExportSnapshot();
  const directoryPath = getExportDirectoryPath();
  const fileName = createDreamPdfExportFileName(payload.exportedAt);
  const pdfBaseName = fileName.replace(/\.pdf$/i, '');
  const targetFilePath = `${directoryPath}/${fileName}`;

  const pdfResult = await generatePDF({
    html: buildDreamArchivePdfHtml(payload),
    fileName: pdfBaseName,
    directory: PDF_OUTPUT_DIRECTORY,
    padding: 24,
    bgColor: '#FFFFFF',
    shouldPrintBackgrounds: true,
  });

  await RNFS.mkdir(directoryPath);

  if (pdfResult.filePath !== targetFilePath) {
    if (await RNFS.exists(targetFilePath)) {
      await RNFS.unlink(targetFilePath);
    }

    await RNFS.copyFile(pdfResult.filePath, targetFilePath);

    if (await RNFS.exists(pdfResult.filePath)) {
      await RNFS.unlink(pdfResult.filePath);
    }
  }

  return {
    filePath: targetFilePath,
    payload,
  };
}
