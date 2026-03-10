import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../theme/theme';

export function ListItemSeparator() {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        separator: {
          height: theme.spacing.sm,
        },
      }),
    [theme],
  );

  return <View style={styles.separator} />;
}
