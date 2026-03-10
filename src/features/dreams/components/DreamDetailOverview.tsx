import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { Card } from '../../../components/ui/Card';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';
import type { Dream } from '../model/dream';
import {
  moodColor,
  type DreamDetailCopy,
  type DreamDetailViewModel,
} from '../model/dreamDetailPresentation';
import type { DreamDetailScreenStyles } from '../screens/DreamDetailScreen.styles';

const detailLayoutTransition = LinearTransition.springify()
  .damping(18)
  .stiffness(180);

type DreamDetailOverviewProps = {
  dream: Dream;
  copy: DreamDetailCopy;
  styles: DreamDetailScreenStyles;
  viewModel: DreamDetailViewModel;
  showSavedHighlight: boolean;
  onDismissSavedHighlight: () => void;
  onBack: () => void;
  onEditDream: () => void;
  onDeleteDream: () => void;
  onToggleStarDream: () => void;
  onToggleArchiveDream: () => void;
};

export function DreamDetailOverview({
  dream,
  copy,
  styles,
  viewModel,
  showSavedHighlight,
  onDismissSavedHighlight,
  onBack,
  onEditDream,
  onDeleteDream,
  onToggleStarDream,
  onToggleArchiveDream,
}: DreamDetailOverviewProps) {
  const theme = useTheme<Theme>();

  return (
    <>
      <Animated.View entering={FadeInDown.duration(240)} layout={detailLayoutTransition}>
        <Card style={styles.heroCard}>
          <View pointerEvents="none" style={styles.heroGlowLarge} />
          <View pointerEvents="none" style={styles.heroGlowSmall} />

          <View style={styles.heroTopBar}>
            <Pressable
              style={styles.backButton}
              onPress={onBack}
              accessibilityLabel={copy.detailBack}
            >
              <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
            </Pressable>

            <View style={styles.heroActionsWrap}>
              {viewModel.moodLabel ? (
                <View style={styles.statusChip}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: moodColor(theme, dream.mood) },
                    ]}
                  />
                  <Text style={styles.statusChipLabel}>{viewModel.moodLabel}</Text>
                </View>
              ) : null}
              <View style={styles.heroActionRow}>
                <Pressable
                  onPress={onToggleStarDream}
                  style={({ pressed }) => [
                    styles.heroActionButton,
                    viewModel.starred ? styles.heroActionButtonActive : null,
                    pressed ? styles.heroActionButtonPressed : null,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={viewModel.starred ? copy.detailUnstar : copy.detailStar}
                >
                  <Ionicons
                    name={viewModel.starred ? 'star' : 'star-outline'}
                    size={15}
                    color={viewModel.starred ? theme.colors.background : theme.colors.primary}
                  />
                </Pressable>
                <Pressable
                  onPress={onToggleArchiveDream}
                  style={({ pressed }) => [
                    styles.heroActionButton,
                    viewModel.archived ? styles.heroActionButtonActive : null,
                    pressed ? styles.heroActionButtonPressed : null,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={viewModel.archived ? copy.detailUnarchive : copy.detailArchive}
                >
                  <Ionicons
                    name={viewModel.archived ? 'refresh-outline' : 'archive-outline'}
                    size={15}
                    color={viewModel.archived ? theme.colors.background : theme.colors.textDim}
                  />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.heroActionButton,
                    pressed ? styles.heroActionButtonPressed : null,
                  ]}
                  onPress={onEditDream}
                  accessibilityRole="button"
                  accessibilityLabel={copy.detailEdit}
                >
                  <Ionicons name="create-outline" size={15} color={theme.colors.text} />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.heroActionButton,
                    styles.heroActionButtonDanger,
                    pressed ? styles.heroActionButtonPressed : null,
                  ]}
                  onPress={onDeleteDream}
                  accessibilityRole="button"
                  accessibilityLabel={copy.detailDelete}
                >
                  <Ionicons name="trash-outline" size={15} color={theme.colors.danger} />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>{dream.title || copy.untitled}</Text>
            <Text style={styles.heroSubtitle}>{viewModel.heroSubtitle}</Text>
          </View>

          {viewModel.heroPreview ? (
            <Text numberOfLines={3} style={styles.heroPreviewText}>
              {viewModel.heroPreview}
            </Text>
          ) : null}
        </Card>
      </Animated.View>

      {showSavedHighlight ? (
        <Animated.View entering={FadeInDown.delay(40).duration(220)} layout={detailLayoutTransition}>
          <Card style={styles.savedCard}>
            <View style={styles.savedHeader}>
              <View style={styles.savedCopy}>
                <Text style={styles.savedTitle}>{copy.detailSavedTitle}</Text>
                <Text style={styles.savedDescription}>{copy.detailSavedDescription}</Text>
              </View>
              <Pressable
                style={styles.savedDismiss}
                onPress={onDismissSavedHighlight}
                accessibilityLabel={copy.clearErrorAction}
              >
                <Ionicons name="close" size={16} color={theme.colors.textDim} />
              </Pressable>
            </View>

            <View style={styles.savedStatsRow}>
              <View style={styles.savedStatTile}>
                <Text style={styles.savedStatLabel}>{copy.detailSavedPatternLabel}</Text>
                <Text style={styles.savedStatValue}>
                  {viewModel.strongestSignal ?? copy.homeSpotlightNoPattern}
                </Text>
              </View>
              <View style={styles.savedStatTile}>
                <Text style={styles.savedStatLabel}>{copy.detailSavedRelatedLabel}</Text>
                <Text style={styles.savedStatValue}>{String(viewModel.relatedCount)}</Text>
              </View>
            </View>
          </Card>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(55).duration(220)} layout={detailLayoutTransition}>
        <Card style={styles.summaryCard}>
          <View style={styles.glanceGrid}>
            {viewModel.glanceCards.map(item => (
              <View key={item.key} style={styles.glanceCard}>
                <View style={styles.glanceHeader}>
                  <View style={styles.glanceIconShell}>
                    <Ionicons name={item.icon} size={14} color={theme.colors.textDim} />
                  </View>
                  <Text style={styles.glanceLabel}>{item.label}</Text>
                </View>
                <Text style={styles.glanceValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </Card>
      </Animated.View>
    </>
  );
}
