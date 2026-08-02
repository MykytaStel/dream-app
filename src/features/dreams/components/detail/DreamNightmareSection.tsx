import React from 'react';
import { View } from 'react-native';
import { Text } from '../../../../components/ui/Text';
import { Button } from '../../../../components/ui/Button';
import { InfoRow } from '../../../../components/ui/InfoRow';
import { TagChip } from '../../../../components/ui/TagChip';
import type { DreamDetailScreenStyles } from '../../screens/DreamDetailScreen.styles';
import type { DreamDetailCopy } from '../../model/dreamDetailPresentation';
import type { Dream } from '../../model/dream';

/**
 * What the nightmare did, and what was done about it.
 *
 * The counterpart of `DreamLucidSection`, lifted out of the same
 * thousand-line component for the same reason. It reads `dream.nightmare` and
 * three label maps and nothing else.
 */

type DreamNightmareSectionProps = {
  dream: Dream;
  copy: DreamDetailCopy;
  styles: DreamDetailScreenStyles;
  practiceCopy: {
    openNightmares: string;
    nightmareWokeLabel: string;
    nightmareAftereffectsLabel: string;
    nightmareGroundingTitle: string;
    nightmareRewriteStatusLabel: string;
    quickNightmareRewrite: string;
    nightmareRewritePrompt: string;
    nightmareGroundingBody: string;
  };
  nightmareAftereffectLabels: Record<string, string>;
  nightmareGroundingLabels: Record<string, string>;
  nightmareRescriptLabels: Record<string, string>;
  onOpenDreamPractice: (focus: 'lucid' | 'nightmares') => void;
  onEditDream: () => void;
};

export function DreamNightmareSection({
  dream,
  copy,
  styles,
  practiceCopy,
  nightmareAftereffectLabels,
  nightmareGroundingLabels,
  nightmareRescriptLabels,
  onOpenDreamPractice,
  onEditDream,
}: DreamNightmareSectionProps) {
  const nightmareAftereffectChips = (dream.nightmare?.aftereffects ?? []).map(
    value => nightmareAftereffectLabels[value] ?? value,
  );
  const nightmareGroundingChips = (dream.nightmare?.groundingUsed ?? []).map(
    value => nightmareGroundingLabels[value] ?? value,
  );

  return (
    <View style={styles.sheetSection}>
      <Text style={styles.sheetHeading}>{practiceCopy.openNightmares}</Text>
      {dream.nightmare || dream.tags.includes('nightmare') ? (
        <>
          <View style={styles.actionGroup}>
            <Button
              title={practiceCopy.openNightmares}
              variant="ghost"
              size="sm"
              onPress={() => onOpenDreamPractice('nightmares')}
            />
            <Button
              title={practiceCopy.quickNightmareRewrite}
              variant="ghost"
              size="sm"
              onPress={onEditDream}
            />
          </View>
          {typeof dream.nightmare?.distress === 'number' ? (
            <InfoRow
              label="Distress"
              value={String(dream.nightmare.distress)}
            />
          ) : null}
          {typeof dream.nightmare?.wokeFromDream === 'boolean' ? (
            <InfoRow
              label={practiceCopy.nightmareWokeLabel}
              value={dream.nightmare.wokeFromDream ? copy.boolYes : copy.boolNo}
            />
          ) : null}
          {dream.nightmare?.recurringKey ? (
            <InfoRow
              label="Recurring pattern"
              value={dream.nightmare.recurringKey}
            />
          ) : null}
          {nightmareAftereffectChips.length ? (
            <View style={styles.supportBlock}>
              <Text style={styles.supportHeading}>
                {practiceCopy.nightmareAftereffectsLabel}
              </Text>
              <View style={styles.tagsRow}>
                {nightmareAftereffectChips.map(value => (
                  <TagChip key={value} label={value} />
                ))}
              </View>
            </View>
          ) : null}
          {nightmareGroundingChips.length ? (
            <View style={styles.supportBlock}>
              <Text style={styles.supportHeading}>
                {practiceCopy.nightmareGroundingTitle}
              </Text>
              <View style={styles.tagsRow}>
                {nightmareGroundingChips.map(value => (
                  <TagChip key={value} label={value} />
                ))}
              </View>
            </View>
          ) : null}
          {dream.nightmare?.rewrittenEnding ? (
            <View style={styles.contextNoteCard}>
              <Text style={styles.supportHeading}>
                {practiceCopy.quickNightmareRewrite}
              </Text>
              <Text style={styles.contextNoteText}>
                {dream.nightmare.rewrittenEnding}
              </Text>
            </View>
          ) : null}
          {dream.nightmare?.rescriptStatus ? (
            <InfoRow
              label={practiceCopy.nightmareRewriteStatusLabel}
              value={
                nightmareRescriptLabels[dream.nightmare.rescriptStatus] ??
                dream.nightmare.rescriptStatus
              }
            />
          ) : null}
        </>
      ) : (
        <Text style={styles.supportText}>
          {practiceCopy.nightmareGroundingBody}
        </Text>
      )}
    </View>
  );
}
