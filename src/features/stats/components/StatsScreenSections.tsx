import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card } from '../../../components/ui/Card';
import {
  SegmentedControl,
  type SegmentedControlOption,
} from '../../../components/ui/SegmentedControl';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { TagChip } from '../../../components/ui/TagChip';
import { Text } from '../../../components/ui/Text';
import type { DreamCopy } from '../../../constants/copy/dreams';
import { getStatsCopy } from '../../../constants/copy/stats';
import {
  type DreamAchievementId,
  type DreamAchievementProgress,
} from '../model/achievements';
import { type PatternDreamMatch, type PatternMatchSource } from '../model/patternMatches';
import { formatCoverageValue, formatSignedDelta } from '../model/statsScreenModel';
import { createStatsScreenStyles } from '../screens/StatsScreen.styles';
import { Theme } from '../../../theme/theme';
import { DreamFingerprintCard, type DreamFingerprintFacet } from './DreamFingerprintCard';
import { MonthlyReportEntryCard } from './MonthlyReportEntryCard';
import { PatternGroupCard, type PatternGroupCardItem } from './PatternGroupCard';

type StatsCopy = ReturnType<typeof getStatsCopy>;
type StatsStyles = ReturnType<typeof createStatsScreenStyles>;
export type MemoryMode = 'overview' | 'threads' | 'monthly';

const statsLayoutTransition = LinearTransition.springify()
  .damping(18)
  .stiffness(180);

const disabledRangeChipStyle = { opacity: 0.45 };

function getAchievementContent(
  id: DreamAchievementId,
  copy: ReturnType<typeof getStatsCopy>,
) {
  switch (id) {
    case 'first-dream':
      return {
        title: copy.milestoneFirstDreamTitle,
        description: copy.milestoneFirstDreamDescription,
      };
    case 'three-day-streak':
      return {
        title: copy.milestoneThreeDayStreakTitle,
        description: copy.milestoneThreeDayStreakDescription,
      };
    case 'ten-dreams':
      return {
        title: copy.milestoneTenDreamsTitle,
        description: copy.milestoneTenDreamsDescription,
      };
    case 'first-voice-dream':
      return {
        title: copy.milestoneFirstVoiceDreamTitle,
        description: copy.milestoneFirstVoiceDreamDescription,
      };
  }
}

function formatThreadPreview(match: PatternDreamMatch, dreamCopy: DreamCopy) {
  const text = match.dream.text?.trim();
  if (text) {
    return text.length > 120 ? `${text.slice(0, 117)}...` : text;
  }

  const transcript = match.dream.transcript?.trim();
  if (transcript) {
    const prefix =
      match.dream.transcriptSource === 'edited'
        ? `${dreamCopy.editedTranscriptPreviewPrefix}: `
        : `${dreamCopy.transcriptPreviewPrefix}: `;
    const visible = transcript.length > 96 ? `${transcript.slice(0, 93)}...` : transcript;
    return `${prefix}${visible}`;
  }

  if (match.dream.audioUri) {
    return dreamCopy.audioOnlyPreview;
  }

  return dreamCopy.noDetailsPreview;
}

function getSourceLabel(
  source: PatternMatchSource,
  copy: ReturnType<typeof getStatsCopy>,
) {
  switch (source) {
    case 'tag':
      return copy.patternDetailSourceTag;
    case 'title':
      return copy.patternDetailSourceTitle;
    case 'text':
      return copy.patternDetailSourceText;
    case 'transcript':
      return copy.patternDetailSourceTranscript;
  }
}

export function StatsHeroSection({
  copy,
  styles,
  selectedMemoryMode,
  onSelectMemoryMode,
  memoryModeOptions,
  selectedRange,
  onSelectRange,
  rangeOptions,
  selectedRangeLabel,
  topSignal,
  coverageGap,
}: {
  copy: StatsCopy;
  styles: StatsStyles;
  selectedMemoryMode: MemoryMode;
  onSelectMemoryMode: (value: MemoryMode) => void;
  memoryModeOptions: ReadonlyArray<SegmentedControlOption<MemoryMode>>;
  selectedRange: string;
  onSelectRange: (value: any) => void;
  rangeOptions: ReadonlyArray<{ key: string; label: string }>;
  selectedRangeLabel: string;
  topSignal: { label: string; hint: string; onPress?: () => void } | null;
  coverageGap: { label: string; value: number } | null;
}) {
  return (
    <Animated.View layout={statsLayoutTransition}>
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <SectionHeader title={copy.title} subtitle={copy.subtitle} large />
        </View>

        <View style={styles.modeSection}>
          <Text style={styles.rangeLabel}>{copy.memoryModeLabel}</Text>
          <SegmentedControl
            options={memoryModeOptions}
            selectedValue={selectedMemoryMode}
            onChange={onSelectMemoryMode}
          />
        </View>

        {selectedMemoryMode !== 'monthly' ? (
          <View style={styles.heroTopGrid}>
            <View
              style={[
                styles.rangeSection,
                selectedMemoryMode === 'threads' ? styles.rangeSectionWide : null,
              ]}
            >
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
          </View>
        ) : null}

        {selectedMemoryMode === 'overview' ? (
          <Animated.View entering={FadeInDown.duration(220)} layout={statsLayoutTransition}>
            <View style={styles.overviewPanel}>
              <View style={styles.overviewPanelHeader}>
                <Text style={styles.overviewPanelTitle}>{copy.spotlightTitle}</Text>
              </View>

              <Pressable
                disabled={!topSignal?.onPress}
                onPress={topSignal?.onPress}
                style={({ pressed }) => [
                  styles.storyCard,
                  styles.storyCardAccent,
                  styles.storyCardSingle,
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

              <Text style={styles.overviewNextStepHint}>
                {`${copy.overviewNextStepLabel}: ${
                  coverageGap?.value ? coverageGap.label : copy.overviewNextStepEmpty
                }`}
              </Text>
            </View>
          </Animated.View>
        ) : null}

        {selectedMemoryMode === 'threads' ? (
          <Animated.View entering={FadeInDown.duration(220)} layout={statsLayoutTransition}>
            <View style={styles.overviewPanel}>
              <View style={styles.overviewPanelHeader}>
                <Text style={styles.overviewPanelTitle}>{copy.patternsTitle}</Text>
                <Text style={styles.overviewPanelSubtitle}>{copy.patternsDescription}</Text>
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
                  <Text style={styles.storyLabel}>{copy.rangeLabel}</Text>
                  <Text style={styles.storyValue} numberOfLines={2}>
                    {selectedRangeLabel}
                  </Text>
                  <Text style={styles.storyHint} numberOfLines={2}>
                    {copy.memoryThreadDescription}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        ) : null}
      </Card>
    </Animated.View>
  );
}

export function StatsOverviewSections({
  copy,
  styles,
  fingerprintLeadSignals,
  fingerprintFacets,
  isDetailsExpanded,
  onToggleDetails,
  selectedMode,
  onSelectMode,
  canCompare,
  selectedRangeLabel,
  compareOptions,
  compareMetrics,
  activityBars,
  summaryTiles,
  overallLastSevenDays,
  coverageItems,
  attentionItems,
}: {
  copy: StatsCopy;
  styles: StatsStyles;
  fingerprintLeadSignals: string[];
  fingerprintFacets: DreamFingerprintFacet[];
  isDetailsExpanded: boolean;
  onToggleDetails: () => void;
  selectedMode: 'snapshot' | 'compare';
  onSelectMode: (value: 'snapshot' | 'compare') => void;
  canCompare: boolean;
  selectedRangeLabel: string;
  compareOptions: ReadonlyArray<{ key: 'snapshot' | 'compare'; label: string; disabled: boolean }>;
  compareMetrics: ReadonlyArray<{ label: string; current: number; previous: number }>;
  activityBars: ReadonlyArray<{ key: string; label: string; count: number }>;
  summaryTiles: ReadonlyArray<{ label: string; value: number }>;
  overallLastSevenDays: number;
  coverageItems: ReadonlyArray<{ label: string; value: number; total: number; hint: string }>;
  attentionItems: ReadonlyArray<{ label: string; value: number; hint: string }>;
}) {
  const t = useTheme<Theme>();

  return (
    <>
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
                color={t.colors.text}
              />
            </View>
          </Pressable>

          {isDetailsExpanded ? (
            <Animated.View
              entering={FadeInDown.duration(180)}
              layout={statsLayoutTransition}
              style={styles.detailsSectionContent}
            >
              <View style={styles.detailsSubsection}>
                {canCompare ? (
                  <View style={styles.compareModeSection}>
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
                ) : null}

                {selectedMode === 'compare' && canCompare ? (
                  <View style={styles.comparePanel}>
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
                  </View>
                ) : (
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
                        const height =
                          bar.count > 0 ? Math.max(10, (bar.count / maxCount) * 48) : 4;

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
                  </View>
                )}
              </View>

              <View>
                <SectionHeader title={copy.snapshotTitle} />
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
                <SectionHeader title={copy.coverageTitle} />
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
                <SectionHeader title={copy.attentionTitle} />
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

export function StatsThreadsSections({
  copy,
  styles,
  patternGroups,
  activePatternGroup,
  selectedPatternGroup,
  onSelectPatternGroup,
  activeThread,
  activeThreadLabel,
  activeThreadDescription,
  activeThreadMatches,
  dreamCopy,
  onOpenThreadDream,
  onClearThread,
}: {
  copy: StatsCopy;
  styles: StatsStyles;
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
  activeThread: { signal: string; kind: string } | null;
  activeThreadLabel: string | null;
  activeThreadDescription: string | null;
  activeThreadMatches: ReadonlyArray<PatternDreamMatch>;
  dreamCopy: DreamCopy;
  onOpenThreadDream: (dreamId: string) => void;
  onClearThread: () => void;
}) {
  const t = useTheme<Theme>();

  return (
    <>
      <Animated.View layout={statsLayoutTransition}>
        <Card style={styles.sectionCard}>
          <SectionHeader title={copy.patternsTitle} subtitle={copy.patternsDescription} />
          <SegmentedControl
            options={patternGroups.map(group => ({
              value: group.key,
              label: group.label,
            }))}
            selectedValue={selectedPatternGroup}
            onChange={onSelectPatternGroup}
          />

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

      {activeThread ? (
        <Animated.View layout={statsLayoutTransition}>
          <Card style={styles.sectionCard}>
            <View style={styles.threadHeaderRow}>
              <SectionHeader
                title={copy.memoryThreadTitle}
                subtitle={copy.memoryThreadDescription}
              />
              <Pressable style={styles.toggleButton} onPress={onClearThread}>
                <Text style={styles.toggleButtonText}>{copy.memoryThreadClearAction}</Text>
              </Pressable>
            </View>

            <View style={styles.threadLeadCard}>
              <View style={styles.threadLeadHeader}>
                <View style={styles.threadLeadCopy}>
                  <Text style={styles.threadLeadLabel}>{activeThread.signal}</Text>
                  <Text style={styles.threadLeadDescription}>
                    {activeThreadDescription ?? copy.patternsDescription}
                  </Text>
                </View>
                <View style={styles.threadMetaWrap}>
                  {activeThreadLabel ? (
                    <View style={styles.threadMetaChip}>
                      <Text style={styles.threadMetaChipText}>{activeThreadLabel}</Text>
                    </View>
                  ) : null}
                  <View style={styles.threadMetaChip}>
                    <Text style={styles.threadMetaChipText}>
                      {`${activeThreadMatches.length} ${
                        activeThreadMatches.length === 1
                          ? copy.patternDetailMatchesSingle
                          : copy.patternDetailMatchesPlural
                      }`}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {activeThreadMatches.length ? (
              <View style={styles.threadMatchList}>
                {activeThreadMatches.slice(0, 4).map(match => (
                  <Pressable
                    key={match.dream.id}
                    onPress={() => onOpenThreadDream(match.dream.id)}
                    style={({ pressed }) => [
                      styles.threadMatchCard,
                      pressed ? styles.insightCardPressed : null,
                    ]}
                  >
                    <View style={styles.threadMatchHeader}>
                      <View style={styles.threadMatchCopy}>
                        <Text style={styles.threadMatchTitle}>
                          {match.dream.title?.trim() || dreamCopy.untitled}
                        </Text>
                        <Text style={styles.threadMatchMeta}>
                          {match.dream.sleepDate ??
                            new Date(match.dream.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={t.colors.text} />
                    </View>

                    <Text style={styles.threadMatchPreview}>
                      {formatThreadPreview(match, dreamCopy)}
                    </Text>

                    <View style={styles.threadMatchSourcesRow}>
                      {match.sources.map(source => (
                        <TagChip
                          key={`${match.dream.id}-${source}`}
                          label={getSourceLabel(source, copy)}
                        />
                      ))}
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.mutedText}>{copy.patternDetailEmptyDescription}</Text>
            )}
          </Card>
        </Animated.View>
      ) : null}
    </>
  );
}

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
              <Text style={styles.teaserHint}>
                {latestMonthlyReportTitle ?? copy.monthLabel}
              </Text>
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

export function StatsMilestonesSection({
  copy,
  styles,
  overallLastSevenDays,
  weeklyGoalTarget,
  weeklyGoalComplete,
  unlockedCount,
  totalCount,
  milestoneSummaryHint,
  achievements,
  highlightedAchievementId,
  isExpanded,
  onToggleExpanded,
}: {
  copy: StatsCopy;
  styles: StatsStyles;
  overallLastSevenDays: number;
  weeklyGoalTarget: number;
  weeklyGoalComplete: boolean;
  unlockedCount: number;
  totalCount: number;
  milestoneSummaryHint: string;
  achievements: ReadonlyArray<DreamAchievementProgress>;
  highlightedAchievementId: DreamAchievementId | null;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}) {
  const t = useTheme<Theme>();

  return (
    <Animated.View layout={statsLayoutTransition}>
      <Card style={styles.sectionCard}>
        <Pressable style={styles.detailsToggleRow} onPress={onToggleExpanded}>
          <View style={styles.detailsToggleCopy}>
            <Text style={styles.detailsToggleTitle}>{copy.milestonesTitle}</Text>
            <Text style={styles.detailsToggleDescription}>
              {`${overallLastSevenDays}/${weeklyGoalTarget} • ${unlockedCount}/${totalCount} • ${milestoneSummaryHint}`}
            </Text>
          </View>
          <View style={styles.detailsTogglePill}>
            <Text style={styles.detailsTogglePillText}>
              {isExpanded ? copy.milestonesToggleHide : copy.milestonesToggleShow}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={t.colors.text}
            />
          </View>
        </Pressable>

        {isExpanded ? (
          <Animated.View
            entering={FadeInDown.duration(180)}
            layout={statsLayoutTransition}
            style={styles.achievementsList}
          >
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

            {achievements.map(achievement => {
              const content = getAchievementContent(achievement.id, copy);
              const progressValue = `${Math.min(achievement.current, achievement.target)}/${achievement.target}`;
              const progressRatio = Math.min(achievement.current / achievement.target, 1);
              const isHighlighted = achievement.id === highlightedAchievementId;

              return (
                <View
                  key={achievement.id}
                  style={[
                    styles.achievementItem,
                    achievement.unlocked ? styles.achievementItemUnlocked : null,
                    isHighlighted ? styles.achievementItemHighlighted : null,
                  ]}
                >
                  <View style={styles.achievementHeaderRow}>
                    <View style={styles.achievementCopy}>
                      <Text style={styles.achievementTitle}>{content.title}</Text>
                      <Text style={styles.achievementDescription}>{content.description}</Text>
                    </View>
                    <View
                      style={[
                        styles.achievementBadge,
                        achievement.unlocked ? styles.achievementBadgeUnlocked : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.achievementBadgeText,
                          achievement.unlocked ? styles.achievementBadgeTextUnlocked : null,
                        ]}
                      >
                        {achievement.unlocked ? copy.milestoneUnlocked : copy.milestoneInProgress}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.detailsListLabel}>{copy.milestoneProgressLabel}</Text>
                  <Text style={styles.threadMatchMeta}>{progressValue}</Text>
                  <View style={styles.achievementProgressTrack}>
                    <View
                      style={[
                        styles.achievementProgressFill,
                        achievement.unlocked ? styles.achievementProgressFillUnlocked : null,
                        { width: `${progressRatio * 100}%` },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </Animated.View>
        ) : null}
      </Card>
    </Animated.View>
  );
}
