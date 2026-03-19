import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { LinearTransition } from 'react-native-reanimated';
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

const detailLayoutTransition = LinearTransition.duration(180);

type DreamDetailOverviewProps = {
  dream: Dream;
  copy: DreamDetailCopy;
  styles: DreamDetailScreenStyles;
  viewModel: DreamDetailViewModel;
  wakeEmotionLabels: Record<string, string>;
  showSavedHighlight: boolean;
  onDismissSavedHighlight: () => void;
  onBack: () => void;
  onEditDream: () => void;
  onDeleteDream: () => void;
  onToggleStarDream: () => void;
  onToggleArchiveDream: () => void;
  onShareDream: () => void;
};

export function DreamDetailOverview({
  dream,
  copy,
  styles,
  viewModel,
  wakeEmotionLabels,
  showSavedHighlight,
  onDismissSavedHighlight,
  onBack,
  onEditDream,
  onDeleteDream,
  onToggleStarDream,
  onToggleArchiveDream,
  onShareDream,
}: DreamDetailOverviewProps) {
  const theme = useTheme<Theme>();
  const wakeHighlights = React.useMemo(() => {
    const moodLabel = viewModel.moodLabel?.toLowerCase();
    return (dream.wakeEmotions ?? [])
      .map(emotion => wakeEmotionLabels[emotion] ?? emotion)
      .filter(label => label.toLowerCase() !== moodLabel)
      .slice(0, 2);
  }, [dream.wakeEmotions, viewModel.moodLabel, wakeEmotionLabels]);

  return (
    <>
      <Animated.View layout={detailLayoutTransition} style={styles.heroShell}>
        <View style={styles.heroTopBar}>
          <Pressable
            style={styles.backButton}
            onPress={onBack}
            accessibilityLabel={copy.detailBack}
          >
            <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
          </Pressable>

          <View style={styles.heroIconActions}>
            <Pressable
              style={({ pressed }) => [
                styles.heroIconButton,
                pressed ? styles.heroIconButtonPressed : null,
              ]}
              onPress={onEditDream}
              accessibilityLabel={copy.detailEdit}
            >
              <Ionicons name="create-outline" size={17} color={theme.colors.text} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.heroIconButton,
                viewModel.starred ? styles.heroIconButtonActive : null,
                pressed ? styles.heroIconButtonPressed : null,
              ]}
              onPress={onToggleStarDream}
              accessibilityLabel={viewModel.starred ? copy.detailUnstar : copy.detailStar}
            >
              <Ionicons name="star-outline" size={17} color={theme.colors.text} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.heroIconButton,
                viewModel.archived ? styles.heroIconButtonActive : null,
                pressed ? styles.heroIconButtonPressed : null,
              ]}
              onPress={onToggleArchiveDream}
              accessibilityLabel={viewModel.archived ? copy.detailUnarchive : copy.detailArchive}
            >
              <Ionicons name="archive-outline" size={17} color={theme.colors.text} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.heroIconButton,
                pressed ? styles.heroIconButtonPressed : null,
              ]}
              onPress={onShareDream}
              accessibilityLabel={copy.dreamCardShareAction}
            >
              <Ionicons name="share-outline" size={17} color={theme.colors.text} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.heroIconButton,
                styles.heroIconButtonDanger,
                pressed ? styles.heroIconButtonPressed : null,
              ]}
              onPress={onDeleteDream}
              accessibilityLabel={copy.detailDelete}
            >
              <Ionicons name="trash-outline" size={17} color={theme.colors.danger} />
            </Pressable>
          </View>
        </View>

        <View style={styles.heroHeader}>
          <Text style={styles.heroTitle}>{dream.title || copy.untitled}</Text>
          <Text style={styles.heroSubtitle}>{viewModel.heroSubtitle}</Text>
        </View>

        <View style={styles.heroMetaRow}>
          {viewModel.moodLabel ? (
            <View style={styles.heroMoodPill}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: moodColor(theme, dream.mood) },
                ]}
              />
              <Text style={styles.statusChipLabel}>{viewModel.moodLabel}</Text>
            </View>
          ) : null}
          {viewModel.showLucidityHeroChip && viewModel.lucidityLabel ? (
            <View style={styles.heroMetaChip}>
              <Text style={styles.heroMetaChipLabel}>{viewModel.lucidityLabel}</Text>
            </View>
          ) : null}
          {viewModel.starred ? (
            <Text style={styles.heroMetaText}>{copy.starredTag}</Text>
          ) : null}
          {viewModel.archived ? (
            <Text style={styles.heroMetaText}>{copy.archivedTag}</Text>
          ) : null}
          {wakeHighlights.map(label => (
            <View key={label} style={styles.heroMetaChip}>
              <Text style={styles.heroMetaChipLabel}>{label}</Text>
            </View>
          ))}
        </View>

      </Animated.View>

      {showSavedHighlight ? (
        <Animated.View layout={detailLayoutTransition}>
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
    </>
  );
}
