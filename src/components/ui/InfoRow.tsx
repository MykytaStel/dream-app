import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../theme/theme';
import { Text } from './Text';
import { createInfoRowStyles } from './InfoRow.styles';

export function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  const t = useTheme<Theme>();
  const styles = React.useMemo(() => createInfoRowStyles(t), [t]);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}
