import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../theme/theme';
import { createCardStyles } from './Card.styles';

export const Card = ({ style, ...p }: ViewProps) => {
  const t = useTheme<Theme>();
  const styles = createCardStyles(t);
  return (
    <View
      style={[styles.card, style]}
      {...p}
    />
  );
};
