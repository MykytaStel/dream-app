import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { SkeletonBlock } from '../../../components/ui/SkeletonBlock';
import { getDreamCopy } from '../../../constants/copy/dreams';
import { getStatsCopy } from '../../../constants/copy/stats';
import { getPracticeCopy } from '../../../constants/copy/practice';
import {
  ROOT_ROUTE_NAMES,
  type PatternDetailKind,
  type RootStackParamList,
} from '../../../app/navigation/routes';
import { ScreenStateCard } from '../../dreams/components/ScreenStateCard';
import { Theme } from '../../../theme/theme';
import { createStatsScreenStyles } from './StatsScreen.styles';
import { useI18n } from '../../../i18n/I18nProvider';
import { useStatsScreenController } from '../hooks/useStatsScreenController';
import {
  StatsHeroSection,
  StatsMilestonesSection,
  StatsMonthlySections,
  StatsOverviewSections,
  StatsThreadsSections,
  type MemoryMode,
} from '../components/StatsScreenSections';

export default function StatsScreen() {
  const theme = useTheme<Theme>();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getStatsCopy(locale), [locale]);
  const dreamCopy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const practiceCopy = React.useMemo(() => getPracticeCopy(locale), [locale]);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const styles = React.useMemo(() => createStatsScreenStyles(theme), [theme]);
  const [selectedMemoryMode, setSelectedMemoryMode] =
    React.useState<MemoryMode>('overview');
  const handleSelectMemoryMode = React.useCallback((value: MemoryMode) => {
    React.startTransition(() => {
      setSelectedMemoryMode(value);
    });
  }, []);

  const memoryModeOptions = React.useMemo(
    () => [
      { value: 'overview' as const, label: copy.memoryModeOverview },
      { value: 'threads' as const, label: copy.memoryModeThreads },
      { value: 'monthly' as const, label: copy.memoryModeMonthly },
    ],
    [copy.memoryModeMonthly, copy.memoryModeOverview, copy.memoryModeThreads],
  );

  const openPatternDetail = React.useCallback(
    (signal: string, kind: PatternDetailKind) => {
      navigation.navigate(ROOT_ROUTE_NAMES.PatternDetail, {
        signal,
        kind,
      });
    },
    [navigation],
  );

  const controller = useStatsScreenController({
    locale,
    copy,
    dreamCopy,
    selectedMemoryMode,
    openPatternDetail,
  });
  const handleSelectRange = React.useCallback(
    (value: 'all' | '30d' | '7d') => {
      React.startTransition(() => {
        controller.setSelectedRange(value);
      });
    },
    [controller],
  );
  const shouldShowScopedEmptyState =
    selectedMemoryMode !== 'monthly' && !controller.scopedDreams.length;

  if (controller.loading) {
    return (
      <ScreenContainer scroll={false} style={styles.emptyContainer}>
        <Card style={styles.heroCard}>
          <SkeletonBlock width="38%" height={14} />
          <SkeletonBlock width="58%" height={26} />
          <SkeletonBlock width="100%" height={34} />
        </Card>
        <Card style={styles.sectionCard}>
          <SkeletonBlock width="42%" height={16} />
          <SkeletonBlock width="100%" height={88} />
        </Card>
        <Card style={styles.sectionCard}>
          <SkeletonBlock width="34%" height={16} />
          <SkeletonBlock width="100%" height={132} />
        </Card>
      </ScreenContainer>
    );
  }

  if (!controller.meta.totalCount) {
    return (
      <ScreenContainer scroll={false} style={styles.emptyContainer}>
        <ScreenStateCard
          variant="empty"
          title={copy.emptyTitle}
          subtitle={copy.emptyDescription}
        />
      </ScreenContainer>
    );
  }

  if (controller.loadError) {
    return (
      <ScreenContainer scroll={false} style={styles.emptyContainer}>
        <ScreenStateCard
          variant="error"
          title={dreamCopy.timelineErrorTitle}
          subtitle={dreamCopy.timelineErrorDescription}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <StatsHeroSection
        copy={copy}
        styles={styles}
        selectedMemoryMode={selectedMemoryMode}
        onSelectMemoryMode={handleSelectMemoryMode}
        memoryModeOptions={memoryModeOptions}
        selectedRange={controller.selectedRange}
        onSelectRange={handleSelectRange}
        rangeOptions={controller.rangeOptions}
        topSignal={controller.topSignal}
        memoryNudge={controller.memoryNudge}
        onOpenMemoryNudge={(dreamId, focusSection) =>
          navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
            dreamId,
            focusSection,
          })
        }
        coverageGap={controller.coverageGap}
      />

      <Card style={styles.sectionCard}>
        <SectionHeader
          title={practiceCopy.title}
          subtitle={practiceCopy.subtitle}
        />
        <Button
          title={
            controller.nightmareCount === 0
              ? practiceCopy.openLucid
              : practiceCopy.openNightmares
          }
          onPress={() =>
            navigation.navigate(ROOT_ROUTE_NAMES.DreamPractice, {
              focus:
                controller.nightmareCount === 0
                  ? 'lucid'
                  : 'nightmares',
              entrySource: 'stats',
            })
          }
        />
      </Card>

      {shouldShowScopedEmptyState ? (
        <ScreenStateCard
          variant="empty"
          title={copy.emptyTitle}
          subtitle={copy.emptyDescription}
        />
      ) : (
        <>
          {selectedMemoryMode === 'overview' ? (
            <StatsOverviewSections
              copy={copy}
              styles={styles}
              fingerprintLeadSignals={controller.fingerprintLeadSignals}
              fingerprintFacets={controller.fingerprintFacets}
              isDetailsExpanded={controller.isDetailsExpanded}
              onToggleDetails={() =>
                controller.setIsDetailsExpanded(current => !current)
              }
              selectedMode={controller.selectedMode}
              onSelectMode={controller.setSelectedMode}
              canCompare={controller.canCompare}
              selectedRangeLabel={controller.selectedRangeLabel}
              compareOptions={controller.compareOptions}
              compareMetrics={controller.compareMetrics}
              activityBars={controller.activityBars}
              emotionalTrendSeries={controller.emotionalTrendSeries}
              emotionalTrendInsight={controller.emotionalTrendInsight}
              lucidMetrics={controller.lucidMetrics}
              lucidHistoryItems={controller.lucidHistoryItems}
              nightmareMetrics={controller.nightmareMetrics}
              lucidProgressTitle={practiceCopy.statsLucidProgressTitle}
              lucidProgressDescription={practiceCopy.statsLucidProgressDescription}
              nightmareRecoveryTitle={practiceCopy.statsNightmareRecoveryTitle}
              nightmareRecoveryDescription={practiceCopy.statsNightmareRecoveryDescription}
              weeklyPatternCards={controller.weeklyPatternCards}
              summaryTiles={controller.summaryTiles}
              coverageItems={controller.coverageItems}
              attentionItems={controller.attentionItems}
              workQueueItems={controller.workQueueItems}
              importantDreamItems={controller.importantDreamItems}
              savedSetItems={controller.savedSetItems}
              onOpenReviewWorkspace={() =>
                navigation.navigate(ROOT_ROUTE_NAMES.ReviewWorkspace)
              }
              onOpenLucidDream={dreamId =>
                navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, { dreamId })
              }
              onOpenPatternDetail={openPatternDetail}
            />
          ) : null}

          {selectedMemoryMode === 'threads' ? (
            <StatsThreadsSections
              copy={copy}
              styles={styles}
              patternGroups={controller.patternGroups}
              savedThreadItems={controller.savedThreadItems}
              onOpenThreadDetail={openPatternDetail}
            />
          ) : null}

          {selectedMemoryMode === 'monthly' ? (
            <StatsMonthlySections
              copy={copy}
              styles={styles}
              latestMonthlyReport={controller.latestMonthlyReport}
              latestMonthlyReportTitle={controller.latestMonthlyReportTitle}
              monthlyReportPreviewSignals={
                controller.monthlyReportPreviewSignals
              }
              onOpenMonthlyReport={() =>
                navigation.navigate(ROOT_ROUTE_NAMES.MonthlyReport)
              }
            />
          ) : null}
        </>
      )}

      {selectedMemoryMode === 'overview' ? (
        <StatsMilestonesSection
          copy={copy}
          styles={styles}
          overallLastSevenDays={controller.overallLastSevenDays}
          weeklyGoalTarget={controller.weeklyGoalTarget}
          weeklyGoalComplete={controller.weeklyGoalComplete}
          unlockedCount={controller.achievementSummary.unlockedCount}
          totalCount={controller.achievementSummary.totalCount}
          milestoneSummaryHint={controller.milestoneSummaryHint}
          achievements={controller.achievements}
          highlightedAchievementId={
            controller.achievementSummary.highlightedId ?? null
          }
          isExpanded={controller.isMilestonesExpanded}
          onToggleExpanded={() =>
            controller.setIsMilestonesExpanded(current => !current)
          }
        />
      ) : null}
    </ScreenContainer>
  );
}
