import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Card } from '../../../components/ui/Card';
import { Text } from '../../../components/ui/Text';
import { MonthlyReportEntryCard } from './MonthlyReportEntryCard';
import {
  statsLayoutTransition,
  type StatsCopy,
  type StatsStyles,
} from './StatsScreenSection.shared';

export function StatsMonthlySections({
  copy,
  styles,
  latestMonthlyReport,
  latestMonthlyReportTitle,
  monthlyReportPreviewSignals,
  onOpenMonthlyReport,
}: {
  copy: StatsCopy;
  styles: StatsStyles;
  latestMonthlyReport: { entryCount: number; totalWords: number } | null;
  latestMonthlyReportTitle: string | null;
  monthlyReportPreviewSignals: string[];
  onOpenMonthlyReport: () => void;
}) {
  return (
    <Animated.View layout={statsLayoutTransition}>
      <Card style={styles.sectionCard}>
        {latestMonthlyReport ? (
          <View style={styles.teaserRow}>
            <View style={styles.teaserCard}>
              <Text style={styles.teaserLabel}>{copy.entries}</Text>
              <Text style={styles.teaserValue}>{latestMonthlyReport.entryCount}</Text>
              <Text style={styles.teaserHint}>{latestMonthlyReportTitle ?? copy.monthLabel}</Text>
            </View>
            <View style={[styles.teaserCard, styles.teaserCardAccent]}>
              <Text style={styles.teaserLabel}>{copy.monthlyReportWordsLabel}</Text>
              <Text style={styles.teaserValue}>{latestMonthlyReport.totalWords}</Text>
              <Text style={styles.teaserHint}>
                {monthlyReportPreviewSignals.length
                  ? monthlyReportPreviewSignals.join(' • ')
                  : copy.monthlyReportSignalsDescription}
              </Text>
            </View>
          </View>
        ) : null}

        <MonthlyReportEntryCard
          eyebrow={copy.monthlyReportEyebrow}
          title={copy.monthlyReportTitle}
          monthTitle={latestMonthlyReportTitle}
          description={copy.monthlyReportSubtitle}
          signals={monthlyReportPreviewSignals}
          summary={
            latestMonthlyReport
              ? `${latestMonthlyReport.entryCount} ${copy.entries.toLowerCase()} • ${latestMonthlyReport.totalWords} ${copy.monthlyReportWordsLabel.toLowerCase()}`
              : null
          }
          actionLabel={copy.monthlyReportOpenButton}
          onPress={onOpenMonthlyReport}
        />
      </Card>
    </Animated.View>
  );
}
