import { StyleSheet } from 'react-native';
import { Theme } from '../../theme/theme';

export function createScreenContainerStyles(theme: Theme) {
  return StyleSheet.create({
    base: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
      paddingBottom: theme.spacing.xxl,
    },
  });
}
