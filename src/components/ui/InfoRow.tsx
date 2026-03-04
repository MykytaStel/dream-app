import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../theme/theme';
import { Text } from './Text';
import { createInfoRowStyles } from './InfoRow.styles';

export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  const t = useTheme<Theme>();
  const styles = createInfoRowStyles(t);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text>{value}</Text>
    </View>
  );
}
