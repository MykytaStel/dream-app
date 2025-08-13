import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../theme/theme';

export const Card = ({ style, ...p }: ViewProps) => {
  const t = useTheme<Theme>();
  return (
    <View
      style={[{
        backgroundColor: t.colors.surface,
        borderRadius: t.borderRadii.lg,
        padding: t.spacing.lg,
        borderWidth: 1,
        borderColor: t.colors.border,
      }, style]}
      {...p}
    />
  );
};