import React from 'react';
import { Pressable, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@shopify/restyle';
import { Text } from '../../../../components/ui/Text';
import type { Theme } from '../../../../theme/theme';
import type { RelatedDream } from '../../model/relatedDreams';
import type { DreamDetailScreenStyles } from '../../screens/DreamDetailScreen.styles';
import type {
  DreamDetailCopy,
  DreamDetailViewModel,
} from '../../model/dreamDetailPresentation';
import type { Dream } from '../../model/dream';

/**
 * The question to sit with, and the ones behind it.
 *
 * Sixth section out of `DreamDetailSections`. The lead prompt is whichever
 * follow-up the view model produced, falling back to the first reflection
 * prompt — and the rest go underneath it, minus the one already used as the
 * lead. That arithmetic lives here now rather than in a parent that had no
 * other use for it.
 *
 * Renders nothing at all when there is no prompt, which is why the parent
 * still decides whether to draw a divider above it.
 */

type DreamReflectionSectionProps = {
  dream: Dream;
  copy: DreamDetailCopy;
  styles: DreamDetailScreenStyles;
  viewModel: DreamDetailViewModel;
  relatedDreams: RelatedDream[];
  onEditDream: () => void;
  onOpenRelatedDream: (dreamId: string) => void;
  onTranscribeAudio: () => void;
  onStartTranscriptEdit: () => void;
};

export function DreamReflectionSection({
  dream,
  copy,
  styles,
  viewModel,
  relatedDreams,
  onEditDream,
  onOpenRelatedDream,
  onTranscribeAudio,
  onStartTranscriptEdit,
}: DreamReflectionSectionProps) {
  const theme = useTheme<Theme>();
  const leadPrompt =
    viewModel.followUpPrompt ?? viewModel.reflectionPrompts[0] ?? null;

  if (!leadPrompt) {
    return null;
  }

  const supportingPrompts = viewModel.followUpPrompt
    ? viewModel.reflectionPrompts
    : viewModel.reflectionPrompts.slice(1);

  return (
    <View style={styles.sheetSection}>
      <Text style={styles.sheetHeading}>{copy.detailReflectionTitle}</Text>
      <View style={styles.revisitPanel}>
        <Text style={styles.featuredTitle}>{leadPrompt.title}</Text>
        <Text style={styles.featuredBody}>{leadPrompt.body}</Text>
        {leadPrompt.actionKind !== 'analysis' ? (
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.featuredAction,
              pressed ? styles.featuredActionPressed : null,
            ]}
            onPress={() => {
              if (leadPrompt.actionKind === 'related' && relatedDreams[0]) {
                onOpenRelatedDream(relatedDreams[0].dream.id);
                return;
              }

              if (leadPrompt.actionKind === 'transcript') {
                if (dream.transcript?.trim()) {
                  onStartTranscriptEdit();
                  return;
                }

                if (dream.audioUri) {
                  onTranscribeAudio();
                  return;
                }
              }

              onEditDream();
            }}
          >
            <Text style={styles.featuredActionText}>
              {leadPrompt.actionLabel}
            </Text>
            <Ionicons
              name="arrow-forward-outline"
              size={14}
              color={theme.colors.accent}
            />
          </Pressable>
        ) : null}
      </View>

      {supportingPrompts.length ? (
        <View style={styles.supportingPromptList}>
          {supportingPrompts.map(prompt => (
            <View key={prompt.key} style={styles.supportingPromptRow}>
              <Text style={styles.supportingPromptTitle}>{prompt.title}</Text>
              <Text style={styles.supportingPromptBody}>{prompt.body}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Whether the section above would draw anything, for the divider before it. */
export function hasReflectionPrompt(viewModel: DreamDetailViewModel) {
  return Boolean(
    viewModel.followUpPrompt ?? viewModel.reflectionPrompts[0] ?? null,
  );
}
