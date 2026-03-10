import React from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
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
};

export function MonthlyReportSections({
  copy,
  styles,
  viewModel,
}: MonthlyReportSectionsProps) {
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

      <Animated.View entering={FadeInDown.delay(30).duration(220)} layout={monthlyReportLayoutTransition}>
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

      <Animated.View entering={FadeInDown.delay(60).duration(220)} layout={monthlyReportLayoutTransition}>
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
