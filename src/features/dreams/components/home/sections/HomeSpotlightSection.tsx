import React from 'react';
import { Pressable, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@shopify/restyle';
import { Text } from '../../../../../components/ui/Text';
import { Card } from '../../../../../components/ui/Card';
import type { Theme } from '../../../../../theme/theme';
import type { DreamCopy } from '../../../../../constants/copy/dreams';
import type { createHomeScreenStyles } from '../../../screens/HomeScreen.styles';
import type { HomeRevisitCue } from '../../../model/homeOverview';

type HomeSpotlightSectionProps = {
  copy: DreamCopy;
  styles: ReturnType<typeof createHomeScreenStyles>;
  revisitCue: HomeRevisitCue | null;
  onOpenRevisitDream: (dreamId: string) => void;
};

export function HomeSpotlightSection({
  copy,
  styles,
  revisitCue,
  onOpenRevisitDream,
}: HomeSpotlightSectionProps) {
  const theme = useTheme<Theme>();

  if (!revisitCue) {
    return null;
  }

  return (
    <Card style={styles.spotlightCard}>
      <Text style={styles.sectionLabel}>{copy.homeSpotlightRevisitLabel}</Text>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.spotlightTile,
          styles.spotlightTileLead,
          pressed ? styles.spotlightTilePressed : null,
        ]}
        onPress={() => onOpenRevisitDream(revisitCue.dreamId)}
      >
        <View style={styles.spotlightCueHeader}>
          <View style={styles.spotlightCueBadge}>
            <Ionicons
              name={revisitCue.icon}
              size={12}
              color={theme.colors.accent}
            />
            <Text style={styles.spotlightCueBadgeText}>
              {revisitCue.contextLabel}
            </Text>
          </View>
        </View>
        <Text style={styles.spotlightValue}>{revisitCue.title}</Text>
        <Text style={styles.spotlightHint}>{revisitCue.reason}</Text>
        <View style={styles.spotlightCueActionRow}>
          <Text style={styles.spotlightActionHint}>
            {revisitCue.actionLabel}
          </Text>
          <Ionicons
            name="arrow-forward-outline"
            size={14}
            color={theme.colors.accent}
          />
        </View>
      </Pressable>
    </Card>
  );
}
