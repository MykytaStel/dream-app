import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';

export function createArchiveScreenStyles(theme: Theme) {
  return StyleSheet.create({
    content: {
      paddingTop: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    headerBlock: {
      gap: 12,
    },
    titleBlock: {
      gap: 4,
      paddingHorizontal: 2,
    },
    toolbarCard: {
      gap: 12,
      padding: 16,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
      position: 'relative',
      borderColor: `${theme.colors.border}CC`,
    },
    controlsCard: {
      gap: 10,
      padding: 16,
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: `${theme.colors.border}E6`,
    },
    toolbarGlowLarge: {
      position: 'absolute',
      width: 150,
      height: 150,
      borderRadius: 999,
      backgroundColor: theme.colors.auroraMid,
      opacity: 0.08,
      top: -46,
      right: -36,
    },
    toolbarGlowSmall: {
      position: 'absolute',
      width: 86,
      height: 86,
      borderRadius: 999,
      backgroundColor: theme.colors.accent,
      opacity: 0.06,
      bottom: -26,
      left: -16,
    },
    toolbarVisualShell: {
      position: 'absolute',
      top: 14,
      right: 16,
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: 'rgba(28, 34, 53, 0.72)',
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0.88,
    },
    toolbarFacet: {
      position: 'absolute',
      width: 12,
      height: 12,
      borderRadius: 4,
      transform: [{ rotate: '45deg' }],
    },
    toolbarFacetPrimary: {
      top: 8,
      backgroundColor: theme.colors.primary,
    },
    toolbarFacetAccent: {
      left: 10,
      bottom: 10,
      backgroundColor: theme.colors.accent,
    },
    toolbarFacetAlt: {
      right: 10,
      bottom: 10,
      backgroundColor: theme.colors.auroraMid,
    },
    controlsMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    controlsMetaChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 5,
        paddingHorizontal: 9,
      }),
    },
    controlsMetaChipText: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    controlsActionChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 5,
        paddingHorizontal: 9,
      }),
    },
    controlsActionChipText: {
      color: theme.colors.text,
      fontSize: 11,
      fontWeight: '700',
    },
    searchRow: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 16,
        paddingVertical: 0,
        paddingHorizontal: 0,
      }),
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 12,
      overflow: 'hidden',
      borderColor: `${theme.colors.border}F0`,
      backgroundColor: 'rgba(20, 24, 38, 0.46)',
    },
    searchIconWrap: {
      width: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchFieldContainer: {
      flex: 1,
      gap: 4,
      marginLeft: 2,
    },
    searchInput: {
      backgroundColor: 'transparent',
      borderWidth: 0,
      paddingVertical: 12,
      paddingHorizontal: 0,
      minHeight: 0,
    },
    filtersRail: {
      gap: 6,
      paddingRight: 6,
    },
    filterChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 5,
        paddingHorizontal: 10,
      }),
    },
    filterChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    filterChipText: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
    },
    filterChipTextActive: {
      color: theme.colors.background,
    },
    controlsFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
    },
    resultsToolbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 2,
      marginTop: 2,
      flexWrap: 'wrap',
    },
    resultsToolbarText: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '700',
    },
    modeChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 5,
        paddingHorizontal: 9,
      }),
    },
    modeChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    modeChipText: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
    },
    modeChipTextActive: {
      color: theme.colors.background,
    },
    browseModeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
    },
    browseModeLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    browseModeChips: {
      flexDirection: 'row',
      gap: 6,
      flexWrap: 'wrap',
    },
    calendarCard: {
      gap: 10,
    },
    calendarTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8,
    },
    calendarCopy: {
      flex: 1,
      gap: 4,
    },
    calendarTitle: {
      fontWeight: '700',
    },
    calendarSubtitle: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    calendarToggleButton: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 6,
        paddingHorizontal: 10,
      }),
    },
    calendarToggleButtonText: {
      color: theme.colors.text,
      fontSize: 11,
      fontWeight: '700',
    },
    monthToolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingRight: 52,
    },
    quickJumpRow: {
      gap: 6,
      paddingRight: 4,
    },
    quickJumpChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 4,
        paddingHorizontal: 9,
      }),
      backgroundColor: 'rgba(20, 24, 38, 0.42)',
    },
    quickJumpChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.glow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.14,
      shadowRadius: 12,
      elevation: 3,
    },
    quickJumpChipText: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    quickJumpChipTextActive: {
      color: theme.colors.background,
    },
    monthPagerButton: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 7,
        paddingHorizontal: 7,
      }),
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(20, 24, 38, 0.42)',
    },
    monthPagerButtonDisabled: {
      opacity: 0.45,
    },
    monthLabelBlock: {
      flex: 1,
      gap: 4,
      alignItems: 'center',
    },
    monthLabel: {
      fontSize: 20,
      lineHeight: 24,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    monthMetaText: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
    },
    weekdayRow: {
      flexDirection: 'row',
      gap: 4,
    },
    weekdayLabel: {
      flex: 1,
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    calendarRows: {
      gap: 4,
    },
    calendarDaysWrap: {
      gap: 6,
      paddingTop: 4,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    calendarWeekRow: {
      flexDirection: 'row',
      gap: 4,
    },
    calendarCell: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 12,
        paddingVertical: 5,
        paddingHorizontal: 4,
      }),
      flex: 1,
      minHeight: 40,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    calendarCellPlaceholder: {
      opacity: 0,
    },
    calendarCellActive: {
      backgroundColor: theme.colors.surface,
    },
    calendarCellSelected: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
      backgroundColor: theme.colors.surface,
    },
    calendarCellDay: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '700',
    },
    calendarCellDaySelected: {
      color: theme.colors.primary,
    },
    calendarCellDayMuted: {
      color: theme.colors.textDim,
    },
    calendarCellCount: {
      color: theme.colors.textDim,
      fontSize: 9,
      fontWeight: '700',
    },
    calendarCellCountSelected: {
      color: theme.colors.primary,
      opacity: 0.9,
    },
    selectedDateRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    selectedDateChip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 6,
        paddingHorizontal: 10,
      }),
      backgroundColor: 'rgba(20, 24, 38, 0.42)',
    },
    selectedDateText: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '600',
    },
    clearDateChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 6,
        paddingHorizontal: 10,
      }),
      backgroundColor: 'rgba(20, 24, 38, 0.42)',
    },
    clearDateChipText: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '700',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingTop: theme.spacing.xs,
      paddingBottom: 4,
      paddingHorizontal: 2,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    sectionMeta: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '600',
    },
    listRowPressable: {
      borderRadius: theme.borderRadii.xl,
    },
    listRowPressed: {
      opacity: 0.96,
      transform: [{ scale: 0.994 }],
    },
    listRowCard: {
      paddingVertical: 11,
      paddingHorizontal: 12,
      gap: 7,
      backgroundColor: theme.colors.surface,
      borderColor: `${theme.colors.border}D9`,
    },
    listRowCardCompact: {
      paddingVertical: 9,
      paddingHorizontal: 12,
      gap: 6,
    },
    rowTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    rowCopy: {
      flex: 1,
      gap: 6,
    },
    rowTitle: {
      fontSize: 16,
      lineHeight: 21,
      fontWeight: '700',
    },
    rowTitleCompact: {
      fontSize: 15,
      lineHeight: 19,
    },
    rowMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    rowDateChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 3,
        paddingHorizontal: 8,
      }),
    },
    rowDateChipText: {
      color: theme.colors.textDim,
      fontSize: 10,
      fontWeight: '700',
    },
    rowDateChipTextCompact: {
      fontSize: 9,
    },
    rowPreviewWrap: {
      paddingLeft: 10,
      borderLeftWidth: 2,
      borderLeftColor: theme.colors.border,
    },
    rowPreviewWrapCompact: {
      paddingLeft: 9,
    },
    rowPreview: {
      flex: 1,
      color: theme.colors.textDim,
      fontSize: 13,
      lineHeight: 18,
    },
    rowPreviewCompact: {
      fontSize: 12,
      lineHeight: 16,
    },
    matchReasonsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 5,
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
    rowChevron: {
      marginRight: -2,
    },
    pillsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 5,
    },
    pill: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 3,
        paddingHorizontal: 7,
      }),
    },
    pillText: {
      color: theme.colors.textDim,
      fontSize: 9,
      fontWeight: '600',
    },
    emptyWrap: {
      paddingTop: theme.spacing.md,
    },
  });
}
