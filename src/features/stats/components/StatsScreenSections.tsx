import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { getStatsCopy } from '../../../constants/copy/stats';
import { MonthlyReportEntryCard } from './MonthlyReportEntryCard';
import { DreamFingerprintCard, type DreamFingerprintFacet } from './DreamFingerprintCard';
import { PatternGroupCard, type PatternGroupCardItem } from './PatternGroupCard';
import { createStatsScreenStyles } from '../screens/StatsScreen.styles';
import { formatCoverageValue, formatSignedDelta } from '../model/statsScreenModel';

type StatsCopy = ReturnType<typeof getStatsCopy>;
type StatsStyles = ReturnType<typeof createStatsScreenStyles>;

const statsLayoutTransition = LinearTransition.springify()
  .damping(18)
  .stiffness(180);

const disabledRangeChipStyle = { opacity: 0.45 };

export function StatsHeroSection({
  copy,
  styles,
  selectedRange,
  onSelectRange,
  rangeOptions,
  selectedMode,
  onSelectMode,
  compareOptions,
  heroSummaryTiles,
  canCompare,
  selectedRangeLabel,
  compareMetrics,
  activityBars,
  topSignal,
  coverageGap,
}: {
  copy: StatsCopy;
  styles: StatsStyles;
  selectedRange: string;
  onSelectRange: (value: any) => void;
  rangeOptions: ReadonlyArray<{ key: string; label: string }>;
  selectedMode: string;
  onSelectMode: (value: any) => void;
  compareOptions: ReadonlyArray<{ key: string; label: string; disabled: boolean }>;
  heroSummaryTiles: ReadonlyArray<{ label: string; value: number; hint: string }>;
  canCompare: boolean;
  selectedRangeLabel: string;
  compareMetrics: ReadonlyArray<{ label: string; current: number; previous: number }>;
  activityBars: ReadonlyArray<{ key: string; label: string; count: number }>;
  topSignal: { label: string; hint: string; onPress?: () => void } | null;
  coverageGap: { label: string; value: number } | null;
}) {
  return (
    <Animated.View layout={statsLayoutTransition}>
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <SectionHeader title={copy.title} subtitle={copy.subtitle} large />
        </View>

        <View style={styles.heroTopGrid}>
          <View style={styles.rangeSection}>
            <Text style={styles.rangeLabel}>{copy.rangeLabel}</Text>
            <View style={styles.rangeRow}>
              {rangeOptions.map(option => {
                const active = selectedRange === option.key;
                return (
                  <Pressable
                    key={option.key}
                    style={[styles.rangeChip, active ? styles.rangeChipActive : null]}
                    onPress={() => onSelectRange(option.key)}
                  >
                    <Text
                      style={[styles.rangeChipText, active ? styles.rangeChipTextActive : null]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.rangeSection}>
            <Text style={styles.rangeLabel}>{copy.compareLabel}</Text>
            <View style={styles.rangeRow}>
              {compareOptions.map(option => {
                const active = selectedMode === option.key;
                return (
                  <Pressable
                    key={option.key}
                    disabled={option.disabled}
                    style={[
                      styles.rangeChip,
                      active ? styles.rangeChipActive : null,
                      option.disabled ? disabledRangeChipStyle : null,
                    ]}
                    onPress={() => onSelectMode(option.key)}
                  >
                    <Text
                      style={[styles.rangeChipText, active ? styles.rangeChipTextActive : null]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.summaryRow}>
          {heroSummaryTiles.map(tile => (
            <View key={tile.label} style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{tile.label}</Text>
              <Text style={styles.summaryValue}>{tile.value}</Text>
              <Text style={styles.summaryHint}>{tile.hint}</Text>
            </View>
          ))}
        </View>

        {selectedMode === 'compare' && canCompare ? (
          <Animated.View
            entering={FadeInDown.duration(220)}
            layout={statsLayoutTransition}
            style={styles.comparePanel}
          >
            <View style={styles.comparePanelHeader}>
              <Text style={styles.comparePanelTitle}>
                {`${copy.compareCurrentPeriod}: ${selectedRangeLabel}`}
              </Text>
              <Text style={styles.comparePanelSubtitle}>
                {`${copy.comparePreviousPeriod}: ${selectedRangeLabel}`}
              </Text>
            </View>

            <View style={styles.compareMetricGrid}>
              {compareMetrics.map(metric => {
                const delta = metric.current - metric.previous;
                const deltaStyle =
                  delta > 0
                    ? styles.compareMetricDeltaPositive
                    : delta < 0
                      ? styles.compareMetricDeltaNegative
                      : styles.compareMetricDeltaNeutral;

                return (
                  <View key={metric.label} style={styles.compareMetricTile}>
                    <Text style={styles.compareMetricLabel}>{metric.label}</Text>
                    <Text style={styles.compareMetricValue}>{metric.current}</Text>
                    <Text style={[styles.compareMetricMeta, deltaStyle]}>
                      {`${formatSignedDelta(delta)} ${copy.compareDeltaLabel}`}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(220)} layout={statsLayoutTransition}>
            <View style={styles.overviewPanel}>
              <View style={styles.overviewPanelHeader}>
                <Text style={styles.overviewPanelTitle}>{copy.overviewActivityTitle}</Text>
                <Text style={styles.overviewPanelSubtitle}>
                  {copy.overviewActivityDescription}
                </Text>
              </View>

              <View style={styles.activityBarsRow}>
                {activityBars.map(bar => {
                  const maxCount = Math.max(...activityBars.map(item => item.count), 1);
                  const height = bar.count > 0 ? Math.max(10, (bar.count / maxCount) * 48) : 4;

                  return (
                    <View key={bar.key} style={styles.activityBarColumn}>
                      <View style={styles.activityBarTrack}>
                        <View style={[styles.activityBarFill, { height }]} />
                      </View>
                      <Text style={styles.activityBarLabel}>{bar.label}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.storyRow}>
                <Pressable
                  disabled={!topSignal?.onPress}
                  onPress={topSignal?.onPress}
                  style={({ pressed }) => [
                    styles.storyCard,
                    styles.storyCardAccent,
                    pressed && topSignal?.onPress ? styles.insightCardPressed : null,
                  ]}
                >
                  <Text style={styles.storyLabel}>{copy.overviewTopSignalLabel}</Text>
                  <Text style={styles.storyValue} numberOfLines={2}>
                    {topSignal?.label ?? copy.overviewTopSignalEmpty}
                  </Text>
                  <Text style={styles.storyHint} numberOfLines={2}>
                    {topSignal?.hint ?? copy.takeawayThemesEmpty}
                  </Text>
                </Pressable>

                <View style={styles.storyCard}>
                  <Text style={styles.storyLabel}>{copy.overviewNextStepLabel}</Text>
                  <Text style={styles.storyValue} numberOfLines={2}>
                    {coverageGap?.value ? coverageGap.label : copy.overviewNextStepEmpty}
                  </Text>
                  <Text style={styles.storyHint} numberOfLines={2}>
                    {coverageGap?.value ? `${coverageGap.value} ${copy.entries}` : copy.takeawayGapsEmpty}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}
      </Card>
    </Animated.View>
  );
}

export function StatsContentSections({
  copy,
  styles,
  latestMonthlyReport,
  latestMonthlyReportTitle,
  monthlyReportPreviewSignals,
  onOpenMonthlyReport,
  fingerprintLeadSignals,
  fingerprintFacets,
  patternGroups,
  activePatternGroup,
  selectedPatternGroup,
  onSelectPatternGroup,
  isDetailsExpanded,
  onToggleDetails,
  summaryTiles,
  overallLastSevenDays,
  coverageItems,
  attentionItems,
}: {
  copy: StatsCopy;
  styles: StatsStyles;
  latestMonthlyReport: { entryCount: number; totalWords: number } | null;
  latestMonthlyReportTitle: string | null;
  monthlyReportPreviewSignals: string[];
  onOpenMonthlyReport: () => void;
  fingerprintLeadSignals: string[];
  fingerprintFacets: DreamFingerprintFacet[];
  patternGroups: ReadonlyArray<{
    key: string;
    label: string;
    description: string;
    values: PatternGroupCardItem[];
    empty: string;
  }>;
  activePatternGroup: {
    key: string;
    label: string;
    description: string;
    values: PatternGroupCardItem[];
    empty: string;
  } | undefined;
  selectedPatternGroup: string;
  onSelectPatternGroup: (key: any) => void;
  isDetailsExpanded: boolean;
  onToggleDetails: () => void;
  summaryTiles: ReadonlyArray<{ label: string; value: number }>;
  overallLastSevenDays: number;
  coverageItems: ReadonlyArray<{ label: string; value: number; total: number; hint: string }>;
  attentionItems: ReadonlyArray<{ label: string; value: number; hint: string }>;
}) {
  return (
    <>
      <Animated.View layout={statsLayoutTransition}>
        <Card style={styles.sectionCard}>
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

      <Animated.View layout={statsLayoutTransition}>
        <Card style={styles.sectionCard}>
          <DreamFingerprintCard
            title={copy.fingerprintTitle}
            description={copy.fingerprintDescription}
            leadLabel={copy.fingerprintLeadLabel}
            leadSignals={fingerprintLeadSignals}
            emptyLabel={copy.fingerprintEmpty}
            facets={fingerprintFacets}
          />
        </Card>
      </Animated.View>

      <Animated.View layout={statsLayoutTransition}>
        <Card style={styles.sectionCard}>
          <SectionHeader title={copy.patternsTitle} subtitle={copy.patternsDescription} />
          <View style={styles.patternTabsRow}>
            {patternGroups.map(group => {
              const active = group.key === selectedPatternGroup;

              return (
                <Pressable
                  key={group.key}
                  style={[styles.patternTabChip, active ? styles.patternTabChipActive : null]}
                  onPress={() => onSelectPatternGroup(group.key)}
                >
                  <Text
                    style={[
                      styles.patternTabChipText,
                      active ? styles.patternTabChipTextActive : null,
                    ]}
                  >
                    {group.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.patternGroupList}>
            {activePatternGroup ? (
              <PatternGroupCard
                key={activePatternGroup.key}
                title={activePatternGroup.label}
                description={activePatternGroup.description}
                items={activePatternGroup.values}
                emptyLabel={activePatternGroup.empty}
                leadLabel={copy.patternsTopLabel}
                moreLabel={copy.patternsMoreLabel}
              />
            ) : null}
          </View>
        </Card>
      </Animated.View>

      <Animated.View layout={statsLayoutTransition}>
        <Card style={styles.sectionCard}>
          <Pressable style={styles.detailsToggleRow} onPress={onToggleDetails}>
            <View style={styles.detailsToggleCopy}>
              <Text style={styles.detailsToggleTitle}>{copy.detailsTitle}</Text>
              <Text style={styles.detailsToggleDescription}>{copy.detailsDescription}</Text>
            </View>
            <View style={styles.detailsTogglePill}>
              <Text style={styles.detailsTogglePillText}>
                {isDetailsExpanded ? copy.detailsHide : copy.detailsShow}
              </Text>
              <Ionicons
                name={isDetailsExpanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color="#F7F9FF"
              />
            </View>
          </Pressable>

          {isDetailsExpanded ? (
            <Animated.View
              entering={FadeInDown.duration(180)}
              layout={statsLayoutTransition}
              style={styles.detailsSectionContent}
            >
              <View>
                <SectionHeader title={copy.snapshotTitle} subtitle={copy.snapshotDescription} />
                <View style={styles.metricGrid}>
                  <View style={styles.metricTile}>
                    <Text style={styles.metricLabel}>{copy.lastSevenDays}</Text>
                    <Text style={styles.metricValue}>{overallLastSevenDays}</Text>
                  </View>
                  {summaryTiles.map(tile => (
                    <View key={tile.label} style={styles.metricTile}>
                      <Text style={styles.metricLabel}>{tile.label}</Text>
                      <Text style={styles.metricValue}>{tile.value}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.detailsSubsection}>
                <SectionHeader title={copy.coverageTitle} subtitle={copy.coverageDescription} />
                <View style={styles.detailsList}>
                  {coverageItems.map(item => (
                    <View key={item.label} style={styles.detailsListRow}>
                      <View style={styles.detailsListHeader}>
                        <View style={styles.detailsListCopy}>
                          <Text style={styles.detailsListLabel}>{item.label}</Text>
                          <Text style={styles.detailsListHint}>{item.hint}</Text>
                        </View>
                        <View style={styles.detailsListValueChip}>
                          <Text style={styles.detailsListValue}>
                            {formatCoverageValue(item.value, item.total)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.detailsSubsection}>
                <SectionHeader title={copy.attentionTitle} subtitle={copy.attentionDescription} />
                <View style={styles.detailsList}>
                  {attentionItems.map(item => (
                    <View key={item.label} style={styles.detailsListRow}>
                      <View style={styles.detailsListHeader}>
                        <View style={styles.detailsListCopy}>
                          <Text style={styles.detailsListLabel}>{item.label}</Text>
                          <Text style={styles.detailsListHint}>{item.hint}</Text>
                        </View>
                        <View style={styles.detailsListValueChip}>
                          <Text style={styles.detailsListValue}>{item.value}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
          ) : null}
        </Card>
      </Animated.View>
    </>
  );
}

export function StatsMilestonesSection({
  copy,
  styles,
  overallLastSevenDays,
  weeklyGoalTarget,
  weeklyGoalComplete,
  unlockedCount,
  totalCount,
  milestoneSummaryHint,
  onOpenProgress,
}: {
  copy: StatsCopy;
  styles: StatsStyles;
  overallLastSevenDays: number;
  weeklyGoalTarget: number;
  weeklyGoalComplete: boolean;
  unlockedCount: number;
  totalCount: number;
  milestoneSummaryHint: string;
  onOpenProgress: () => void;
}) {
  return (
    <Animated.View layout={statsLayoutTransition}>
      <Card style={styles.sectionCard}>
        <SectionHeader title={copy.milestonesTitle} subtitle={copy.milestonesDescription} />

        <View style={styles.teaserRow}>
          <View style={styles.teaserCard}>
            <Text style={styles.teaserLabel}>{copy.weeklyGoalTitle}</Text>
            <Text style={styles.teaserValue}>{`${overallLastSevenDays}/${weeklyGoalTarget}`}</Text>
            <Text style={styles.teaserHint}>
              {weeklyGoalComplete ? copy.weeklyGoalStatusDone : copy.weeklyGoalStatusPending}
            </Text>
          </View>
          <View style={[styles.teaserCard, styles.teaserCardAccent]}>
            <Text style={styles.teaserLabel}>{copy.milestonesUnlockedLabel}</Text>
            <Text style={styles.teaserValue}>{`${unlockedCount}/${totalCount}`}</Text>
            <Text style={styles.teaserHint}>{milestoneSummaryHint}</Text>
          </View>
        </View>

        <Button
          title={copy.progressOpenButton}
          variant="ghost"
          size="sm"
          icon="chevron-forward"
          iconPosition="right"
          onPress={onOpenProgress}
        />
      </Card>
    </Animated.View>
  );
}
