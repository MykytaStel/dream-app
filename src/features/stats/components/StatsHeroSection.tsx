import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card } from '../../../components/ui/Card';
import {
  SegmentedControl,
  type SegmentedControlOption,
} from '../../../components/ui/SegmentedControl';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { type DreamDetailFocusSection } from '../../../app/navigation/routes';
import { Theme } from '../../../theme/theme';
import {
  type MemoryMode,
  statsLayoutTransition,
  type StatsCopy,
  type StatsStyles,
} from './StatsScreenSection.shared';

export function StatsHeroSection({
  copy,
  styles,
  selectedMemoryMode,
  onSelectMemoryMode,
  memoryModeOptions,
  selectedRange,
  onSelectRange,
  rangeOptions,
  topSignal,
  memoryNudge,
  onOpenMemoryNudge,
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
  topSignal: { label: string; hint: string; onPress?: () => void } | null;
  memoryNudge: {
    dreamId: string;
    dreamTitle: string;
    reason: string;
    badgeLabel: string;
    actionLabel: string;
    focusSection: DreamDetailFocusSection;
    icon: string;
  } | null;
  onOpenMemoryNudge: (dreamId: string, focusSection: DreamDetailFocusSection) => void;
  coverageGap: { label: string; value: number } | null;
}) {
  const t = useTheme<Theme>();

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

              {memoryNudge ? (
                <Pressable
                  onPress={() => onOpenMemoryNudge(memoryNudge.dreamId, memoryNudge.focusSection)}
                  style={({ pressed }) => [
                    styles.memoryNudgeCard,
                    pressed ? styles.insightCardPressed : null,
                  ]}
                >
                  <View style={styles.memoryNudgeHeader}>
                    <Text style={styles.storyLabel}>{copy.memoryNudgeLabel}</Text>
                    <View style={styles.memoryNudgeBadge}>
                      <Ionicons name={memoryNudge.icon} size={12} color={t.colors.accent} />
                      <Text style={styles.memoryNudgeBadgeText}>{memoryNudge.badgeLabel}</Text>
                    </View>
                  </View>
                  <Text style={styles.storyValue} numberOfLines={2}>
                    {memoryNudge.dreamTitle}
                  </Text>
                  <Text style={styles.storyHint} numberOfLines={3}>
                    {memoryNudge.reason}
                  </Text>
                  <View style={styles.memoryNudgeActionRow}>
                    <Text style={styles.memoryNudgeActionText}>{memoryNudge.actionLabel}</Text>
                    <Ionicons name="arrow-forward-outline" size={14} color={t.colors.accent} />
                  </View>
                </Pressable>
              ) : null}

              <Text style={styles.overviewNextStepHint}>
                {`${copy.overviewNextStepLabel}: ${
                  coverageGap?.value ? coverageGap.label : copy.overviewNextStepEmpty
                }`}
              </Text>
            </View>
          </Animated.View>
        ) : null}
      </Card>
    </Animated.View>
  );
}
