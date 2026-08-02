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
import type { PatternDetailKind } from '../../../../../app/navigation/routes';

/**
 * One recurring signal, and one thing worth cleaning up.
 *
 * The counterpart of `HomeShortcutSection`, out of the same component for the
 * same reason. Returns null when there is nothing worth spotlighting, which is
 * why the parent renders each section inside a fragment rather than a spacer.
 */

type HomeSpotlightSectionProps = {
  copy: DreamCopy;
  styles: ReturnType<typeof createHomeScreenStyles>;
  showSpotlightCard: boolean;
  spotlightPattern: string;
  spotlightPatternKind: PatternDetailKind | null;
  spotlightCountLabel: string;
  hasAttentionCue: boolean;
  attentionValue: string;
  attentionHint: string;
  revisitCue: HomeRevisitCue | null;
  onOpenPatternDetail: (signal: string, kind: PatternDetailKind) => void;
  onOpenRevisitDream: (dreamId: string) => void;
};

export function HomeSpotlightSection({
  copy,
  styles,
  showSpotlightCard,
  spotlightPattern,
  spotlightPatternKind,
  spotlightCountLabel,
  hasAttentionCue,
  attentionValue,
  attentionHint,
  revisitCue,
  onOpenPatternDetail,
  onOpenRevisitDream,
}: HomeSpotlightSectionProps) {
  const t = useTheme<Theme>();

  if (!showSpotlightCard) {
    return null;
  }

  return (
    <Card style={styles.spotlightCard}>
      <View style={styles.spotlightHeader}>
        <View style={styles.spotlightHeaderCopy}>
          <Text style={styles.sectionLabel}>{copy.homeSpotlightTitle}</Text>
          <Text style={styles.spotlightHeaderHint}>
            {copy.homeSpotlightSubtitle}
          </Text>
        </View>
      </View>

      {spotlightPatternKind ? (
        <View style={styles.spotlightLeadRow}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.spotlightTile,
              styles.spotlightTileLead,
              styles.spotlightTileFeatured,
              pressed ? styles.spotlightTilePressed : null,
            ]}
            onPress={() =>
              onOpenPatternDetail(spotlightPattern, spotlightPatternKind)
            }
          >
            <Text style={styles.spotlightLabel}>
              {copy.homeSpotlightPatternLabel}
            </Text>
            <Text style={styles.spotlightValue}>{spotlightPattern}</Text>
            <Text style={styles.spotlightHint}>{spotlightCountLabel}</Text>
          </Pressable>
        </View>
      ) : null}

      {revisitCue ? (
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
            <Text style={styles.spotlightLabel}>
              {copy.homeSpotlightRevisitLabel}
            </Text>
            <View style={styles.spotlightCueBadge}>
              <Ionicons
                name={revisitCue.icon}
                size={12}
                color={t.colors.accent}
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
              color={t.colors.accent}
            />
          </View>
        </Pressable>
      ) : null}

      {hasAttentionCue ? (
        <View style={styles.spotlightSupportRow}>
          <View style={[styles.spotlightTile, styles.spotlightCompactTile]}>
            <Text style={styles.spotlightLabel}>
              {copy.homeSpotlightAttentionLabel}
            </Text>
            <Text style={styles.spotlightCompactValue}>{attentionValue}</Text>
            <Text style={styles.spotlightHint}>{attentionHint}</Text>
          </View>
        </View>
      ) : null}
    </Card>
  );
}
