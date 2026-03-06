import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';
import { getDreamLayout } from '../constants/layout';

export function createHomeScreenStyles(theme: Theme) {
  const layout = getDreamLayout(theme);

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
    },
    swipeRightActionsContainer: {
      paddingLeft: 8,
    },
    swipeLeftActionsContainer: {
      paddingRight: 8,
    },
    swipeAction: {
      width: layout.swipeActionWidth,
      minHeight: layout.swipeActionHeight,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 10,
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
      color: theme.colors.background,
    },
    heroCard: {
      gap: layout.heroGap,
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
      gap: layout.rowGap,
    },
    heroEyebrow: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    heroTitle: {
      fontSize: 26,
      lineHeight: 33,
      fontWeight: '700',
      flexShrink: 1,
      includeFontPadding: false,
    },
    heroSubtitle: {
      color: theme.colors.textDim,
      lineHeight: 22,
      flexShrink: 1,
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
    heroActionsRow: {
      flexDirection: 'row',
      gap: 10,
      flexWrap: 'wrap',
    },
    heroPrimaryAction: {
      flexGrow: 1,
      minWidth: 148,
    },
    heroSecondaryAction: {
      flexGrow: 1,
      minWidth: 148,
    },
    heroActionHint: {
      color: theme.colors.textDim,
      lineHeight: 20,
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
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    filtersCard: {
      gap: layout.sectionGap,
    },
    primaryControlsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
      flexWrap: 'wrap',
    },
    primaryActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    resultCount: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '600',
    },
    inlineActionButton: {
      borderRadius: theme.borderRadii.pill,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
    },
    inlineActionButtonActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    inlineActionButtonText: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '700',
    },
    inlineActionButtonTextActive: {
      color: theme.colors.background,
    },
    activeFiltersRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
    },
    filterGroup: {
      gap: 8,
    },
    filterGroupLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '600',
    },
    filterButton: {
      borderRadius: theme.borderRadii.pill,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
    },
    filterButtonActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    filterButtonLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '600',
    },
    filterButtonLabelActive: {
      color: theme.colors.background,
    },
    clearFiltersButton: {
      alignSelf: 'flex-start',
      borderRadius: theme.borderRadii.pill,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
    },
    clearFiltersButtonText: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '700',
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
      gap: layout.sectionGap,
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
      lineHeight: 24,
      fontWeight: '700',
      flex: 1,
      includeFontPadding: false,
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
