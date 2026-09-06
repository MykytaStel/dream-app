import React from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { Card } from '../../../components/ui/Card';
import { Text } from '../../../components/ui/Text';
import { ScreenStateCard } from '../../dreams/components/ScreenStateCard';
import { getDreamCopy } from '../../../constants/copy/dreams';
import { getStatsCopy } from '../../../constants/copy/stats';
import { getPracticeCopy } from '../../../constants/copy/practice';
import {
  ROOT_ROUTE_NAMES,
  type PatternDetailKind,
  type RootStackParamList,
} from '../../../app/navigation/routes';
import { createStatsScreenStyles } from './StatsScreen.styles';
import { useStyles } from '../../../theme/useStyles';
import { useI18n } from '../../../i18n/I18nProvider';
import { useStatsScreenController } from '../hooks/useStatsScreenController';
import { StatsOverviewSections } from '../components/StatsOverviewSections';

export default function MemoryTrendsScreen() {
  const { locale } = useI18n();
  const copy = React.useMemo(() => getStatsCopy(locale), [locale]);
  const dreamCopy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const practiceCopy = React.useMemo(() => getPracticeCopy(locale), [locale]);
  const styles = useStyles(createStatsScreenStyles);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const openPatternDetail = React.useCallback(
    (signal: string, kind: PatternDetailKind) => {
      navigation.navigate(ROOT_ROUTE_NAMES.PatternDetail, { signal, kind });
    },
    [navigation],
  );

  const controller = useStatsScreenController({
    locale,
    copy,
    dreamCopy,
    selectedMemoryMode: 'overview',
    openPatternDetail,
  });

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: copy.memoryTrendsTitle });
  }, [copy.memoryTrendsTitle, navigation]);

  if (controller.loading) {
    return (
      <ScreenContainer scroll={false} withTopInset={false}>
        <ScreenStateCard
          variant="loading"
          title={copy.memoryTrendsTitle}
          subtitle={copy.memoryTrendsSubtitle}
        />
      </ScreenContainer>
    );
  }

  if (controller.loadError) {
    return (
      <ScreenContainer scroll={false} withTopInset={false}>
        <ScreenStateCard
          variant="error"
          title={dreamCopy.timelineErrorTitle}
          subtitle={dreamCopy.timelineErrorDescription}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll withTopInset={false}>
      <Card style={styles.heroCard}>
        <Text style={styles.storyHint}>{copy.memoryTrendsSubtitle}</Text>
        <View style={styles.rangeSection}>
          <Text style={styles.rangeLabel}>{copy.rangeLabel}</Text>
          <View style={styles.rangeRow}>
            {controller.rangeOptions.map(option => {
              const active = controller.selectedRange === option.key;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  key={option.key}
                  onPress={() => controller.setSelectedRange(option.key)}
                  style={[
                    styles.rangeChip,
                    active ? styles.rangeChipActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.rangeChipText,
                      active ? styles.rangeChipTextActive : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Card>

      <StatsOverviewSections
        alwaysExpanded
        copy={copy}
        styles={styles}
        fingerprintLeadSignals={controller.fingerprintLeadSignals}
        fingerprintFacets={controller.fingerprintFacets}
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
        nightmareRecoveryDescription={
          practiceCopy.statsNightmareRecoveryDescription
        }
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
          navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
            dreamId,
            source: 'stats',
          })
        }
        onOpenPatternDetail={openPatternDetail}
      />
    </ScreenContainer>
  );
}
