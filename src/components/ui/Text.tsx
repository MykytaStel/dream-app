import React from 'react';
import { Text as RNText, TextProps } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../theme/theme';

export const Text = ({ style, ...p }: TextProps) => {
  const t = useTheme<Theme>();
  return (
    <RNText
      // eslint-disable-next-line react-native/no-inline-styles
      style={[{ color: t.colors.text, fontSize: 16 }, style]}
      {...p}
    />
  );
};