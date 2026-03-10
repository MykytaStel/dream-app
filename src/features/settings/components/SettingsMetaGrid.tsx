import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';
import { createSoftTile } from '../../../theme/surfaces';

export type SettingsMetaItem = {
  label: string;
  value: string;
  wide?: boolean;
  icon?: string;
};

type SettingsMetaGridProps = {
  items: SettingsMetaItem[];
  dense?: boolean;
};

export function SettingsMetaGrid({ items, dense = false }: SettingsMetaGridProps) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.grid}>
      {items.map(item => (
        <View
          key={item.label}
          style={[
            styles.tile,
            dense ? styles.tileDense : null,
            item.wide ? styles.tileWide : null,
          ]}
        >
          <View style={styles.headerRow}>
            {item.icon ? (
              <View style={[styles.iconShell, dense ? styles.iconShellDense : null]}>
                <Ionicons
                  name={item.icon}
                  size={dense ? 13 : 14}
                  color={theme.colors.textDim}
                />
              </View>
            ) : null}
            <Text style={styles.label}>{item.label}</Text>
          </View>
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
    tileDense: {
      paddingVertical: 9,
      paddingHorizontal: 10,
      gap: 4,
    },
    tileWide: {
      flexBasis: '100%',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    iconShell: {
      width: 22,
      height: 22,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceAlt,
    },
    iconShellDense: {
      width: 20,
      height: 20,
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
