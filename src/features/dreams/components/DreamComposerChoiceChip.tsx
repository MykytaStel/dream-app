import React from 'react';
import { Pressable } from 'react-native';
import { Text } from '../../../components/ui/Text';
import { DreamComposerStyles } from './DreamComposer.types';

type DreamComposerChoiceChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant: 'mood' | 'context' | 'intensity';
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
      : variant === 'intensity'
        ? [styles.intensityOption, selected ? styles.intensityOptionSelected : null]
        : [styles.contextOption, selected ? styles.contextOptionSelected : null];

  const labelStyle =
    variant === 'mood'
      ? [styles.moodLabel, selected ? styles.moodLabelSelected : null]
      : variant === 'intensity'
        ? [styles.intensityOptionLabel, selected ? styles.intensityOptionLabelSelected : null]
        : [styles.contextOptionLabel, selected ? styles.contextOptionLabelSelected : null];

  return (
    <Pressable onPress={onPress} style={containerStyle}>
      <Text
        style={labelStyle}
        numberOfLines={variant !== 'mood' ? 1 : undefined}
        adjustsFontSizeToFit={variant !== 'mood'}
        minimumFontScale={variant !== 'mood' ? 0.85 : undefined}
      >
        {label}
      </Text>
    </Pressable>
  );
}
