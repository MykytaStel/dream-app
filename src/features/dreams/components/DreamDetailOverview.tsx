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
            ) : (
              <View style={styles.heroTopBarSpacer} />
            )}
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

          <View style={styles.heroQuickActions}>
            <Pressable
              onPress={onEditDream}
              style={({ pressed }) => [
                styles.heroActionPill,
                pressed ? styles.heroActionPillPressed : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel={copy.detailEdit}
            >
              <Ionicons name="create-outline" size={15} color={theme.colors.text} />
              <Text style={styles.heroActionLabel}>{copy.detailActionEdit}</Text>
            </Pressable>

            <Pressable
              onPress={onToggleStarDream}
              style={({ pressed }) => [
                styles.heroActionPill,
                viewModel.starred ? styles.heroActionPillActive : null,
                pressed ? styles.heroActionPillPressed : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel={viewModel.starred ? copy.detailUnstar : copy.detailStar}
            >
              <Ionicons
                name={viewModel.starred ? 'star' : 'star-outline'}
                size={15}
                color={viewModel.starred ? theme.colors.background : theme.colors.primary}
              />
              <Text
                style={[
                  styles.heroActionLabel,
                  viewModel.starred ? styles.heroActionLabelActive : null,
                ]}
              >
                {copy.detailActionImportant}
              </Text>
            </Pressable>

            <Pressable
              onPress={onToggleArchiveDream}
              style={({ pressed }) => [
                styles.heroActionPill,
                viewModel.archived ? styles.heroActionPillActive : null,
                pressed ? styles.heroActionPillPressed : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel={viewModel.archived ? copy.detailUnarchive : copy.detailArchive}
            >
              <Ionicons
                name={viewModel.archived ? 'refresh-outline' : 'archive-outline'}
                size={15}
                color={viewModel.archived ? theme.colors.background : theme.colors.textDim}
              />
              <Text
                style={[
                  styles.heroActionLabel,
                  viewModel.archived ? styles.heroActionLabelActive : null,
                ]}
              >
                {viewModel.archived ? copy.detailActionRestore : copy.detailActionArchive}
              </Text>
            </Pressable>
          </View>

          <View style={styles.heroFooter}>
            <Pressable
              style={({ pressed }) => [
                styles.heroDeleteAction,
                pressed ? styles.heroDeleteActionPressed : null,
              ]}
              onPress={onDeleteDream}
              accessibilityRole="button"
              accessibilityLabel={copy.detailDelete}
            >
              <Ionicons name="trash-outline" size={14} color={theme.colors.danger} />
              <Text style={styles.heroDeleteActionLabel}>{copy.detailActionDelete}</Text>
            </Pressable>
          </View>
        </Card>
      </Animated.View>

      {showSavedHighlight ? (
        <Animated.View entering={FadeInDown.delay(40).duration(220)} layout={detailLayoutTransition}>
          <Card style={styles.savedCard}>
            <View style={styles.savedHeader}>
              <View style={styles.savedLead}>
                <View style={styles.savedIconShell}>
                  <Ionicons name="checkmark" size={14} color={theme.colors.accent} />
                </View>
                <View style={styles.savedCopy}>
                  <Text style={styles.savedTitle}>{copy.detailSavedTitle}</Text>
                  <Text style={styles.savedDescription}>{copy.detailSavedDescription}</Text>
                </View>
              </View>
              <Pressable
                style={styles.savedDismiss}
                onPress={onDismissSavedHighlight}
                accessibilityLabel={copy.clearErrorAction}
              >
                <Ionicons name="close" size={16} color={theme.colors.textDim} />
              </Pressable>
            </View>

            <View style={styles.savedMetaRow}>
              {viewModel.strongestSignal ? (
                <View style={styles.savedMetaPill}>
                  <Text style={styles.savedMetaLabel}>{copy.detailSavedPatternLabel}</Text>
                  <Text numberOfLines={1} style={styles.savedMetaValue}>
                    {viewModel.strongestSignal}
                  </Text>
                </View>
              ) : null}
              <Text style={styles.savedMetaInline}>
                {`${viewModel.relatedCount} ${copy.detailSavedRelatedLabel.toLowerCase()}`}
              </Text>
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
