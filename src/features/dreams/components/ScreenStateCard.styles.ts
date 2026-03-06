import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';

export function createScreenStateCardStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      gap: 12,
      minHeight: 154,
      justifyContent: 'center',
    },
    pill: {
      width: 30,
      height: 30,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    pillLoading: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    pillError: {
      backgroundColor: theme.colors.primaryAlt,
      borderColor: theme.colors.primaryAlt,
    },
    pillText: {
      color: theme.colors.background,
      fontWeight: '700',
      fontSize: 16,
      lineHeight: 18,
    },
  });
}
