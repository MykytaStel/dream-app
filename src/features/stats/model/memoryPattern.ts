import type { AppLocale } from '../../../i18n/types';
import type { Dream } from '../../dreams/model/dream';
import { getDreamDate } from '../../dreams/model/dreamAnalytics';
import {
  getRecurringReflectionSignals,
  getRecurringWordSignals,
} from './dreamReflection';
import {
  getPatternDreamMatches,
  type PatternMatchKind,
  type PatternMatchSource,
} from './patternMatches';
import {
  buildMemoryPatternKey,
  type MemoryPatternFeedbackRecord,
} from '../services/memoryPatternFeedbackService';

export type MemoryPatternEvidence = {
  dreamId: string;
  title: string;
  dateLabel: string;
  preview: string;
  sources: PatternMatchSource[];
};

export type MemoryPatternCandidate = {
  key: string;
  signal: string;
  kind: PatternMatchKind;
  displayTitle: string;
  dreamCount: number;
  confirmed: boolean;
  evidence: MemoryPatternEvidence[];
};

export type MemoryPatternCopy = {
  eyebrow: string;
  confirmedEyebrow: string;
  hypothesis: string;
  evidenceTitle: string;
  countLabel: (value: number) => string;
  confirmAction: string;
  confirmedAction: string;
  dismissAction: string;
  renameAction: string;
  openAllAction: string;
  renameTitle: string;
  renameDescription: string;
  renamePlaceholder: string;
  saveAction: string;
  cancelAction: string;
  fallbackDreamTitle: string;
  sourceLabels: Record<PatternMatchSource, string>;
};

function truncate(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function getEvidencePreview(dream: Dream) {
  return truncate(
    dream.text?.trim() || dream.transcript?.trim() || dream.title?.trim() || '',
    140,
  );
}

function formatEvidenceDate(dream: Dream, locale: AppLocale) {
  return getDreamDate(dream).toLocaleDateString(
    locale === 'uk' ? 'uk-UA' : 'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    },
  );
}

function buildCandidate(
  dreams: Dream[],
  signal: string,
  kind: PatternMatchKind,
  dreamCount: number,
  locale: AppLocale,
  feedback: MemoryPatternFeedbackRecord | undefined,
): MemoryPatternCandidate | null {
  const matches = getPatternDreamMatches(dreams, signal, kind);
  if (matches.length < 2) {
    return null;
  }

  return {
    key: buildMemoryPatternKey(signal, kind),
    signal,
    kind,
    displayTitle: feedback?.customTitle ?? signal,
    dreamCount,
    confirmed: feedback?.status === 'confirmed',
    evidence: matches.slice(0, 3).map(match => ({
      dreamId: match.dream.id,
      title: match.dream.title?.trim() || '',
      dateLabel: formatEvidenceDate(match.dream, locale),
      preview: getEvidencePreview(match.dream),
      sources: match.sources,
    })),
  };
}

export function getMemoryPatternCandidates({
  dreams,
  locale,
  feedback,
}: {
  dreams: Dream[];
  locale: AppLocale;
  feedback: MemoryPatternFeedbackRecord[];
}) {
  const feedbackByKey = new Map(feedback.map(record => [record.key, record]));
  const signals = [
    ...getRecurringReflectionSignals(dreams, { limit: 8 }).map(signal => ({
      signal: signal.label,
      kind: 'theme' as const,
      dreamCount: signal.dreamCount,
      latestSeenAt: signal.latestSeenAt,
    })),
    ...getRecurringWordSignals(dreams, 8).map(signal => ({
      signal: signal.label,
      kind: 'word' as const,
      dreamCount: signal.dreamCount,
      latestSeenAt: signal.latestSeenAt,
    })),
  ];

  return signals
    .filter(signal => {
      const feedbackRecord = feedbackByKey.get(
        buildMemoryPatternKey(signal.signal, signal.kind),
      );
      return feedbackRecord?.status !== 'dismissed';
    })
    .sort((left, right) => {
      const leftFeedback = feedbackByKey.get(
        buildMemoryPatternKey(left.signal, left.kind),
      );
      const rightFeedback = feedbackByKey.get(
        buildMemoryPatternKey(right.signal, right.kind),
      );
      const confirmationDelta =
        Number(rightFeedback?.status === 'confirmed') -
        Number(leftFeedback?.status === 'confirmed');
      if (confirmationDelta !== 0) {
        return confirmationDelta;
      }

      if (right.dreamCount !== left.dreamCount) {
        return right.dreamCount - left.dreamCount;
      }

      if (right.latestSeenAt !== left.latestSeenAt) {
        return right.latestSeenAt - left.latestSeenAt;
      }

      if (left.kind !== right.kind) {
        return left.kind === 'theme' ? -1 : 1;
      }

      return left.signal.localeCompare(right.signal);
    })
    .map(signal =>
      buildCandidate(
        dreams,
        signal.signal,
        signal.kind,
        signal.dreamCount,
        locale,
        feedbackByKey.get(buildMemoryPatternKey(signal.signal, signal.kind)),
      ),
    )
    .filter((candidate): candidate is MemoryPatternCandidate =>
      Boolean(candidate),
    );
}

export function getPrimaryMemoryPattern(input: {
  dreams: Dream[];
  locale: AppLocale;
  feedback: MemoryPatternFeedbackRecord[];
}) {
  return getMemoryPatternCandidates(input)[0] ?? null;
}

export function getMemoryPatternCopy(locale: AppLocale): MemoryPatternCopy {
  if (locale === 'uk') {
    return {
      eyebrow: 'Можливий патерн',
      confirmedEyebrow: 'Підтверджений патерн',
      hypothesis:
        'Це локальна гіпотеза на основі повторів у твоїх записах, а не готове тлумачення сну.',
      evidenceTitle: 'Чому Memory це помітила',
      countLabel: value => `Повторюється у ${value} снах`,
      confirmAction: 'Підтвердити',
      confirmedAction: 'Підтверджено',
      dismissAction: 'Не пов’язано',
      renameAction: 'Перейменувати',
      openAllAction: 'Переглянути всі',
      renameTitle: 'Назва патерну',
      renameDescription:
        'Назва зміниться лише у твоїй Memory. Пошук доказів продовжить використовувати початковий сигнал.',
      renamePlaceholder: 'Введи власну назву',
      saveAction: 'Зберегти',
      cancelAction: 'Скасувати',
      fallbackDreamTitle: 'Сон без назви',
      sourceLabels: {
        tag: 'тег',
        title: 'назва',
        text: 'нотатки',
        transcript: 'транскрипт',
      },
    };
  }

  return {
    eyebrow: 'Possible pattern',
    confirmedEyebrow: 'Confirmed pattern',
    hypothesis:
      'This is a local hypothesis based on repetition in your entries, not a finished dream interpretation.',
    evidenceTitle: 'Why Memory noticed it',
    countLabel: value => `Repeated across ${value} dreams`,
    confirmAction: 'Confirm',
    confirmedAction: 'Confirmed',
    dismissAction: 'Not related',
    renameAction: 'Rename',
    openAllAction: 'View all',
    renameTitle: 'Pattern name',
    renameDescription:
      'The name changes only in your Memory. Evidence matching keeps using the original signal.',
    renamePlaceholder: 'Enter your own name',
    saveAction: 'Save',
    cancelAction: 'Cancel',
    fallbackDreamTitle: 'Untitled dream',
    sourceLabels: {
      tag: 'tag',
      title: 'title',
      text: 'notes',
      transcript: 'transcript',
    },
  };
}
