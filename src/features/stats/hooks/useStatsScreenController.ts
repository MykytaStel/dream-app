import React from 'react';
import {
  getDreamPreSleepEmotionLabels,
  getDreamWakeEmotionLabels,
} from '../../../constants/copy/dreams';
import { getStatsCopy } from '../../../constants/copy/stats';
import { type AppLocale } from '../../../i18n/types';
import {
  filterDreamsByRange,
  type InsightRange,
  type PatternGroupKey,
} from '../model/statsScreenModel';
import { type PatternDetailKind } from '../../../app/navigation/routes';
import { type MemoryMode } from '../components/StatsScreenSections';
import { useStatsCatalogState } from './useStatsCatalogState';
import { useStatsDerivedContent } from './useStatsDerivedContent';

type StatsCopy = ReturnType<typeof getStatsCopy>;
export type InsightMode = 'snapshot' | 'compare';

type UseStatsScreenControllerArgs = {
  locale: AppLocale;
  copy: StatsCopy;
  selectedMemoryMode: MemoryMode;
  openPatternDetail: (signal: string, kind: PatternDetailKind) => void;
};

export function useStatsScreenController({
  locale,
  copy,
  selectedMemoryMode,
  openPatternDetail,
}: UseStatsScreenControllerArgs) {
  const isOverviewMode = selectedMemoryMode === 'overview';
  const isThreadsMode = selectedMemoryMode === 'threads';
  const isMonthlyMode = selectedMemoryMode === 'monthly';
  const preSleepEmotionLabels = React.useMemo(
    () => getDreamPreSleepEmotionLabels(locale),
    [locale],
  );
  const wakeEmotionLabels = React.useMemo(() => getDreamWakeEmotionLabels(locale), [locale]);
  const {
    analysisSettings,
    dreams,
    loadError,
    loading,
    meta,
    savedMonths,
    savedThreadRecords,
  } = useStatsCatalogState();
  const [selectedRange, setSelectedRange] = React.useState<InsightRange>('all');
  const [selectedMode, setSelectedMode] = React.useState<InsightMode>('snapshot');
  const [selectedPatternGroup, setSelectedPatternGroup] =
    React.useState<PatternGroupKey>('themes');
  const [isDetailsExpanded, setIsDetailsExpanded] = React.useState(false);
  const [isMilestonesExpanded, setIsMilestonesExpanded] = React.useState(false);

  const scopedDreams = React.useMemo(
    () => filterDreamsByRange(dreams, selectedRange),
    [dreams, selectedRange],
  );
  // Defer expensive derived computations so they don't block tab-switch renders
  const deferredDreams = React.useDeferredValue(dreams);
  const deferredScopedDreams = React.useDeferredValue(scopedDreams);
  const derivedContent = useStatsDerivedContent({
    locale,
    copy,
    dreams: deferredDreams,
    scopedDreams: deferredScopedDreams,
    selectedRange,
    isOverviewMode,
    isThreadsMode,
    isMonthlyMode,
    analysisSettings,
    savedMonths,
    savedThreadRecords,
    wakeEmotionLabels,
    preSleepEmotionLabels,
    openPatternDetail,
  });
  const rangeOptions = React.useMemo(
    () => [
      { key: 'all' as const, label: copy.rangeAll },
      { key: '30d' as const, label: copy.range30Days },
      { key: '7d' as const, label: copy.range7Days },
    ],
    [copy],
  );
  const canCompare = selectedRange !== 'all';
  const compareOptions = React.useMemo(
    () => [
      { key: 'snapshot' as const, label: copy.compareSnapshot, disabled: false },
      { key: 'compare' as const, label: copy.compareMode, disabled: !canCompare },
    ],
    [canCompare, copy],
  );
  const selectedRangeLabel =
    rangeOptions.find(option => option.key === selectedRange)?.label ?? copy.rangeAll;
  const {
    achievementSummary,
    achievements,
    activityBars,
    attentionItems,
    compareMetrics,
    coverageGap,
    coverageItems,
    emotionalTrendSeries,
    emotionalTrendInsight,
    fingerprintFacets,
    fingerprintLeadSignals,
    importantDreamItems,
    latestMonthlyReport,
    latestMonthlyReportTitle,
    memoryNudge,
    milestoneSummaryHint,
    monthlyReportPreviewSignals,
    overallLastSevenDays,
    patternGroups,
    savedMonthItems,
    savedOverviewThreadItems,
    savedSetItems,
    savedThreadItems,
    summaryTiles,
    topSignal,
    weeklyGoalComplete,
    weeklyGoalTarget,
    workQueueItems,
  } = derivedContent;
  const activePatternGroup =
    patternGroups.find(group => group.key === selectedPatternGroup) ?? patternGroups[0];

  React.useEffect(() => {
    if (!canCompare && selectedMode === 'compare') {
      setSelectedMode('snapshot');
    }
  }, [canCompare, selectedMode]);

  React.useEffect(() => {
    if (!isThreadsMode) {
      return;
    }

    if (!patternGroups.some(group => group.key === selectedPatternGroup)) {
      setSelectedPatternGroup(patternGroups[0]?.key ?? 'themes');
    }
  }, [isThreadsMode, patternGroups, selectedPatternGroup]);

  return {
    loading,
    loadError,
    meta,
    dreams,
    scopedDreams,
    selectedRange,
    setSelectedRange,
    selectedMode,
    setSelectedMode,
    selectedPatternGroup,
    setSelectedPatternGroup,
    isDetailsExpanded,
    setIsDetailsExpanded,
    isMilestonesExpanded,
    setIsMilestonesExpanded,
    rangeOptions,
    canCompare,
    compareOptions,
    selectedRangeLabel,
    compareMetrics,
    activityBars,
    emotionalTrendSeries,
    emotionalTrendInsight,
    topSignal,
    memoryNudge,
    coverageGap,
    latestMonthlyReport,
    latestMonthlyReportTitle,
    monthlyReportPreviewSignals,
    fingerprintLeadSignals,
    fingerprintFacets,
    patternGroups,
    activePatternGroup,
    summaryTiles,
    overallLastSevenDays,
    coverageItems,
    attentionItems,
    workQueueItems,
    importantDreamItems,
    savedSetItems,
    savedMonthItems,
    savedThreadItems,
    savedOverviewThreadItems,
    weeklyGoalTarget,
    weeklyGoalComplete,
    achievements,
    achievementSummary,
    milestoneSummaryHint,
  };
}
