import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card } from '../../../components/ui/Card';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { type DreamDetailFocusSection } from '../../../app/navigation/routes';
import { Theme } from '../../../theme/theme';
import { DreamFingerprintCard, type DreamFingerprintFacet } from './DreamFingerprintCard';
import {
  disabledRangeChipStyle,
  statsLayoutTransition,
  type StatsCopy,
  type StatsStyles,
} from './StatsScreenSection.shared';
import { formatCoverageValue, formatSignedDelta } from '../model/statsScreenModel';

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
  workQueueItems,
  importantDreamItems,
  savedSetItems,
  onOpenReviewWorkspace,
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
  workQueueItems: ReadonlyArray<{
    dreamId: string;
    dreamTitle: string;
    reason: string;
    badgeLabel: string;
    actionLabel: string;
    focusSection: DreamDetailFocusSection;
    icon: string;
  }>;
  importantDreamItems: ReadonlyArray<{
    dreamId: string;
    title: string;
    meta: string;
  }>;
  savedSetItems: ReadonlyArray<{
    key: string;
    kind: 'month' | 'thread';
    title: string;
    meta: string;
    eyebrow: string;
  }>;
  onOpenReviewWorkspace: () => void;
}) {
  const t = useTheme<Theme>();
  const hasReviewShelf =
    workQueueItems.length > 0 || importantDreamItems.length > 0 || savedSetItems.length > 0;
  const reviewWorkspacePreview = workQueueItems[0]
    ? {
        eyebrow: copy.reviewShelfContinueEyebrow,
        title: workQueueItems[0].dreamTitle,
        meta: workQueueItems[0].reason,
      }
    : importantDreamItems[0]
      ? {
          eyebrow: copy.reviewShelfImportantDreamEyebrow,
          title: importantDreamItems[0].title,
          meta: importantDreamItems[0].meta,
        }
      : savedSetItems[0]
        ? {
            eyebrow: savedSetItems[0].eyebrow,
            title: savedSetItems[0].title,
            meta: savedSetItems[0].meta,
          }
        : null;

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
          {hasReviewShelf ? (
            <View style={styles.detailsSubsection}>
              <View style={styles.threadHeaderRow}>
                <View style={styles.threadHeaderCopy}>
                  <SectionHeader title={copy.reviewShelfTitle} subtitle={copy.reviewShelfDescription} />
                </View>
                <Pressable style={styles.toggleButton} onPress={onOpenReviewWorkspace}>
                  <Text style={styles.toggleButtonText}>{copy.reviewWorkspaceOpenAction}</Text>
                </Pressable>
              </View>
              <Pressable
                onPress={onOpenReviewWorkspace}
                style={({ pressed }) => [
                  styles.reviewShelfCompactRow,
                  pressed ? styles.insightCardPressed : null,
                ]}
              >
                <View style={styles.reviewShelfCompactCopy}>
                  <Text style={styles.reviewShelfCompactEyebrow}>
                    {reviewWorkspacePreview?.eyebrow ?? copy.reviewWorkspaceTitle}
                  </Text>
                  <Text style={styles.reviewShelfCompactTitle}>
                    {reviewWorkspacePreview?.title ?? copy.reviewWorkspaceTitle}
                  </Text>
                  <Text style={styles.reviewShelfCompactMeta}>
                    {reviewWorkspacePreview?.meta ?? copy.reviewWorkspaceSubtitle}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={t.colors.textDim} />
              </Pressable>
            </View>
          ) : null}

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
                      <Text style={styles.overviewPanelSubtitle}>{copy.overviewActivityDescription}</Text>
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
