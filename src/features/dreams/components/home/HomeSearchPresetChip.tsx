import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Text } from '../../../../components/ui/Text';
import { createControlPill } from '../../../../theme/surfaces';
import { Theme } from '../../../../theme/theme';

type HomeSearchPresetChipProps = {
  label: string;
  active?: boolean;
  removeLabel: string;
  onPress: () => void;
  onRemove: () => void;
};

export function HomeSearchPresetChip({
  label,
  active = false,
  removeLabel,
  onPress,
  onRemove,
}: HomeSearchPresetChipProps) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme, active), [active, theme]);

  return (
    <View style={styles.chip}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.labelPressable, pressed ? styles.pressed : null]}
      >
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={removeLabel}
        style={({ pressed }) => [styles.removeButton, pressed ? styles.pressed : null]}
      >
        <Ionicons
          name="close"
          size={12}
          color={active ? theme.colors.background : theme.colors.textDim}
        />
      </Pressable>
    </View>
  );
}

function createStyles(theme: Theme, active: boolean) {
  return StyleSheet.create({
    chip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 4,
        paddingHorizontal: 8,
      }),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: active ? theme.colors.primary : theme.colors.surface,
      borderColor: active ? theme.colors.primary : theme.colors.border,
      maxWidth: 180,
    },
    labelPressable: {
      flexShrink: 1,
    },
    label: {
      color: active ? theme.colors.background : theme.colors.text,
      fontSize: 11,
      fontWeight: '700',
    },
    removeButton: {
      width: 18,
      height: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
    },
    pressed: {
      opacity: 0.78,
    },
  });
}
