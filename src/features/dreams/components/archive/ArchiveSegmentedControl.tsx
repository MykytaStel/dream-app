import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../../../../components/ui/Text';
import { createArchiveScreenStyles } from '../../screens/ArchiveScreen.styles';

type ArchiveSegmentedOption<TKey extends string> = {
  key: TKey;
  label: string;
};

type ArchiveSegmentedControlProps<TKey extends string> = {
  options: ReadonlyArray<ArchiveSegmentedOption<TKey>>;
  value: TKey;
  styles: ReturnType<typeof createArchiveScreenStyles>;
  onChange: (value: TKey) => void;
};

export function ArchiveSegmentedControl<TKey extends string>({
  options,
  value,
  styles,
  onChange,
}: ArchiveSegmentedControlProps<TKey>) {
  return (
    <View style={styles.browseModeChips}>
      {options.map(option => {
        const selected = value === option.key;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={option.key}
            style={[
              styles.modeChip,
              selected ? styles.modeChipActive : null,
            ]}
            onPress={() => onChange(option.key)}
          >
            <Text
              style={[
                styles.modeChipText,
                selected ? styles.modeChipTextActive : null,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
