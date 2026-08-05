import type { AppLocale } from '../../../i18n/types';
import type { DreamDraftRecoveryStatus } from '../services/dreamDraftRecoveryService';

export type DreamDraftRecoveryNoticeStatus = Extract<
  DreamDraftRecoveryStatus,
  'discarded-corrupt' | 'discarded-stale'
>;

export type DreamDraftRecoveryNoticeCopy = {
  title: string;
  description: string;
  dismissLabel: string;
};

const COPY: Record<
  AppLocale,
  Record<DreamDraftRecoveryNoticeStatus, DreamDraftRecoveryNoticeCopy>
> = {
  en: {
    'discarded-corrupt': {
      title: 'Draft reset safely',
      description:
        'The unfinished local draft could not be read, so it was removed. Your saved dreams were not changed, and capture is ready now.',
      dismissLabel: 'Dismiss draft recovery notice',
    },
    'discarded-stale': {
      title: 'Newer saved version kept',
      description:
        'An older edit draft was removed so it could not overwrite the newer saved dream.',
      dismissLabel: 'Dismiss draft recovery notice',
    },
  },
  uk: {
    'discarded-corrupt': {
      title: 'Чернетку безпечно скинуто',
      description:
        'Незавершену локальну чернетку не вдалося прочитати, тому її видалено. Збережені сни не змінено, і запис уже готовий.',
      dismissLabel: 'Закрити повідомлення про відновлення чернетки',
    },
    'discarded-stale': {
      title: 'Збережено новішу версію',
      description:
        'Стару чернетку редагування видалено, щоб вона не перезаписала новішу збережену версію сну.',
      dismissLabel: 'Закрити повідомлення про відновлення чернетки',
    },
  },
};

export function isDreamDraftRecoveryNoticeStatus(
  status: DreamDraftRecoveryStatus,
): status is DreamDraftRecoveryNoticeStatus {
  return status === 'discarded-corrupt' || status === 'discarded-stale';
}

export function getDreamDraftRecoveryNoticeCopy(
  locale: AppLocale,
  status: DreamDraftRecoveryNoticeStatus,
) {
  return COPY[locale][status];
}
