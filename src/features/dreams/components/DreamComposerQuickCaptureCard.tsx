import React from 'react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { FormField } from '../../../components/ui/FormField';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import {
  type DreamComposerCopy,
  type DreamComposerStyles,
} from './DreamComposer.types';

type DreamComposerQuickCaptureCardProps = {
  styles: DreamComposerStyles;
  copy: DreamComposerCopy;
  text: string;
  onChangeText: (value: string) => void;
  title: string;
  onChangeTitle: (value: string) => void;
  sleepDate: string;
  onChangeSleepDate: (value: string) => void;
  hasInvalidSleepDate: boolean;
  hasTriedSave: boolean;
  hasMissingContent: boolean;
  textWordCount: number;
  showMeta: boolean;
  onToggleMeta: () => void;
  autoFocus?: boolean;
};

export function DreamComposerQuickCaptureCard({
  styles,
  copy,
  text,
  onChangeText,
  title,
  onChangeTitle,
  sleepDate,
  onChangeSleepDate,
  hasInvalidSleepDate,
  hasTriedSave,
  hasMissingContent,
  textWordCount,
  showMeta,
  onToggleMeta,
  autoFocus = false,
}: DreamComposerQuickCaptureCardProps) {
  const helperText =
    hasTriedSave && hasMissingContent
      ? copy.saveErrorDescription
      : `${textWordCount} ${copy.wordsUnit}`;
  const helperTone = hasTriedSave && hasMissingContent ? 'error' : 'default';

  return (
    <Card style={styles.card}>
      <SectionHeader
        title={copy.recordEmptyTitle}
        subtitle={copy.recordEmptyDescription}
      />

      <FormField
        label={copy.textLabel}
        placeholder={copy.textPlaceholder}
        value={text}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        multiline
        inputStyle={styles.textInput}
        helperText={helperText}
        helperTone={helperTone}
        invalid={hasTriedSave && hasMissingContent}
      />

      <Button
        title={showMeta ? copy.refineHideAction : copy.wakeRefineMetaAction}
        onPress={onToggleMeta}
        variant="ghost"
        size="sm"
        icon={showMeta ? 'chevron-up-outline' : 'chevron-down-outline'}
      />

      {showMeta ? (
        <>
          <Text style={styles.refineHint}>{copy.wakeMetaDescription}</Text>
          <FormField
            label={copy.titleLabel}
            placeholder={copy.titlePlaceholder}
            value={title}
            onChangeText={onChangeTitle}
          />
          <FormField
            label={copy.sleepDateLabel}
            placeholder={copy.sleepDatePlaceholder}
            value={sleepDate}
            onChangeText={onChangeSleepDate}
            autoCapitalize="none"
            autoCorrect={false}
            invalid={hasInvalidSleepDate}
            helperText={
              hasInvalidSleepDate ? copy.sleepDateInvalidDescription : undefined
            }
            helperTone={hasInvalidSleepDate ? 'error' : 'default'}
          />
        </>
      ) : null}
    </Card>
  );
}
