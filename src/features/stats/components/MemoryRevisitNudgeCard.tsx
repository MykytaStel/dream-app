import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card } from '../../../components/ui/Card';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';
import { type DreamDetailFocusSection } from '../../../app/navigation/routes';
import { createStatsScreenStyles } from '../screens/StatsScreen.styles';
import { useStyles } from '../../../theme/useStyles';
import { type StatsCopy } from './StatsScreenSection.shared';

export type MemoryRevisitNudge = {
  dreamId: string;
  dreamTitle: string;
  reason: string;
  badgeLabel: string;
  actionLabel: string;
  focusSection: DreamDetailFocusSection;
  icon: string;
};

export function MemoryRevisitNudgeCard({
  nudge,
  copy,
  onOpen,
}: {
  nudge: MemoryRevisitNudge;
  copy: StatsCopy;
  onOpen: (dreamId: string, focusSection: DreamDetailFocusSection) => void;
}) {
  const t = useTheme<Theme>();
  const styles = useStyles(createStatsScreenStyles);

  return (
    <Card style={styles.sectionCard}>
      <Pressable
        accessibilityRole="button"
        onPress={() => onOpen(nudge.dreamId, nudge.focusSection)}
        style={({ pressed }) => [
          styles.memoryNudgeCard,
          pressed ? styles.insightCardPressed : null,
        ]}
      >
        <View style={styles.memoryNudgeHeader}>
          <Text style={styles.storyLabel}>{copy.memoryNudgeLabel}</Text>
          <View style={styles.memoryNudgeBadge}>
            <Ionicons name={nudge.icon} size={12} color={t.colors.accent} />
            <Text style={styles.memoryNudgeBadgeText}>{nudge.badgeLabel}</Text>
          </View>
        </View>
        <Text style={styles.storyValue} numberOfLines={2}>
          {nudge.dreamTitle}
        </Text>
        <Text style={styles.storyHint} numberOfLines={3}>
          {nudge.reason}
        </Text>
        <View style={styles.memoryNudgeActionRow}>
          <Text style={styles.memoryNudgeActionText}>{nudge.actionLabel}</Text>
          <Ionicons
            name="arrow-forward-outline"
            size={14}
            color={t.colors.accent}
          />
        </View>
      </Pressable>
    </Card>
  );
}
