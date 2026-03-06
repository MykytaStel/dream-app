import { Theme } from '../../../theme/theme';

export function getDreamLayout(theme: Theme) {
  const swipeActionWidth = 88;

  return {
    sectionGap: theme.spacing.sm,
    heroGap: theme.spacing.lg,
    rowGap: theme.spacing.xs,
    swipeActionWidth,
    swipeActionHeight: 96,
    swipeThreshold: Math.round(swipeActionWidth * 0.7),
    swipeDragOffset: 12,
    swipeActionHitSlop: 8,
    surfacePadding: theme.spacing.md,
  };
}
