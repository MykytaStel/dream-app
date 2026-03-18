import { type AppLocale } from '../../../i18n/types';
import { type getStatsCopy } from '../../../constants/copy/stats';
import { type DreamCopy } from '../../../constants/copy/dreams';
import { type Dream } from '../../dreams/model/dream';
import { type DreamAnalysisSettings } from '../../analysis/model/dreamAnalysis';
import { type PatternDetailKind } from '../../../app/navigation/routes';
import { useStatsOverviewContent } from './useStatsOverviewContent';
import { useStatsThreadsContent } from './useStatsThreadsContent';
import { useStatsMonthlyContent } from './useStatsMonthlyContent';

type StatsCopy = ReturnType<typeof getStatsCopy>;

type UseStatsDerivedContentArgs = {
  locale: AppLocale;
  copy: StatsCopy;
  dreamCopy: DreamCopy;
  dreams: Dream[];
  scopedDreams: Dream[];
  selectedRange: 'all' | '30d' | '7d';
  isOverviewMode: boolean;
  isThreadsMode: boolean;
  isMonthlyMode: boolean;
  analysisSettings: DreamAnalysisSettings;
  savedMonths: Array<{ monthKey: string; savedAt: number }>;
  savedThreadRecords: Array<{
    signal: string;
    kind: 'word' | 'theme' | 'symbol';
    savedAt: number;
  }>;
  wakeEmotionLabels: Record<string, string>;
  moodLabels: Record<string, string>;
  preSleepEmotionLabels: Record<string, string>;
  openPatternDetail: (signal: string, kind: PatternDetailKind) => void;
};

export function useStatsDerivedContent({
  locale,
  copy,
  dreamCopy,
  dreams,
  scopedDreams,
  selectedRange,
  isOverviewMode,
  isThreadsMode,
  isMonthlyMode,
  analysisSettings,
  savedMonths,
  savedThreadRecords,
  wakeEmotionLabels,
  moodLabels,
  preSleepEmotionLabels,
  openPatternDetail,
}: UseStatsDerivedContentArgs) {
  const overview = useStatsOverviewContent({
    locale,
    copy,
    dreams,
    scopedDreams,
    selectedRange,
    analysisSettings,
    savedMonths,
    savedThreadRecords,
    wakeEmotionLabels,
    moodLabels,
    preSleepEmotionLabels,
    openPatternDetail,
    isOverviewMode,
    isThreadsMode,
  });
  const threads = useStatsThreadsContent({
    copy,
    dreamCopy,
    locale,
    scopedDreams,
    savedThreadRecords,
    isThreadsMode,
  });
  const monthly = useStatsMonthlyContent({
    locale,
    dreams,
    wakeEmotionLabels,
    isMonthlyMode,
  });

  return {
    ...overview,
    ...threads,
    ...monthly,
  };
}
