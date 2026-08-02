import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../../../../components/ui/Text';
import { TagChip } from '../../../../components/ui/TagChip';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@shopify/restyle';
import type { Theme } from '../../../../theme/theme';
import { getRelatedSignalSummaries } from '../../model/relatedDreams';
import type { RelatedDream } from '../../model/relatedDreams';
import type { DreamDetailScreenStyles } from '../../screens/DreamDetailScreen.styles';
import type { DreamDetailCopy } from '../../model/dreamDetailPresentation';
import type { Dream } from '../../model/dream';

/**
 * The dreams this one rhymes with.
 *
 * Third section out of `DreamDetailSections`. The signal summaries are derived
 * here rather than handed in: they are a function of the related dreams and
 * nothing else, so the parent was computing them only to pass them straight
 * back down.
 */

type DreamRelatedSectionProps = {
  dream: Dream;
  copy: DreamDetailCopy;
  styles: DreamDetailScreenStyles;
  relatedDreams: RelatedDream[];
  onOpenRelatedDream: (dreamId: string) => void;
};

export function DreamRelatedSection({
  dream,
  copy,
  styles,
  relatedDreams,
  onOpenRelatedDream,
}: DreamRelatedSectionProps) {
  const theme = useTheme<Theme>();
  const relatedSignalSummaries = React.useMemo(
    () => getRelatedSignalSummaries(relatedDreams, 5),
    [relatedDreams],
  );

  return (
    <View style={styles.sheetSection}>
      <Text style={styles.sheetHeading}>{copy.detailRelatedTitle}</Text>

      {relatedSignalSummaries.length ? (
        <View style={styles.tagsRow}>
          {relatedSignalSummaries.map(signal => (
            <TagChip
              key={signal.label}
              label={
                signal.count > 1
                  ? `${signal.label} x${signal.count}`
                  : signal.label
              }
            />
          ))}
        </View>
      ) : (
        <Text style={styles.supportText}>{copy.detailRelatedEmpty}</Text>
      )}

      {relatedDreams.length ? (
        <View style={styles.relatedList}>
          {relatedDreams.map(item => (
            <Pressable
              accessibilityRole="button"
              key={item.dream.id}
              style={({ pressed }) => [
                styles.relatedRow,
                pressed ? styles.relatedRowPressed : null,
              ]}
              onPress={() => onOpenRelatedDream(item.dream.id)}
            >
              <View style={styles.relatedCopy}>
                <Text style={styles.relatedTitle}>
                  {item.dream.title || copy.untitled}
                </Text>
                <Text style={styles.relatedMeta}>
                  {item.dream.sleepDate ||
                    new Date(item.dream.createdAt).toISOString().slice(0, 10)}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.colors.textDim}
              />
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.supportBlock}>
        <Text style={styles.supportHeading}>{copy.tagsTitle}</Text>
        <View style={styles.tagsRow}>
          {dream.tags.length ? (
            dream.tags.map(tag => <TagChip key={tag} label={tag} />)
          ) : (
            <Text style={styles.supportText}>{copy.detailTagsEmpty}</Text>
          )}
        </View>
      </View>
    </View>
  );
}
