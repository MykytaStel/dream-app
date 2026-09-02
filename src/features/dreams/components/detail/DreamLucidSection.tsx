import React from 'react';
import { View } from 'react-native';
import { Text } from '../../../../components/ui/Text';
import { Button } from '../../../../components/ui/Button';
import { InfoRow } from '../../../../components/ui/InfoRow';
import { TagChip } from '../../../../components/ui/TagChip';
import type { DreamDetailScreenStyles } from '../../screens/DreamDetailScreen.styles';
import type {
  DreamDetailCopy,
  DreamDetailViewModel,
} from '../../model/dreamDetailPresentation';
import type { Dream } from '../../model/dream';

/**
 * What was practised, and what it produced.
 *
 * Lifted out of `DreamDetailSections`, which held seven of these in one
 * thousand-line component. Nothing here changes: the same JSX, the same order,
 * the same conditions. What it gains is a boundary — this section reads
 * `dream.lucidPractice` and four label maps, and cannot accidentally start
 * depending on the transcript editor two hundred lines above it.
 *
 * The chip lists are derived here rather than passed in, because they are
 * nothing but this section's own fields run through this section's own labels.
 */

type DreamLucidSectionProps = {
  dream: Dream;
  viewModel: DreamDetailViewModel;
  copy: DreamDetailCopy;
  styles: DreamDetailScreenStyles;
  practiceCopy: {
    openLucid: string;
    lucidDreamSignsLabel: string;
    lucidTriggerLabel: string;
    lucidRecallLabel: string;
    lucidStabilizationLabel: string;
  };
  lucidTechniqueLabels: Record<string, string>;
  lucidControlLabels: Record<string, string>;
  lucidStabilizationLabels: Record<string, string>;
  onOpenDreamPractice: (focus: 'lucid' | 'nightmares') => void;
};

export function DreamLucidSection({
  dream,
  viewModel,
  copy,
  styles,
  practiceCopy,
  lucidTechniqueLabels,
  lucidControlLabels,
  lucidStabilizationLabels,
  onOpenDreamPractice,
}: DreamLucidSectionProps) {
  const lucidDreamSignChips = dream.lucidPractice?.dreamSigns ?? [];
  const lucidControlChips = (dream.lucidPractice?.controlAreas ?? []).map(
    value => lucidControlLabels[value] ?? value,
  );
  const lucidStabilizationChips = (
    dream.lucidPractice?.stabilizationActions ?? []
  ).map(value => lucidStabilizationLabels[value] ?? value);

  return (
    <View style={styles.sheetSection}>
      <Text style={styles.sheetHeading}>{practiceCopy.openLucid}</Text>
      {dream.lucidPractice || viewModel.lucidityLabel ? (
        <>
          <View style={styles.actionGroup}>
            <Button
              title={practiceCopy.openLucid}
              variant="ghost"
              size="sm"
              onPress={() => onOpenDreamPractice('lucid')}
            />
          </View>
          {dream.lucidPractice?.technique ? (
            <InfoRow
              label={practiceCopy.openLucid}
              value={
                lucidTechniqueLabels[dream.lucidPractice.technique] ??
                dream.lucidPractice.technique
              }
            />
          ) : null}
          {typeof dream.lucidPractice?.recallScore === 'number' ? (
            <InfoRow
              label={practiceCopy.lucidRecallLabel}
              value={String(dream.lucidPractice.recallScore)}
            />
          ) : null}
          {dream.lucidPractice?.trigger ? (
            <View style={styles.contextNoteCard}>
              <Text style={styles.supportHeading}>
                {practiceCopy.lucidTriggerLabel}
              </Text>
              <Text style={styles.contextNoteText}>
                {dream.lucidPractice.trigger}
              </Text>
            </View>
          ) : null}
          {lucidDreamSignChips.length ? (
            <View style={styles.supportBlock}>
              <Text style={styles.supportHeading}>
                {practiceCopy.lucidDreamSignsLabel}
              </Text>
              <View style={styles.tagsRow}>
                {lucidDreamSignChips.map(value => (
                  <TagChip key={value} label={value} />
                ))}
              </View>
            </View>
          ) : null}
          {lucidControlChips.length ? (
            <View style={styles.supportBlock}>
              <Text style={styles.supportHeading}>Control</Text>
              <View style={styles.tagsRow}>
                {lucidControlChips.map(value => (
                  <TagChip key={value} label={value} />
                ))}
              </View>
            </View>
          ) : null}
          {lucidStabilizationChips.length ? (
            <View style={styles.supportBlock}>
              <Text style={styles.supportHeading}>
                {practiceCopy.lucidStabilizationLabel}
              </Text>
              <View style={styles.tagsRow}>
                {lucidStabilizationChips.map(value => (
                  <TagChip key={value} label={value} />
                ))}
              </View>
            </View>
          ) : null}
        </>
      ) : (
        <Text style={styles.supportText}>{copy.detailLucidPracticeEmpty}</Text>
      )}
    </View>
  );
}
