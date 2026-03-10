import React from 'react';
import { Pressable } from 'react-native';
import { Text } from '../../../components/ui/Text';
import { DreamComposerStyles } from './DreamComposer.types';

type DreamComposerChoiceChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant: 'mood' | 'context';
  baseStyles: DreamComposerStyles;
  activeStyles: DreamComposerStyles;
};

export function DreamComposerChoiceChip({
  label,
  selected,
  onPress,
  variant,
  baseStyles,
  activeStyles,
}: DreamComposerChoiceChipProps) {
  const containerStyle =
    variant === 'mood'
      ? selected
        ? activeStyles.moodOption
        : baseStyles.moodOption
      : selected
        ? activeStyles.contextOption
        : baseStyles.contextOption;

  const labelStyle =
    variant === 'mood'
      ? selected
        ? activeStyles.moodLabel
        : baseStyles.moodLabel
      : selected
        ? activeStyles.contextOptionLabel
        : baseStyles.contextOptionLabel;

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
