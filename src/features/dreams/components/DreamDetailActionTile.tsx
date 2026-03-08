import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Text } from '../../../components/ui/Text';
import { createSoftTile } from '../../../theme/surfaces';
import { Theme } from '../../../theme/theme';

type DreamDetailActionTileProps = {
  icon: string;
  label: string;
  onPress: () => void;
  active?: boolean;
  danger?: boolean;
};

export function DreamDetailActionTile({
  icon,
  label,
  onPress,
  active = false,
  danger = false,
}: DreamDetailActionTileProps) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme, active, danger), [active, danger, theme]);
  const iconColor = danger
    ? theme.colors.danger
    : active
      ? theme.colors.background
      : theme.colors.text;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed ? styles.pressablePressed : null]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.iconShell}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

function createStyles(theme: Theme, active: boolean, danger: boolean) {
  const borderColor = danger
    ? theme.colors.danger
    : active
      ? theme.colors.primary
      : theme.colors.border;
  const backgroundColor = danger
    ? `${theme.colors.danger}14`
    : active
      ? theme.colors.primary
      : theme.colors.surfaceAlt;
  const iconShellBackground = danger
    ? `${theme.colors.danger}20`
    : active
      ? 'rgba(8, 14, 31, 0.18)'
      : theme.colors.surface;
  const labelColor = danger
    ? theme.colors.danger
    : active
      ? theme.colors.background
      : theme.colors.text;

  return StyleSheet.create({
    pressable: {
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 18,
        paddingVertical: 12,
        paddingHorizontal: 12,
      }),
      flex: 1,
      minWidth: 0,
      gap: 10,
      borderColor,
      backgroundColor,
    },
    pressablePressed: {
      opacity: 0.96,
      transform: [{ scale: 0.986 }],
    },
    iconShell: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: iconShellBackground,
    },
    label: {
      color: labelColor,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '700',
    },
  });
}
