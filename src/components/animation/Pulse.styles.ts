import { StyleSheet } from 'react-native';
import { Theme } from '../../theme/theme';

export function createPulseStyles(theme: Theme, size: number) {
  return StyleSheet.create({
    pulse: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.glow,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.28,
      shadowRadius: 24,
      elevation: 8,
    },
  });
}
