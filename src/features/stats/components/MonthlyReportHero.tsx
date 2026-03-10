import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import type { MonthlyReportData, MonthlyReportMonth } from '../model/monthlyReport';
import {
  getMonthlyReportCoverSignals,
  type MonthlyReportCopyShape,
  type MonthlyReportViewModel,
} from '../model/monthlyReportPresentation';
import type { MonthlyReportScreenStyles } from '../screens/MonthlyReportScreen.styles';

const monthlyReportLayoutTransition = LinearTransition.springify()
  .damping(18)
  .stiffness(180);

type MonthlyReportHeroProps = {
  copy: MonthlyReportCopyShape;
  styles: MonthlyReportScreenStyles;
  months: MonthlyReportMonth[];
  selectedMonthKey?: string;
  viewModel: MonthlyReportViewModel;
  wakeEmotionLabels: Record<string, string>;
  preSleepEmotionLabels: Record<string, string>;
  report: MonthlyReportData;
  onBack: () => void;
  onSelectMonth: (monthKey: string) => void;
  onToggleSaveForLater: () => void;
  onShareReport: () => void;
};

export function MonthlyReportHero({
  copy,
  styles,
  months,
  selectedMonthKey,
  viewModel,
  wakeEmotionLabels,
  preSleepEmotionLabels,
  report,
  onBack,
  onSelectMonth,
  onToggleSaveForLater,
  onShareReport,
}: MonthlyReportHeroProps) {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.linear }),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [pulse, rotation]);

  const facetClusterStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 360}deg` }, { scale: 1 + pulse.value * 0.03 }],
    opacity: 0.9 - pulse.value * 0.12,
  }));

  const coverSignals = React.useMemo(
    () =>
      getMonthlyReportCoverSignals({
        report,
        wakeEmotionLabels,
        preSleepEmotionLabels,
      }),
    [preSleepEmotionLabels, report, wakeEmotionLabels],
  );

  return (
    <Animated.View layout={monthlyReportLayoutTransition}>
      <Card style={styles.heroCard}>
        <View pointerEvents="none" style={styles.heroGlowTop} />
        <View pointerEvents="none" style={styles.heroGlowBottom} />
        <Animated.View pointerEvents="none" style={[styles.heroFacetCluster, facetClusterStyle]}>
          <View style={[styles.heroFacet, styles.heroFacetPrimary]} />
          <View style={[styles.heroFacet, styles.heroFacetAccent]} />
          <View style={[styles.heroFacet, styles.heroFacetAlt]} />
        </Animated.View>

        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backLabel}>{copy.monthlyReportBackButton}</Text>
        </Pressable>

        <Text style={styles.eyebrow}>{copy.monthlyReportEyebrow}</Text>
        <SectionHeader
          title={copy.monthlyReportTitle}
          subtitle={copy.monthlyReportSubtitle}
          large
        />
        <Text style={styles.heroMonthTitle}>{viewModel.monthTitle}</Text>
        <View style={styles.heroMetaRow}>
          {viewModel.heroMetaChips.map(chip => (
            <View key={chip} style={styles.heroMetaChip}>
              <Text style={styles.heroMetaChipText}>{chip}</Text>
            </View>
          ))}
        </View>

        <View style={styles.monthStripBlock}>
          <Text style={styles.monthStripLabel}>{copy.monthlyReportMonthStripLabel}</Text>
          <View style={styles.monthStripRow}>
            {months.slice(0, 6).map(month => {
              const active = month.key === (selectedMonthKey ?? report.month.key);
              return (
                <Pressable
                  key={month.key}
                  style={[styles.monthChip, active ? styles.monthChipActive : null]}
                  onPress={() => onSelectMonth(month.key)}
                >
                  <Text style={[styles.monthChipText, active ? styles.monthChipTextActive : null]}>
                    {month.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.coverActionRow}>
          <Button
            title={
              viewModel.isSavedForLater
                ? copy.monthlyReportSavedAction
                : copy.monthlyReportSaveAction
            }
            variant={viewModel.isSavedForLater ? 'primary' : 'ghost'}
            size="sm"
            style={styles.coverActionButton}
            onPress={onToggleSaveForLater}
          />
          <Button
            title={copy.monthlyReportShareAction}
            variant="ghost"
            size="sm"
            style={styles.coverActionButton}
            onPress={onShareReport}
          />
        </View>

        <View style={styles.coverCard}>
          <Text style={styles.coverLabel}>{copy.monthlyReportCoverTitle}</Text>
          <Text style={styles.coverText}>{viewModel.coverText}</Text>
          {coverSignals.length ? (
            <View style={styles.coverSignalsRow}>
              {coverSignals.slice(0, 4).map(signal => (
                <View key={signal} style={styles.coverSignalChip}>
                  <Text style={styles.coverSignalChipText}>{signal}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <Text style={styles.coverHint}>
            {report.topWord
              ? `${copy.monthlyReportWordLabel}: ${report.topWord.label}`
              : copy.monthlyReportCoverEmpty}
          </Text>
        </View>
      </Card>
    </Animated.View>
  );
}
