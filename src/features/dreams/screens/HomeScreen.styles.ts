import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';

export function createHomeScreenStyles(theme: Theme) {
  return StyleSheet.create({
    emptyContainer: {
      justifyContent: 'center',
    },
    emptyCard: {
      gap: 10,
    },
    dreamCard: {
      gap: 12,
    },
    dreamPressable: {
      borderRadius: theme.borderRadii.xl,
    },
    swipeableContainer: {
      borderRadius: theme.borderRadii.xl,
      overflow: 'hidden',
    },
    swipeActionsContainer: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 8,
      paddingLeft: 8,
    },
    swipeAction: {
      width: 84,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: theme.borderRadii.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
    },
    swipeEditAction: {
      backgroundColor: theme.colors.surfaceAlt,
    },
    swipeDeleteAction: {
      backgroundColor: theme.colors.primaryAlt,
      borderColor: theme.colors.primaryAlt,
    },
    swipeActionText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.text,
      textAlign: 'center',
    },
    heroCard: {
      gap: 18,
      overflow: 'hidden',
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 16,
    },
    heroCopy: {
      flex: 1,
      gap: 6,
    },
    heroEyebrow: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    heroTitle: {
      fontSize: 28,
      lineHeight: 32,
      fontWeight: '700',
    },
    heroSubtitle: {
      color: theme.colors.textDim,
    },
    heroFacet: {
      width: 54,
      height: 54,
      borderRadius: 18,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
      transform: [{ rotate: '14deg' }],
      shadowColor: theme.colors.primaryAlt,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 18,
      elevation: 6,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    statChip: {
      flex: 1,
      gap: 3,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 14,
    },
    statValue: {
      fontSize: 18,
      lineHeight: 22,
      fontWeight: '700',
    },
    sectionLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    sectionHint: {
      color: theme.colors.textDim,
    },
    dreamRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 14,
    },
    dateColumn: {
      alignItems: 'center',
      minWidth: 44,
      paddingTop: 2,
    },
    weekday: {
      color: theme.colors.textDim,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    dayNumber: {
      fontSize: 20,
      lineHeight: 24,
      fontWeight: '700',
    },
    month: {
      color: theme.colors.textDim,
      fontSize: 11,
    },
    dreamContent: {
      flex: 1,
      gap: 10,
    },
    dreamMeta: {
      gap: 6,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      flex: 1,
    },
    moodDot: {
      width: 10,
      height: 10,
      borderRadius: 999,
    },
    timestamp: {
      color: theme.colors.textDim,
    },
    preview: {
      color: theme.colors.textDim,
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    cardFacet: {
      width: 38,
      height: 38,
      borderRadius: 14,
      alignSelf: 'center',
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
      transform: [{ rotate: '18deg' }],
      opacity: 0.75,
    },
  });
}
