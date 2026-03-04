import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../theme/theme';
import { Text } from './Text';
import { createSectionHeaderStyles } from './SectionHeader.styles';

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
  const styles = createSectionHeaderStyles(t, large);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}
