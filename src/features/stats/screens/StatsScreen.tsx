import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { Card } from '../../../components/ui/Card';
import { SkeletonBlock } from '../../../components/ui/SkeletonBlock';
import { getDreamCopy } from '../../../constants/copy/dreams';
import { getStatsCopy } from '../../../constants/copy/stats';
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
import { getPatternDreamMatches } from '../model/patternMatches';
import {
  StatsHeroSection,
  StatsMilestonesSection,
  StatsMonthlySections,
  StatsOverviewSections,
  StatsThreadsSections,
  type MemoryMode,
} from '../components/StatsScreenSections';

type ActiveThreadSelection = {
  signal: string;
  kind: PatternDetailKind;
};

function getPatternKindSubtitle(kind: PatternDetailKind, copy: ReturnType<typeof getStatsCopy>) {
  switch (kind) {
    case 'word':
      return copy.patternDetailWordDescription;
    case 'theme':
      return copy.patternDetailThemeDescription;
    case 'symbol':
      return copy.patternDetailSymbolDescription;
  }
}

function getPatternKindLabel(kind: PatternDetailKind, copy: ReturnType<typeof getStatsCopy>) {
  switch (kind) {
    case 'word':
      return copy.patternDetailWordLabel;
    case 'theme':
      return copy.patternDetailThemeLabel;
    case 'symbol':
      return copy.patternDetailSymbolLabel;
  }
}

export default function StatsScreen() {
  const theme = useTheme<Theme>();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getStatsCopy(locale), [locale]);
  const dreamCopy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const styles = createStatsScreenStyles(theme);
  const [activeThread, setActiveThread] = React.useState<ActiveThreadSelection | null>(null);
  const [selectedMemoryMode, setSelectedMemoryMode] =
    React.useState<MemoryMode>('overview');

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
      setActiveThread({
        signal,
        kind,
      });
    },
    [],
  );

  const controller = useStatsScreenController({
    locale,
    copy,
    selectedMemoryMode,
    openPatternDetail,
  });

  React.useEffect(() => {
    const hasActiveSelection = controller.activePatternGroup?.values.some(
      item =>
        item.signalKind === activeThread?.kind &&
        item.label === activeThread?.signal,
    );

    if (hasActiveSelection) {
      return;
    }

    const firstInteractiveSignal = controller.activePatternGroup?.values.find(
      item => item.signalKind,
    );

    if (!firstInteractiveSignal?.signalKind) {
      if (activeThread) {
        setActiveThread(null);
      }
      return;
    }

    setActiveThread({
      signal: firstInteractiveSignal.label,
      kind: firstInteractiveSignal.signalKind,
    });
  }, [activeThread, controller.activePatternGroup]);

  const activeThreadMatches = React.useMemo(
    () =>
      activeThread
        ? getPatternDreamMatches(controller.scopedDreams, activeThread.signal, activeThread.kind)
        : [],
    [activeThread, controller.scopedDreams],
  );
  const activeThreadLabel = activeThread
    ? getPatternKindLabel(activeThread.kind, copy)
    : null;
  const activeThreadDescription = activeThread
    ? getPatternKindSubtitle(activeThread.kind, copy)
    : null;
  const shouldShowScopedEmptyState =
    selectedMemoryMode !== 'monthly' && !controller.scopedDreams.length;

  if (controller.loading && controller.meta.totalCount > 0) {
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
        onSelectMemoryMode={setSelectedMemoryMode}
        memoryModeOptions={memoryModeOptions}
        selectedRange={controller.selectedRange}
        onSelectRange={controller.setSelectedRange}
        rangeOptions={controller.rangeOptions}
        selectedRangeLabel={controller.selectedRangeLabel}
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
              onToggleDetails={() => controller.setIsDetailsExpanded(current => !current)}
              selectedMode={controller.selectedMode}
              onSelectMode={controller.setSelectedMode}
              canCompare={controller.canCompare}
              selectedRangeLabel={controller.selectedRangeLabel}
              compareOptions={controller.compareOptions}
              compareMetrics={controller.compareMetrics}
              activityBars={controller.activityBars}
              summaryTiles={controller.summaryTiles}
              overallLastSevenDays={controller.overallLastSevenDays}
              coverageItems={controller.coverageItems}
              attentionItems={controller.attentionItems}
              workQueueItems={controller.workQueueItems}
              onOpenWorkQueueItem={(dreamId, focusSection) =>
                navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
                  dreamId,
                  focusSection,
                })
              }
            />
          ) : null}

          {selectedMemoryMode === 'threads' ? (
            <StatsThreadsSections
              copy={copy}
              styles={styles}
              patternGroups={controller.patternGroups}
              activePatternGroup={controller.activePatternGroup}
              selectedPatternGroup={controller.selectedPatternGroup}
              onSelectPatternGroup={controller.setSelectedPatternGroup}
              activeThread={activeThread}
              activeThreadLabel={activeThreadLabel}
              activeThreadDescription={activeThreadDescription}
              activeThreadMatches={activeThreadMatches}
              dreamCopy={dreamCopy}
              onOpenThreadDream={dreamId =>
                navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
                  dreamId,
                })
              }
              onClearThread={() => setActiveThread(null)}
            />
          ) : null}

          {selectedMemoryMode === 'monthly' ? (
            <StatsMonthlySections
              copy={copy}
              styles={styles}
              latestMonthlyReport={controller.latestMonthlyReport}
              latestMonthlyReportTitle={controller.latestMonthlyReportTitle}
              monthlyReportPreviewSignals={controller.monthlyReportPreviewSignals}
              onOpenMonthlyReport={() => navigation.navigate(ROOT_ROUTE_NAMES.MonthlyReport)}
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
          highlightedAchievementId={controller.achievementSummary.highlightedId ?? null}
          isExpanded={controller.isMilestonesExpanded}
          onToggleExpanded={() =>
            controller.setIsMilestonesExpanded(current => !current)
          }
        />
      ) : null}
    </ScreenContainer>
  );
}
