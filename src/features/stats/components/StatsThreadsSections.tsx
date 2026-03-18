import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Animated from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card } from '../../../components/ui/Card';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';
import { type PatternDetailKind } from '../../../app/navigation/routes';
import { type RecurringSignalDashboardItem } from '../model/dreamThread';
import {
  type StatsCopy,
  type StatsStyles,
} from './StatsScreenSection.shared';

const SavedThreadPreviewList = React.memo(function SavedThreadPreviewList({
  copy,
  styles,
  savedThreadItems,
  onOpenThreadDetail,
}: {
  copy: StatsCopy;
  styles: StatsStyles;
  savedThreadItems: ReadonlyArray<{
    signal: string;
    kind: string;
    kindLabel: string;
    matchesLabel: string;
  }>;
  onOpenThreadDetail: (signal: string, kind: PatternDetailKind) => void;
}) {
  const t = useTheme<Theme>();

  if (!savedThreadItems.length) {
    return null;
  }

  return (
    <View style={styles.savedThreadsBlock}>
      <SectionHeader
        title={copy.savedThreadsTitle}
        subtitle={copy.savedThreadsDescription}
      />
      <View style={styles.savedThreadsList}>
        {savedThreadItems.slice(0, 3).map(item => (
          <Pressable
            key={`${item.kind}-${item.signal}`}
            style={({ pressed }) => [
              styles.savedThreadRow,
              pressed ? styles.insightCardPressed : null,
            ]}
            onPress={() => onOpenThreadDetail(item.signal, item.kind as PatternDetailKind)}
          >
            <View style={styles.savedThreadCopy}>
              <Text style={styles.savedThreadTitle}>{item.signal}</Text>
              <Text style={styles.savedThreadMeta}>{`${item.kindLabel} • ${item.matchesLabel}`}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={t.colors.text} />
          </Pressable>
        ))}
      </View>
    </View>
  );
});

const RecurringSignalRow = React.memo(function RecurringSignalRow({
  styles,
  item,
  featured,
  onOpenThreadDetail,
}: {
  styles: StatsStyles;
  item: RecurringSignalDashboardItem;
  featured: boolean;
  onOpenThreadDetail: (signal: string, kind: PatternDetailKind) => void;
}) {
  const t = useTheme<Theme>();
  const itemMeta = [item.kindLabel, item.matchesLabel, item.sourceLabel, item.supportingLabel]
    .filter((value): value is string => Boolean(value))
    .join(' • ');

  return (
    <Pressable
      onPress={() => onOpenThreadDetail(item.signal, item.kind)}
      style={({ pressed }) => [
        styles.threadMatchCard,
        featured ? styles.recurringItemCardFeatured : null,
        pressed ? styles.insightCardPressed : null,
      ]}
    >
      <View style={styles.recurringItemHeader}>
        <View style={styles.recurringRankChip}>
          <Text style={styles.recurringRankChipText}>{`#${item.rank}`}</Text>
        </View>
        <View style={styles.threadMatchCopy}>
          <Text style={styles.threadMatchTitle}>{item.signal}</Text>
          <Text style={styles.threadMatchMeta}>{itemMeta}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={t.colors.textDim} />
      </View>

      <Text style={styles.recurringTimelineText}>{item.timelineLabel}</Text>

      <View style={styles.recurringLatestBlock}>
        <Text style={styles.recurringLatestTitle}>{item.latestDreamTitle}</Text>
        <Text style={styles.threadMatchMeta}>{item.latestDreamMeta}</Text>
      </View>

      <Text style={styles.threadMatchPreview}>{item.latestPreview}</Text>
    </Pressable>
  );
});

export function StatsThreadsSections({
  copy,
  styles,
  patternGroups,
  savedThreadItems,
  onOpenThreadDetail,
}: {
  copy: StatsCopy;
  styles: StatsStyles;
  patternGroups: ReadonlyArray<{
    key: PatternDetailKind;
    label: string;
    description: string;
    values: RecurringSignalDashboardItem[];
    empty: string;
  }>;
  savedThreadItems: ReadonlyArray<{
    signal: string;
    kind: string;
    kindLabel: string;
    matchesLabel: string;
  }>;
  onOpenThreadDetail: (signal: string, kind: PatternDetailKind) => void;
}) {
  const topSymbol = patternGroups.find(group => group.key === 'symbol')?.values[0];
  const topTheme = patternGroups.find(group => group.key === 'theme')?.values[0];
  const trackedSignalCount = patternGroups.reduce(
    (sum, group) => sum + group.values.length,
    0,
  );
  const heroHighlights = [topSymbol?.signal, topTheme?.signal]
    .filter((value): value is string => Boolean(value))
    .join(' • ');

  return (
    <>
      <Animated.View>
        <Card style={styles.sectionCard}>
          <View style={styles.recurringHeroBlock}>
            <SectionHeader title={copy.patternsTitle} subtitle={copy.patternsDescription} />

            <View style={styles.threadMetaWrap}>
              <View style={styles.threadMetaChip}>
                <Text style={styles.threadMetaChipText}>{`${trackedSignalCount} ${copy.patternsTrackedLabel}`}</Text>
              </View>
              <View style={styles.threadMetaChip}>
                <Text style={styles.threadMetaChipText}>{`${savedThreadItems.length} ${copy.savedThreadsTitle}`}</Text>
              </View>
            </View>
            {heroHighlights ? (
              <Text style={styles.recurringHeroHighlights}>{heroHighlights}</Text>
            ) : null}

            <SavedThreadPreviewList
              copy={copy}
              styles={styles}
              savedThreadItems={savedThreadItems}
              onOpenThreadDetail={onOpenThreadDetail}
            />
          </View>
        </Card>
      </Animated.View>

      {patternGroups.map(group => (
        <Animated.View key={group.key}>
          <Card style={styles.sectionCard}>
            <View style={styles.recurringGroupHeaderRow}>
              <View style={styles.threadHeaderCopy}>
                <SectionHeader title={group.label} subtitle={group.description} />
              </View>
              <View style={styles.savedThreadsCountChip}>
                <Text style={styles.savedThreadsCountText}>{group.values.length}</Text>
              </View>
            </View>

            {!group.values.length ? (
              <Text style={styles.mutedText}>{group.empty}</Text>
            ) : (
              <View style={styles.recurringItemList}>
                {group.values.map((item, index) => (
                  <RecurringSignalRow
                    key={item.key}
                    styles={styles}
                    item={item}
                    featured={index === 0}
                    onOpenThreadDetail={onOpenThreadDetail}
                  />
                ))}
              </View>
            )}
          </Card>
        </Animated.View>
      ))}
    </>
  );
}
