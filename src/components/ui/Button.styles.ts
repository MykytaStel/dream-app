import { StyleSheet, ViewStyle } from 'react-native';
import { Theme } from '../../theme/theme';

type ButtonVariant = 'primary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export function createButtonStyles(
  theme: Theme,
  variant: ButtonVariant,
  size: ButtonSize,
  disabled = false,
) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const verticalPadding = size === 'sm' ? 9 : size === 'lg' ? 14 : 12;
  const horizontalPadding = size === 'sm' ? 12 : size === 'lg' ? 18 : 15;
  const labelSize = size === 'sm' ? 12 : size === 'lg' ? 15 : 14;

  return StyleSheet.create({
    container: {
      borderRadius: theme.borderRadii.xl,
      shadowColor: isPrimary ? theme.colors.glow : isDanger ? theme.colors.danger : 'transparent',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isPrimary || isDanger ? 0.14 : 0,
      shadowRadius: 16,
      elevation: isPrimary || isDanger ? 4 : 0,
      opacity: disabled ? 0.56 : 1,
    },
    pressable: {
      paddingVertical: verticalPadding,
      paddingHorizontal: horizontalPadding,
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
    contentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
    },
    label: {
      textAlign: 'center',
      fontWeight: '700',
      fontSize: labelSize,
      lineHeight: labelSize + 2,
      letterSpacing: 0.1,
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
