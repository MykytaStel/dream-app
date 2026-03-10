import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Text } from './Text';
import { createControlPill } from '../../theme/surfaces';
import { Theme } from '../../theme/theme';

export type SegmentedControlOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: ReadonlyArray<SegmentedControlOption<T>>;
  selectedValue: T;
  onChange: (value: T) => void;
  columns?: 2 | 3;
  minWidth?: number;
};

export function SegmentedControl<T extends string>({
  options,
  selectedValue,
  onChange,
  columns = 3,
  minWidth = 96,
}: SegmentedControlProps<T>) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(
    () => createStyles(theme, columns, minWidth),
    [columns, minWidth, theme],
  );

  return (
    <View style={styles.row}>
      {options.map(option => {
        const selected = option.value === selectedValue;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.chip,
              selected ? styles.chipActive : null,
              pressed ? styles.chipPressed : null,
            ]}
          >
            <Text style={[styles.chipText, selected ? styles.chipTextActive : null]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(theme: Theme, columns: 2 | 3, minWidth: number) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 7,
        paddingHorizontal: 11,
      }),
      flexGrow: 1,
      flexBasis: columns === 2 ? '48%' : '31%',
      minWidth,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    chipPressed: {
      opacity: 0.92,
    },
    chipText: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '700',
      textAlign: 'center',
    },
    chipTextActive: {
      color: theme.colors.background,
    },
  });
}
