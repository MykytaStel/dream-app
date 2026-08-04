import type { AppLocale } from '../../../i18n/types';

export type MemoryDisclosureStage =
  | 'foundation'
  | 'signals'
  | 'connections'
  | 'threads'
  | 'deep';

export type MemoryDisclosureMode = 'overview' | 'threads' | 'monthly';

export type MemoryDisclosureState = {
  stage: MemoryDisclosureStage;
  dreamCount: number;
  availableModes: ReadonlyArray<MemoryDisclosureMode>;
  nextUnlockAt: number | null;
  remainingDreams: number;
};

export type MemoryDisclosureCopy = {
  title: string;
  description: string;
  progressLabel: string | null;
  detailsTitle: string;
  detailsDescription: string;
  showDetailsLabel: string;
  hideDetailsLabel: string;
};

function normalizeDreamCount(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

export function getMemoryDisclosureState(
  rawDreamCount: number,
): MemoryDisclosureState {
  const dreamCount = normalizeDreamCount(rawDreamCount);

  if (dreamCount >= 20) {
    return {
      stage: 'deep',
      dreamCount,
      availableModes: ['overview', 'threads', 'monthly'],
      nextUnlockAt: null,
      remainingDreams: 0,
    };
  }

  if (dreamCount >= 11) {
    return {
      stage: 'threads',
      dreamCount,
      availableModes: ['overview', 'threads'],
      nextUnlockAt: 20,
      remainingDreams: 20 - dreamCount,
    };
  }

  if (dreamCount >= 6) {
    return {
      stage: 'connections',
      dreamCount,
      availableModes: ['overview'],
      nextUnlockAt: 11,
      remainingDreams: 11 - dreamCount,
    };
  }

  if (dreamCount >= 3) {
    return {
      stage: 'signals',
      dreamCount,
      availableModes: ['overview'],
      nextUnlockAt: 6,
      remainingDreams: 6 - dreamCount,
    };
  }

  return {
    stage: 'foundation',
    dreamCount,
    availableModes: ['overview'],
    nextUnlockAt: 3,
    remainingDreams: 3 - dreamCount,
  };
}

export function isMemoryModeAvailable(
  state: MemoryDisclosureState,
  mode: MemoryDisclosureMode,
) {
  return state.availableModes.includes(mode);
}

function getUkrainianRecordLabel(value: number) {
  const mod10 = value % 10;
  const mod100 = value % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return 'запис';
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'записи';
  }

  return 'записів';
}

function getStageCopy(
  stage: MemoryDisclosureStage,
  locale: AppLocale,
): Pick<MemoryDisclosureCopy, 'title' | 'description'> {
  if (locale === 'uk') {
    switch (stage) {
      case 'foundation':
        return {
          title: 'Пам’ять формується',
          description:
            'Після кількох записів тут з’являться повторювані настрої й теги.',
        };
      case 'signals':
        return {
          title: 'Перші сигнали',
          description:
            'Уже можна помічати повторювані настрої та теги. Люди, місця й символи відкриються далі.',
        };
      case 'connections':
        return {
          title: 'Перші зв’язки',
          description:
            'Memory уже може зіставляти людей, місця й символи між різними снами.',
        };
      case 'threads':
        return {
          title: 'Нитки пам’яті',
          description:
            'Тижневі підсумки та прості нитки вже доступні. Місячні порівняння відкриються після 20 записів.',
        };
      case 'deep':
      default:
        return {
          title: 'Повна картина',
          description:
            'Доступні нитки, місячні огляди та складніші порівняння.',
        };
    }
  }

  switch (stage) {
    case 'foundation':
      return {
        title: 'Memory is forming',
        description:
          'Recurring moods and tags will appear after a few more entries.',
      };
    case 'signals':
      return {
        title: 'First signals',
        description:
          'Recurring moods and tags can now surface. People, places and symbols unlock next.',
      };
    case 'connections':
      return {
        title: 'First connections',
        description:
          'Memory can now connect people, places and symbols across dreams.',
      };
    case 'threads':
      return {
        title: 'Memory threads',
        description:
          'Weekly summaries and simple threads are available. Monthly comparisons unlock at 20 entries.',
      };
    case 'deep':
    default:
      return {
        title: 'Full picture',
        description:
          'Threads, monthly reviews and deeper comparisons are available.',
      };
  }
}

export function getMemoryDisclosureCopy(
  state: MemoryDisclosureState,
  locale: AppLocale,
): MemoryDisclosureCopy {
  const stageCopy = getStageCopy(state.stage, locale);
  const progressLabel = state.remainingDreams
    ? locale === 'uk'
      ? `Ще ${state.remainingDreams} ${getUkrainianRecordLabel(
          state.remainingDreams,
        )} до наступного рівня`
      : `${state.remainingDreams} more ${
          state.remainingDreams === 1 ? 'entry' : 'entries'
        } to the next level`
    : null;

  if (locale === 'uk') {
    return {
      ...stageCopy,
      progressLabel,
      detailsTitle: 'Детальна аналітика',
      detailsDescription:
        'Практика, тренди, порівняння, збережені набори й додаткові показники.',
      showDetailsLabel: 'Показати деталі',
      hideDetailsLabel: 'Сховати деталі',
    };
  }

  return {
    ...stageCopy,
    progressLabel,
    detailsTitle: 'Detailed analysis',
    detailsDescription:
      'Practice, trends, comparisons, saved sets and additional metrics.',
    showDetailsLabel: 'Show details',
    hideDetailsLabel: 'Hide details',
  };
}
