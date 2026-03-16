import React from 'react';
import { Pressable } from 'react-native';
import { Text } from '../../../components/ui/Text';
import { DreamComposerStyles } from './DreamComposer.types';

type DreamComposerChoiceChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant: 'mood' | 'context';
  styles: DreamComposerStyles;
};

export function DreamComposerChoiceChip({
  label,
  selected,
  onPress,
  variant,
  styles,
}: DreamComposerChoiceChipProps) {
  const containerStyle =
    variant === 'mood'
      ? [styles.moodOption, selected ? styles.moodOptionSelected : null]
      : [styles.contextOption, selected ? styles.contextOptionSelected : null];

  const labelStyle =
    variant === 'mood'
      ? [styles.moodLabel, selected ? styles.moodLabelSelected : null]
      : [styles.contextOptionLabel, selected ? styles.contextOptionLabelSelected : null];

  return (
    <Pressable onPress={onPress} style={containerStyle}>
      <Text
        style={labelStyle}
        numberOfLines={variant === 'context' ? 1 : undefined}
        adjustsFontSizeToFit={variant === 'context'}
        minimumFontScale={variant === 'context' ? 0.85 : undefined}
      >
        {label}
      </Text>
    </Pressable>
  );
}
