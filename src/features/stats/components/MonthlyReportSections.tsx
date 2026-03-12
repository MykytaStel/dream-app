import React from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import type { MonthlyReportCopyShape, MonthlyReportViewModel } from '../model/monthlyReportPresentation';
import type { MonthlyReportScreenStyles } from '../screens/MonthlyReportScreen.styles';

const monthlyReportLayoutTransition = LinearTransition.springify()
  .damping(18)
  .stiffness(180);

type MonthlyReportSectionsProps = {
  copy: MonthlyReportCopyShape;
  styles: MonthlyReportScreenStyles;
  viewModel: MonthlyReportViewModel;
  onOpenRevisitDream: (dreamId: string) => void;
};

export function MonthlyReportSections({
  copy,
  styles,
  viewModel,
  onOpenRevisitDream,
}: MonthlyReportSectionsProps) {
  const revisitCue = viewModel.revisitCue;

  return (
    <>
      <Animated.View entering={FadeInDown.duration(220)} layout={monthlyReportLayoutTransition}>
        <Card style={styles.sectionCard}>
          <SectionHeader
            title={copy.monthlyReportHighlightsTitle}
            subtitle={copy.monthlyReportHighlightsDescription}
          />
          <View style={styles.metricLeadTile}>
            <Text style={styles.metricLeadLabel}>{viewModel.leadMetric.label}</Text>
            <Text style={styles.metricLeadValue}>{viewModel.leadMetric.value}</Text>
            <Text style={styles.metricLeadHint}>{viewModel.leadMetric.hint}</Text>
          </View>
          <View style={styles.metricGrid}>
            {viewModel.secondaryMetrics.map(tile => (
              <View key={tile.label} style={styles.metricTile}>
                <Text style={styles.metricLabel}>{tile.label}</Text>
                <Text style={styles.metricValue}>{tile.value}</Text>
                <Text style={styles.metricHint}>{tile.hint}</Text>
              </View>
            ))}
          </View>
        </Card>
      </Animated.View>

      {revisitCue ? (
        <Animated.View entering={FadeInDown.delay(20).duration(220)} layout={monthlyReportLayoutTransition}>
          <Card style={styles.sectionCard}>
            <SectionHeader
              title={copy.monthlyReportRevisitTitle}
              subtitle={copy.monthlyReportRevisitDescription}
            />
            <View style={styles.revisitCard}>
              <View style={styles.revisitBadge}>
                <Text style={styles.revisitBadgeText}>{revisitCue.badgeLabel}</Text>
              </View>
              <Text style={styles.revisitDreamTitle}>{revisitCue.dreamTitle}</Text>
              <Text style={styles.revisitReason}>{revisitCue.reason}</Text>
              <Button
                title={revisitCue.actionLabel}
                variant="ghost"
                size="sm"
                style={styles.revisitAction}
                onPress={() => onOpenRevisitDream(revisitCue.dreamId)}
              />
            </View>
          </Card>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(40).duration(220)} layout={monthlyReportLayoutTransition}>
        <Card style={styles.sectionCard}>
          <SectionHeader
            title={copy.monthlyReportSignalsTitle}
            subtitle={copy.monthlyReportSignalsDescription}
          />
          <View style={styles.signalLeadCard}>
            <Text style={styles.signalLabel}>{viewModel.leadSignal.label}</Text>
            <Text style={styles.signalLeadValue}>{viewModel.leadSignal.value}</Text>
            <Text style={styles.signalMeta}>{viewModel.leadSignal.meta}</Text>
          </View>
          <View style={styles.signalGrid}>
            {viewModel.secondarySignals.map(signal => (
              <View key={signal.label} style={styles.signalCard}>
                <Text style={styles.signalLabel}>{signal.label}</Text>
                <Text style={styles.signalValue}>{signal.value}</Text>
                <Text style={styles.signalMeta}>{signal.meta}</Text>
              </View>
            ))}
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(70).duration(220)} layout={monthlyReportLayoutTransition}>
        <Card style={styles.sectionCard}>
          <SectionHeader
            title={copy.monthlyReportGentleTitle}
            subtitle={copy.monthlyReportGentleDescription}
          />
          <View style={styles.calmGrid}>
            {viewModel.calmTiles.map(tile => (
              <View key={tile.label} style={styles.calmTile}>
                <Text style={styles.calmValue}>{tile.value}</Text>
                <Text style={styles.calmLabel}>{tile.label}</Text>
              </View>
            ))}
          </View>
        </Card>
      </Animated.View>
    </>
  );
}
