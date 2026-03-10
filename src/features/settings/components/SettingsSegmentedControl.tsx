import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Text } from '../../../components/ui/Text';
import { createControlPill } from '../../../theme/surfaces';
import { Theme } from '../../../theme/theme';

type SettingsSegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type SettingsSegmentedControlProps<T extends string> = {
  options: SettingsSegmentedOption<T>[];
  selectedValue: T;
  onChange: (value: T) => void;
};

export function SettingsSegmentedControl<T extends string>({
  options,
  selectedValue,
  onChange,
}: SettingsSegmentedControlProps<T>) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

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

function createStyles(theme: Theme) {
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
      flexBasis: '48%',
      minWidth: 120,
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
