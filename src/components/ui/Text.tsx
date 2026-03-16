import React from 'react';
import { Text as RNText, TextProps } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../theme/theme';
import { getTextStyles } from './Text.styles';

export const Text = ({ style, ...p }: TextProps) => {
  const t = useTheme<Theme>();
  const styles = getTextStyles(t);
  return (
    <RNText
      style={[styles.base, style]}
      {...p}
    />
  );
};
