import { StyleSheet } from 'react-native';
import { Theme } from '../../theme/theme';

const cache = new WeakMap<Theme, ReturnType<typeof build>>();

function build(theme: Theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surfaceElevated,
      borderRadius: theme.borderRadii.xl,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.glow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 4,
    },
  });
}

export function getCardStyles(theme: Theme) {
  let styles = cache.get(theme);
  if (!styles) {
    styles = build(theme);
    cache.set(theme, styles);
  }
  return styles;
}
