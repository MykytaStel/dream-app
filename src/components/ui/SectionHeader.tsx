/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../theme/theme';
import { Text } from './Text';

export function SectionHeader({
  title,
  subtitle,
  large = false,
}: {
  title: string;
  subtitle?: string;
  large?: boolean;
}) {
  const t = useTheme<Theme>();

  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: large ? 28 : 22, fontWeight: '700' }}>{title}</Text>
      {subtitle ? <Text style={{ color: t.colors.textDim }}>{subtitle}</Text> : null}
    </View>
  );
}
