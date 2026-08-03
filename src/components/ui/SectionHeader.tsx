import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../theme/theme';
import { useCalmMode } from '../../app/CalmModeProvider';
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
  // Calm mode drops the explanatory line and keeps the heading, which is the
  // part that says where you are.
  const { calmMode } = useCalmMode();
  const styles = React.useMemo(
    () => createSectionHeaderStyles(t, large),
    [t, large],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && !calmMode ? (
        <Text style={styles.subtitle}>{subtitle}</Text>
      ) : null}
    </View>
  );
}
