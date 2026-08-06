import type { AppLocale } from '../../../i18n/types';
import { getSettingsCopy } from '../../../constants/copy/settings';
import type { SettingsMetaItem } from '../components/SettingsMetaGrid';
import type { ValidatedDreamImportPreview } from '../services/transactionalDreamImportService';
import { buildRestorePreviewItems } from './settingsPresentation';

type SettingsCopy = ReturnType<typeof getSettingsCopy>;

function labels(locale: AppLocale) {
  return locale === 'uk'
    ? {
        integrity: 'Цілісність backup',
        integrityVerified: 'Перевірено SHA-256',
        integrityLegacy: 'Legacy backup без вбудованої перевірки',
        total: 'Попередження preflight',
        normalized: 'Нормалізовані записи',
        invalidDates: 'Виправлення дат',
        staleTranscripts: 'Скидання завислих транскрипцій',
        deviceAudio: 'Локальні аудіопосилання',
      }
    : {
        integrity: 'Backup integrity',
        integrityVerified: 'SHA-256 verified',
        integrityLegacy: 'Legacy backup without embedded verification',
        total: 'Preflight warnings',
        normalized: 'Normalized records',
        invalidDates: 'Date repairs',
        staleTranscripts: 'Stale transcripts reset',
        deviceAudio: 'Device-bound audio references',
      };
}

/** Adds aggregate, content-free integrity and preflight results to restore. */
export function buildValidatedRestorePreviewItems(
  copy: SettingsCopy,
  preview: ValidatedDreamImportPreview,
  locale: AppLocale,
): SettingsMetaItem[] {
  const base = buildRestorePreviewItems(copy, preview, locale);
  const label = labels(locale);
  const healthItems: SettingsMetaItem[] = [
    {
      label: label.integrity,
      value:
        preview.integrityStatus === 'verified'
          ? label.integrityVerified
          : label.integrityLegacy,
      wide: true,
    },
    {
      label: label.total,
      value: String(preview.health.warningCount),
      wide: true,
    },
  ];

  if (preview.health.normalizedDreamCount > 0) {
    healthItems.push({
      label: label.normalized,
      value: String(preview.health.normalizedDreamCount),
    });
  }
  if (preview.health.invalidSleepDateCount > 0) {
    healthItems.push({
      label: label.invalidDates,
      value: String(preview.health.invalidSleepDateCount),
    });
  }
  if (preview.health.staleTranscriptCount > 0) {
    healthItems.push({
      label: label.staleTranscripts,
      value: String(preview.health.staleTranscriptCount),
    });
  }
  if (preview.health.deviceBoundAudioReferenceCount > 0) {
    healthItems.push({
      label: label.deviceAudio,
      value: String(preview.health.deviceBoundAudioReferenceCount),
      wide: true,
    });
  }

  return [...base, ...healthItems];
}
