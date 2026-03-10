import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
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
import {
  StatsContentSections,
  StatsHeroSection,
  StatsMilestonesSection,
} from '../components/StatsScreenSections';

export default function StatsScreen() {
  const theme = useTheme<Theme>();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getStatsCopy(locale), [locale]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const styles = createStatsScreenStyles(theme);

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
    openPatternDetail,
  });

  if (!controller.dreams.length) {
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

  return (
    <ScreenContainer scroll>
      <StatsHeroSection
        copy={copy}
        styles={styles}
        selectedRange={controller.selectedRange}
        onSelectRange={controller.setSelectedRange}
        rangeOptions={controller.rangeOptions}
        selectedMode={controller.selectedMode}
        onSelectMode={controller.setSelectedMode}
        compareOptions={controller.compareOptions}
        heroSummaryTiles={controller.heroSummaryTiles}
        canCompare={controller.canCompare}
        selectedRangeLabel={controller.selectedRangeLabel}
        compareMetrics={controller.compareMetrics}
        activityBars={controller.activityBars}
        topSignal={controller.topSignal}
        coverageGap={controller.coverageGap}
      />

      {!controller.scopedDreams.length ? (
        <ScreenStateCard
          variant="empty"
          title={copy.emptyTitle}
          subtitle={copy.emptyDescription}
        />
      ) : (
        <StatsContentSections
          copy={copy}
          styles={styles}
          latestMonthlyReport={controller.latestMonthlyReport}
          latestMonthlyReportTitle={controller.latestMonthlyReportTitle}
          monthlyReportPreviewSignals={controller.monthlyReportPreviewSignals}
          onOpenMonthlyReport={() => navigation.navigate(ROOT_ROUTE_NAMES.MonthlyReport)}
          fingerprintLeadSignals={controller.fingerprintLeadSignals}
          fingerprintFacets={controller.fingerprintFacets}
          patternGroups={controller.patternGroups}
          activePatternGroup={controller.activePatternGroup}
          selectedPatternGroup={controller.selectedPatternGroup}
          onSelectPatternGroup={controller.setSelectedPatternGroup}
          isDetailsExpanded={controller.isDetailsExpanded}
          onToggleDetails={() => controller.setIsDetailsExpanded(current => !current)}
          summaryTiles={controller.summaryTiles}
          overallLastSevenDays={controller.overallLastSevenDays}
          coverageItems={controller.coverageItems}
          attentionItems={controller.attentionItems}
        />
      )}

      <StatsMilestonesSection
        copy={copy}
        styles={styles}
        overallLastSevenDays={controller.overallLastSevenDays}
        weeklyGoalTarget={controller.weeklyGoalTarget}
        weeklyGoalComplete={controller.weeklyGoalComplete}
        unlockedCount={controller.achievementSummary.unlockedCount}
        totalCount={controller.achievementSummary.totalCount}
        milestoneSummaryHint={controller.milestoneSummaryHint}
        onOpenProgress={() => navigation.navigate(ROOT_ROUTE_NAMES.Progress)}
      />
    </ScreenContainer>
  );
}
