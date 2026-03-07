import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';
import { createSoftTile } from '../../../theme/surfaces';

export type SettingsMetaItem = {
  label: string;
  value: string;
  wide?: boolean;
};

type SettingsMetaGridProps = {
  items: SettingsMetaItem[];
};

export function SettingsMetaGrid({ items }: SettingsMetaGridProps) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.grid}>
      {items.map(item => (
        <View key={item.label} style={[styles.tile, item.wide ? styles.tileWide : null]}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.value}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tile: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 10,
        paddingHorizontal: 11,
      }),
      flexGrow: 1,
      flexBasis: '48%',
      minWidth: 136,
      gap: 5,
    },
    tileWide: {
      flexBasis: '100%',
    },
    label: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.55,
    },
    value: {
      color: theme.colors.text,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600',
    },
  });
}
