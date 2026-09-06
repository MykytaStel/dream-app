import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card } from '../../../components/ui/Card';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';
import { createStatsScreenStyles } from '../screens/StatsScreen.styles';
import { useStyles } from '../../../theme/useStyles';
import { type StatsCopy } from './StatsScreenSection.shared';

type WorkQueueItem = {
  dreamId: string;
  dreamTitle: string;
  reason: string;
};
type ImportantDreamItem = { dreamId: string; title: string; meta: string };
type SavedSetItem = {
  key: string;
  title: string;
  meta: string;
  eyebrow: string;
};

type PickBackUpRow = {
  key: string;
  eyebrow: string;
  title: string;
  meta: string;
  onPress: () => void;
};

export function MemoryPickBackUpCard({
  copy,
  workQueueItems,
  importantDreamItems,
  savedSetItems,
  onOpenReviewWorkspace,
  onOpenDream,
}: {
  copy: StatsCopy;
  workQueueItems: ReadonlyArray<WorkQueueItem>;
  importantDreamItems: ReadonlyArray<ImportantDreamItem>;
  savedSetItems: ReadonlyArray<SavedSetItem>;
  onOpenReviewWorkspace: () => void;
  onOpenDream: (dreamId: string) => void;
}) {
  const t = useTheme<Theme>();
  const styles = useStyles(createStatsScreenStyles);

  const rows: PickBackUpRow[] = [
    ...workQueueItems.map(item => ({
      key: `wq:${item.dreamId}`,
      eyebrow: copy.reviewShelfContinueEyebrow,
      title: item.dreamTitle,
      meta: item.reason,
      onPress: () => onOpenDream(item.dreamId),
    })),
    ...importantDreamItems.map(item => ({
      key: `imp:${item.dreamId}`,
      eyebrow: copy.reviewShelfImportantDreamEyebrow,
      title: item.title,
      meta: item.meta,
      onPress: () => onOpenDream(item.dreamId),
    })),
    ...savedSetItems.map(item => ({
      key: `set:${item.key}`,
      eyebrow: item.eyebrow,
      title: item.title,
      meta: item.meta,
      onPress: onOpenReviewWorkspace,
    })),
  ].slice(0, 3);

  if (!rows.length) {
    return null;
  }

  return (
    <Card style={styles.sectionCard}>
      <View style={styles.threadHeaderRow}>
        <View style={styles.threadHeaderCopy}>
          <SectionHeader
            title={copy.reviewShelfTitle}
            subtitle={copy.reviewShelfDescription}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          style={styles.toggleButton}
          onPress={onOpenReviewWorkspace}
        >
          <Text style={styles.toggleButtonText}>
            {copy.reviewWorkspaceOpenAction}
          </Text>
        </Pressable>
      </View>

      <View style={styles.reviewShelfList}>
        {rows.map(row => (
          <Pressable
            accessibilityRole="button"
            key={row.key}
            onPress={row.onPress}
            style={({ pressed }) => [
              styles.reviewShelfCompactRow,
              pressed ? styles.insightCardPressed : null,
            ]}
          >
            <View style={styles.reviewShelfCompactCopy}>
              <Text style={styles.reviewShelfCompactEyebrow}>
                {row.eyebrow}
              </Text>
              <Text style={styles.reviewShelfCompactTitle}>{row.title}</Text>
              <Text style={styles.reviewShelfCompactMeta}>{row.meta}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={t.colors.textDim}
            />
          </Pressable>
        ))}
      </View>
    </Card>
  );
}
