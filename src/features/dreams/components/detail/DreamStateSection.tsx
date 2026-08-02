import React from 'react';
import { View } from 'react-native';
import { Text } from '../../../../components/ui/Text';
import { TagChip } from '../../../../components/ui/TagChip';
import { InfoRow } from '../../../../components/ui/InfoRow';
import type { DreamDetailScreenStyles } from '../../screens/DreamDetailScreen.styles';
import type {
  DreamDetailCopy,
  DreamDetailViewModel,
} from '../../model/dreamDetailPresentation';
import type { Dream } from '../../model/dream';

/**
 * The state the dreamer was in, before and after.
 *
 * Fifth section out of `DreamDetailSections`. The wake-emotion chips drop any
 * emotion that repeats the mood label, so the same word does not appear twice
 * side by side — a rule that belongs with the chips it filters.
 */

type DreamStateSectionProps = {
  dream: Dream;
  copy: DreamDetailCopy;
  styles: DreamDetailScreenStyles;
  viewModel: DreamDetailViewModel;
  stressLabels: Record<number, string>;
  wakeEmotionLabels: Record<string, string>;
  preSleepEmotionLabels: Record<string, string>;
};

export function DreamStateSection({
  dream,
  copy,
  styles,
  viewModel,
  stressLabels,
  wakeEmotionLabels,
  preSleepEmotionLabels,
}: DreamStateSectionProps) {
  const wakeEmotionChips = React.useMemo(() => {
    const moodLabel = viewModel.moodLabel?.toLowerCase();
    return (dream.wakeEmotions ?? [])
      .map(emotion => wakeEmotionLabels[emotion] ?? emotion)
      .filter(label => label.toLowerCase() !== moodLabel);
  }, [dream.wakeEmotions, viewModel.moodLabel, wakeEmotionLabels]);

  return (
    <View style={styles.sheetSection}>
      <Text style={styles.sheetHeading}>{copy.detailStateTitle}</Text>

      {!viewModel.hasContext &&
      !viewModel.hasEmotions &&
      !viewModel.hasLucidity ? (
        <Text style={styles.supportText}>{copy.detailStateEmpty}</Text>
      ) : (
        <>
          {viewModel.lucidityLabel ? (
            <View style={styles.supportBlock}>
              <Text style={styles.supportHeading}>
                {copy.detailLucidityLabel}
              </Text>
              <View style={styles.tagsRow}>
                <TagChip label={viewModel.lucidityLabel} />
              </View>
            </View>
          ) : null}

          {dream.wakeEmotions?.length ? (
            <View style={styles.supportBlock}>
              <Text style={styles.supportHeading}>
                {copy.detailWakeEmotionsLabel}
              </Text>
              {wakeEmotionChips.length ? (
                <View style={styles.tagsRow}>
                  {wakeEmotionChips.map(label => (
                    <TagChip key={label} label={label} />
                  ))}
                </View>
              ) : (
                <Text style={styles.supportText}>{viewModel.moodLabel}</Text>
              )}
            </View>
          ) : null}

          {dream.sleepContext?.preSleepEmotions?.length ? (
            <View style={styles.supportBlock}>
              <Text style={styles.supportHeading}>
                {copy.detailPreSleepEmotionsLabel}
              </Text>
              <View style={styles.tagsRow}>
                {dream.sleepContext.preSleepEmotions.map(emotion => (
                  <TagChip
                    key={emotion}
                    label={preSleepEmotionLabels[emotion] ?? emotion}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.contextFactsCard}>
            <View style={styles.utilityRows}>
              {typeof dream.sleepContext?.stressLevel === 'number' ? (
                <InfoRow
                  label={copy.stressLabel}
                  value={
                    stressLabels[dream.sleepContext.stressLevel] ??
                    String(dream.sleepContext.stressLevel)
                  }
                />
              ) : null}
              {typeof dream.sleepContext?.alcoholTaken === 'boolean' ? (
                <InfoRow
                  label={copy.alcoholLabel}
                  value={
                    dream.sleepContext.alcoholTaken ? copy.boolYes : copy.boolNo
                  }
                />
              ) : null}
              {typeof dream.sleepContext?.caffeineLate === 'boolean' ? (
                <InfoRow
                  label={copy.caffeineLabel}
                  value={
                    dream.sleepContext.caffeineLate ? copy.boolYes : copy.boolNo
                  }
                />
              ) : null}
            </View>
          </View>

          {dream.sleepContext?.medications ? (
            <View style={styles.contextNoteCard}>
              <Text style={styles.supportHeading}>{copy.medicationsLabel}</Text>
              <Text style={styles.contextNoteText}>
                {dream.sleepContext.medications}
              </Text>
            </View>
          ) : null}

          {dream.sleepContext?.importantEvents ? (
            <View style={styles.contextNoteCard}>
              <Text style={styles.supportHeading}>{copy.eventsLabel}</Text>
              <Text style={styles.contextNoteText}>
                {dream.sleepContext.importantEvents}
              </Text>
            </View>
          ) : null}

          {dream.sleepContext?.healthNotes ? (
            <View style={styles.contextNoteCard}>
              <Text style={styles.supportHeading}>{copy.healthNotesLabel}</Text>
              <Text style={styles.contextNoteText}>
                {dream.sleepContext.healthNotes}
              </Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}
