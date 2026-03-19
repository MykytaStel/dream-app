import { AppLocale } from '../../i18n/types';

const WIDGET_COPY_EN = {
  localOnlyLabel: 'Private on device',
  emptySubtitle: 'Start with a fragment, feeling, or image before it fades.',
  revisitTitle: 'Revisit now',
  fallbackCaptureSubtitle: 'Open the lightest capture flow and keep the thread warm.',
  fallbackInsightSubtitle: 'A small local read from the dreams you already saved.',
  memoryAction: 'Memory',
  totalDreamSingle: '1 dream saved',
  totalDreamPrefix: '',
  totalDreamSuffix: ' dreams saved',
  weeklyEntrySingle: '1 entry this week',
  weeklyEntryPrefix: '',
  weeklyEntrySuffix: ' entries this week',
  streakSingle: '1 day streak',
  streakPrefix: '',
  streakSuffix: ' day streak',
};

const WIDGET_COPY_UK = {
  localOnlyLabel: 'Лише на пристрої',
  emptySubtitle: 'Почни з уривка, відчуття чи образу, поки сон не розчинився.',
  revisitTitle: 'Повернутись зараз',
  fallbackCaptureSubtitle: 'Відкрий найлегший режим запису й не дай нитці охолонути.',
  fallbackInsightSubtitle: 'Короткий локальний зріз зі снів, які ти вже зберіг.',
  memoryAction: 'Памʼять',
  totalDreamSingle: 'Збережено 1 сон',
  totalDreamPrefix: 'Збережено ',
  totalDreamSuffix: ' снів',
  weeklyEntrySingle: '1 запис цього тижня',
  weeklyEntryPrefix: '',
  weeklyEntrySuffix: ' записи цього тижня',
  streakSingle: '1 день поспіль',
  streakPrefix: '',
  streakSuffix: ' днів поспіль',
};

export type WidgetCopy = typeof WIDGET_COPY_EN;

export function getWidgetCopy(locale: AppLocale): WidgetCopy {
  return locale === 'uk' ? WIDGET_COPY_UK : WIDGET_COPY_EN;
}
