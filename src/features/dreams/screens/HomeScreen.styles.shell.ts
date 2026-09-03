import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';
import { createSoftTile } from '../../../theme/surfaces';
import { getDreamLayout } from '../constants/layout';

export function createHomeShellStyles(theme: Theme) {
  const layout = getDreamLayout(theme);
  return StyleSheet.create({
    emptyContainer: {
      justifyContent: 'center',
    },
    listContent: {
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    listHeaderContent: {
      gap: theme.spacing.xs,
    },
    homeModuleStack: {
      gap: theme.spacing.xs,
    },
    emptyCard: {
      gap: 10,
    },
    skeletonCard: {
      gap: 12,
      padding: 12,
    },
    skeletonHeaderRow: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
    },
    skeletonDateBadge: {
      width: 52,
      height: 56,
      borderRadius: theme.borderRadii.lg,
    },
    skeletonHeaderCopy: {
      flex: 1,
      gap: 8,
    },
    skeletonPreviewBlock: {
      ...createSoftTile(theme),
      gap: 8,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 10,
    },
    skeletonFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    dreamCard: {
      gap: 10,
      padding: 12,
    },
    dreamCardVisual: {
      overflow: 'hidden',
      position: 'relative',
    },
    dreamCardStarred: {
      borderColor: `${theme.colors.accent}55`,
    },
    dreamCardGlowLarge: {
      position: 'absolute',
      width: 108,
      height: 108,
      borderRadius: 999,
      top: -26,
      right: -18,
      opacity: 0.9,
    },
    dreamCardGlowSmall: {
      position: 'absolute',
      width: 76,
      height: 76,
      borderRadius: 999,
      bottom: -26,
      left: 26,
      opacity: 0.7,
    },
    dreamCardAccentBar: {
      position: 'absolute',
      left: 12,
      right: 18,
      top: 0,
      height: 3,
      borderRadius: 999,
      opacity: 0.95,
    },
    dreamPressable: {
      borderRadius: theme.borderRadii.xl,
    },
    dreamPressablePressed: {
      transform: [{ scale: 0.992 }],
      opacity: 0.96,
    },
    swipeableContainer: {
      borderRadius: theme.borderRadii.xl,
      overflow: 'hidden',
    },
    swipeActionsContainer: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 8,
    },
    swipeRightActionsContainer: {
      paddingLeft: 8,
    },
    swipeLeftActionsContainer: {
      paddingRight: 8,
    },
    swipeAction: {
      ...createSoftTile(theme),
      width: layout.swipeActionWidth,
      minHeight: layout.swipeActionHeight,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 10,
      borderRadius: theme.borderRadii.md,
    },
    swipeEditAction: {
      backgroundColor: theme.colors.surfaceAlt,
    },
    swipeDeleteAction: {
      backgroundColor: theme.colors.primaryAlt,
      borderColor: theme.colors.primaryAlt,
    },
    swipeArchiveAction: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    swipeUnarchiveAction: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    swipeActionText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.text,
      textAlign: 'center',
    },
    swipeActionTextInverted: {
      color: theme.colors.onPrimary,
    },
  });
}
