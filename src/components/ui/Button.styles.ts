import { StyleSheet, ViewStyle } from 'react-native';
import { Theme } from '../../theme/theme';

type ButtonVariant = 'primary' | 'ghost' | 'danger';

export function createButtonStyles(theme: Theme, variant: ButtonVariant, disabled = false) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  return StyleSheet.create({
    container: {
      borderRadius: theme.borderRadii.xl,
      shadowColor: isPrimary ? theme.colors.glow : isDanger ? theme.colors.danger : 'transparent',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: isPrimary || isDanger ? 0.18 : 0,
      shadowRadius: 20,
      elevation: isPrimary || isDanger ? 6 : 0,
      opacity: disabled ? 0.56 : 1,
    },
    pressable: {
      paddingVertical: 15,
      paddingHorizontal: 18,
      borderRadius: theme.borderRadii.xl,
      borderWidth: 1,
      backgroundColor:
        isPrimary
          ? theme.colors.primary
          : isDanger
            ? theme.colors.danger
            : theme.colors.surfaceElevated,
      borderColor:
        isPrimary
          ? theme.colors.primary
          : isDanger
            ? theme.colors.danger
            : theme.colors.border,
    },
    label: {
      textAlign: 'center',
      fontWeight: '700',
      letterSpacing: 0.2,
      color: isPrimary || isDanger ? theme.colors.background : theme.colors.text,
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
