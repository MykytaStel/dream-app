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
    },
    // Base for the strip that hides scrolled content behind the status bar;
    // `height` and `backgroundColor` are set per render from the live inset
    // and theme.
    statusBarMask: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      pointerEvents: 'none' as const,
    },
  });
}
