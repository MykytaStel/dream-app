import React from 'react';
import { Text as RNText, TextProps } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../theme/theme';
import { createTextStyles } from './Text.styles';

export const Text = ({ style, ...p }: TextProps) => {
  const t = useTheme<Theme>();
  const styles = createTextStyles(t);
  return (
    <RNText
      style={[styles.base, style]}
      {...p}
    />
  );
};
