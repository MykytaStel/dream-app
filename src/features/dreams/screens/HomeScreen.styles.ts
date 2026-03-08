import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';
import { getDreamLayout } from '../constants/layout';

export function createHomeScreenStyles(theme: Theme) {
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
      gap: theme.spacing.xs + 2,
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
      gap: 12,
      padding: 12,
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
      color: theme.colors.background,
    },
    heroCard: {
      gap: 10,
      overflow: 'hidden',
      padding: 14,
      position: 'relative',
    },
    heroOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 2,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.background,
      overflow: 'hidden',
    },
    heroFrame: {
      flex: 1,
      justifyContent: 'flex-start',
      gap: 12,
    },
    heroGlowLarge: {
      position: 'absolute',
      width: 104,
      height: 104,
      borderRadius: 999,
      backgroundColor: theme.colors.auroraMid,
      opacity: 0.1,
      top: -4,
      right: -10,
    },
    heroGlowSmall: {
      position: 'absolute',
      width: 72,
      height: 72,
      borderRadius: 999,
      backgroundColor: theme.colors.accent,
      opacity: 0.08,
      bottom: 8,
      left: -12,
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 18,
    },
    heroCopy: {
      flex: 1,
      gap: layout.rowGap,
      paddingRight: 10,
    },
    heroMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    heroDateRow: {
      marginTop: 2,
      alignItems: 'flex-start',
    },
    heroEyebrow: {
      color: theme.colors.accent,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    heroDateChip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingHorizontal: 9,
        paddingVertical: 5,
      }),
    },
    heroDateChipLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    heroTitle: {
      fontSize: 28,
      lineHeight: 32,
      fontWeight: '700',
      flexShrink: 1,
      includeFontPadding: false,
    },
    heroSubtitle: {
      color: theme.colors.textDim,
      lineHeight: 18,
      fontSize: 13,
      flexShrink: 1,
      maxWidth: '100%',
    },
    heroVisualShell: {
      width: 54,
      height: 54,
      borderRadius: 16,
      backgroundColor: 'rgba(28, 34, 53, 0.82)',
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.primaryAlt,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 4,
      marginTop: 10,
      marginRight: 4,
    },
    heroFacet: {
      position: 'absolute',
      width: 20,
      height: 20,
      borderRadius: 8,
      transform: [{ rotate: '45deg' }],
    },
    heroFacetPrimary: {
      top: 14,
      backgroundColor: theme.colors.primary,
    },
    heroFacetAccent: {
      left: 15,
      bottom: 16,
      backgroundColor: theme.colors.accent,
    },
    heroFacetAlt: {
      right: 15,
      bottom: 16,
      backgroundColor: theme.colors.auroraMid,
    },
    heroFooter: {
      gap: 8,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    timelineHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    timelineHeaderCopy: {
      flex: 1,
    },
    timelineHeaderActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 0,
    },
    timelineCountPill: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingHorizontal: 9,
        paddingVertical: 5,
      }),
      alignSelf: 'flex-start',
    },
    timelineCountLabel: {
      color: theme.colors.text,
      fontSize: 11,
      fontWeight: '700',
    },
    recentLimitHint: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
      marginTop: -4,
    },
    spotlightCard: {
      gap: 10,
      overflow: 'hidden',
    },
    spotlightHeader: {
      gap: 4,
    },
    spotlightSubtitle: {
      color: theme.colors.textDim,
      fontSize: 13,
      lineHeight: 18,
    },
    spotlightLeadRow: {
      gap: 7,
    },
    spotlightSecondaryRow: {
      flexDirection: 'row',
      gap: 7,
      flexWrap: 'wrap',
    },
    spotlightTile: {
      ...createSoftTile(theme),
      gap: 3,
      paddingVertical: 9,
      paddingHorizontal: 10,
    },
    spotlightTileLead: {
      minWidth: '100%',
      paddingVertical: 11,
      paddingHorizontal: 12,
    },
    spotlightCompactTile: {
      flex: 1,
      minWidth: 132,
      gap: 3,
    },
    spotlightTileFeatured: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.surface,
    },
    spotlightTilePressed: {
      opacity: 0.96,
      transform: [{ scale: 0.992 }],
    },
    spotlightLabel: {
      color: theme.colors.textDim,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    spotlightValue: {
      color: theme.colors.text,
      fontSize: 18,
      lineHeight: 22,
      fontWeight: '700',
    },
    spotlightCompactValue: {
      color: theme.colors.text,
      fontSize: 16,
      lineHeight: 20,
      fontWeight: '700',
    },
    spotlightHint: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 15,
    },
    statChip: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 12,
        paddingVertical: 7,
        paddingHorizontal: 10,
      }),
      flex: 1,
      gap: 2,
      minHeight: 54,
    },
    statLabel: {
      color: theme.colors.textDim,
      fontSize: 10,
      lineHeight: 13,
    },
    statValue: {
      fontSize: 15,
      lineHeight: 18,
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
      marginTop: -2,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    searchCard: {
      gap: 10,
    },
    primaryControlsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 10,
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
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 6,
        paddingHorizontal: 10,
      }),
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
    emptyActionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
    },
    searchPresetHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
    },
    searchPresetLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    searchPresetSaveButton: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 5,
        paddingHorizontal: 9,
      }),
    },
    searchPresetSaveButtonText: {
      color: theme.colors.text,
      fontSize: 11,
      fontWeight: '700',
    },
    searchPresetRow: {
      flexDirection: 'row',
      gap: 8,
      paddingRight: 4,
    },
    filterGroup: {
      gap: 8,
    },
    filterGroupLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '600',
    },
    filterGroupMetaLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '600',
    },
    filterSelectionBlock: {
      gap: 8,
    },
    filterButton: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 6,
        paddingHorizontal: 10,
      }),
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
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 6,
        paddingHorizontal: 10,
      }),
    },
    clearFiltersButtonText: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '700',
    },
    filterEmptyText: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    filterMoreButton: {
      alignSelf: 'flex-start',
      paddingVertical: 4,
    },
    filterMoreButtonText: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '700',
    },
    filterSheetRoot: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(7, 11, 28, 0.35)',
    },
    filterSheetBackdrop: {
      flex: 1,
    },
    filterSheetCard: {
      gap: 12,
      borderTopLeftRadius: theme.borderRadii.xl,
      borderTopRightRadius: theme.borderRadii.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderBottomWidth: 0,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 24,
    },
    filterSheetHeader: {
      gap: 10,
    },
    filterSheetHandle: {
      alignSelf: 'center',
      width: 42,
      height: 5,
      borderRadius: 999,
      backgroundColor: theme.colors.border,
    },
    filterSheetBody: {
      gap: 14,
      paddingBottom: 8,
    },
    filterSheetScroll: {
      maxHeight: 460,
    },
    dreamHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    dateBadge: {
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 50,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 7,
      paddingHorizontal: 8,
    },
    dateBadgeFeatured: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.surface,
    },
    weekday: {
      color: theme.colors.textDim,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    dayNumber: {
      fontSize: 18,
      lineHeight: 21,
      fontWeight: '700',
    },
    month: {
      color: theme.colors.textDim,
      fontSize: 11,
    },
    dreamHeaderCopy: {
      flex: 1,
      gap: 5,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    title: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '700',
      flex: 1,
      includeFontPadding: false,
    },
    moodDot: {
      width: 10,
      height: 10,
      borderRadius: 999,
    },
    timestampRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
    },
    timestamp: {
      color: theme.colors.textDim,
      fontSize: 11,
    },
    moodPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: theme.borderRadii.pill,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
    },
    moodPillText: {
      color: theme.colors.text,
      fontSize: 11,
      fontWeight: '600',
    },
    previewPanel: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 9,
      paddingHorizontal: 10,
    },
    previewAccent: {
      width: 3,
      borderRadius: 999,
    },
    preview: {
      color: theme.colors.textDim,
      flex: 1,
      lineHeight: 18,
      fontSize: 13,
    },
    dreamFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 10,
      flexWrap: 'wrap',
    },
    statePills: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      flex: 1,
    },
    matchReasonsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    matchReasonPill: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 4,
        paddingHorizontal: 8,
      }),
      borderColor: theme.colors.accent,
    },
    matchReasonPillText: {
      color: theme.colors.text,
      fontSize: 10,
      fontWeight: '700',
    },
    statePill: {
      borderRadius: theme.borderRadii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    statePillText: {
      color: theme.colors.textDim,
      fontSize: 10,
      fontWeight: '700',
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      justifyContent: 'flex-end',
    },
    tagPill: {
      borderRadius: theme.borderRadii.pill,
      paddingVertical: 4,
      paddingHorizontal: 8,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    tagOverflowPill: {
      backgroundColor: theme.colors.surfaceAlt,
    },
    tagPillText: {
      color: theme.colors.textDim,
      fontSize: 10,
      fontWeight: '600',
    },
  });
}
