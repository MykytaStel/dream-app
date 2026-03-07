import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';

type SettingsSectionHeaderProps = {
  title: string;
  description?: string;
  trailing?: React.ReactNode;
};

export function SettingsSectionHeader({
  title,
  description,
  trailing,
}: SettingsSectionHeaderProps) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      {trailing}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    copy: {
      flex: 1,
      gap: 3,
    },
    title: {
      fontWeight: '700',
      lineHeight: 22,
      flexShrink: 1,
    },
    description: {
      marginTop: 1,
      color: theme.colors.textDim,
      lineHeight: 17,
      fontSize: 12,
      flexShrink: 1,
    },
  });
}
