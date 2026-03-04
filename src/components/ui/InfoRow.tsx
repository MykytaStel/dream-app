/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../theme/theme';
import { Text } from './Text';

export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  const t = useTheme<Theme>();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: t.colors.textDim }}>{label}</Text>
      <Text>{value}</Text>
    </View>
  );
}
