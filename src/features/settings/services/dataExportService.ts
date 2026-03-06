import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { APP_VERSION_LABEL } from '../../../config/app';
import { AppLocale } from '../../../i18n/types';
import { getStoredLocale } from '../../../i18n/localeStore';
import { CURRENT_STORAGE_SCHEMA_VERSION } from '../../../services/storage/keys';
import { Dream } from '../../dreams/model/dream';
import { listDreams } from '../../dreams/repository/dreamsRepository';
import { DreamDraft, getDreamDraft } from '../../dreams/services/dreamDraftService';
import {
  DreamReminderSettings,
  getDreamReminderSettings,
} from '../../reminders/services/dreamReminderService';

export const DREAM_EXPORT_VERSION = 1;
const DREAM_EXPORT_DIRECTORY = 'exports';

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
    draftIncluded: boolean;
  };
  dreams: Dream[];
  draft: DreamDraft | null;
  reminderSettings: DreamReminderSettings;
};

export function buildDreamExportSnapshot(input: {
  exportedAt?: string;
  appVersion?: string;
  locale: AppLocale;
  platform?: typeof Platform.OS;
  dreams: Dream[];
  draft: DreamDraft | null;
  reminderSettings: DreamReminderSettings;
  storageSchemaVersion?: number;
}): DreamExportV1 {
  return {
    version: DREAM_EXPORT_VERSION,
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    appVersion: input.appVersion ?? APP_VERSION_LABEL,
    platform: input.platform ?? Platform.OS,
    locale: input.locale,
    storageSchemaVersion: input.storageSchemaVersion ?? CURRENT_STORAGE_SCHEMA_VERSION,
    summary: {
      dreamCount: input.dreams.length,
      archivedDreamCount: input.dreams.filter(dream => typeof dream.archivedAt === 'number').length,
      audioDreamCount: input.dreams.filter(dream => Boolean(dream.audioUri?.trim())).length,
      draftIncluded: Boolean(input.draft),
    },
    dreams: input.dreams,
    draft: input.draft,
    reminderSettings: input.reminderSettings,
  };
}

export function createDreamExportFileName(exportedAt: string) {
  const compactTimestamp = exportedAt.replace(/[:.]/g, '-');
  return `kaleidoskop-export-${compactTimestamp}.json`;
}

function getExportDirectoryPath() {
  const baseDirectory =
    Platform.OS === 'android' && RNFS.ExternalDirectoryPath
      ? RNFS.ExternalDirectoryPath
      : RNFS.DocumentDirectoryPath;

  return `${baseDirectory}/${DREAM_EXPORT_DIRECTORY}`;
}

export async function exportDreamDataSnapshot() {
  const payload = buildDreamExportSnapshot({
    locale: getStoredLocale(),
    dreams: listDreams(),
    draft: getDreamDraft(),
    reminderSettings: getDreamReminderSettings(),
  });
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
