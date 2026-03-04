import { StyleSheet, ViewStyle } from 'react-native';
import { Theme } from '../../theme/theme';

export function createButtonStyles(theme: Theme, isPrimary: boolean) {
  return StyleSheet.create({
    container: {
      borderRadius: theme.borderRadii.xl,
      shadowColor: isPrimary ? theme.colors.glow : 'transparent',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isPrimary ? 0.18 : 0,
      shadowRadius: 20,
      elevation: isPrimary ? 6 : 0,
    },
    pressable: {
      paddingVertical: 15,
      paddingHorizontal: 18,
      borderRadius: theme.borderRadii.xl,
      borderWidth: 1,
      backgroundColor: isPrimary ? theme.colors.primary : theme.colors.surfaceElevated,
      borderColor: isPrimary ? theme.colors.primary : theme.colors.border,
    },
    label: {
      textAlign: 'center',
      fontWeight: '700',
      letterSpacing: 0.2,
      color: isPrimary ? theme.colors.background : theme.colors.text,
    },
  });
}

export const createButtonAnimatedStyle = (pressed: boolean) => ({
  transform: [
    { scale: pressed ? 0.985 : 1 },
    { translateY: pressed ? 1 : 0 },
  ],
});

export type ButtonStyle = ViewStyle;
