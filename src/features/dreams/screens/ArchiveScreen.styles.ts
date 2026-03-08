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
    },
    controlsCard: {
      gap: 10,
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
    filtersRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    filterChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 6,
        paddingHorizontal: 10,
      }),
    },
    filterChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    filterChipText: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '700',
    },
    filterChipTextActive: {
      color: theme.colors.background,
    },
    utilityRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
    },
    utilityLeadingRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    utilityTrailingRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'flex-end',
    },
    modeChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 6,
        paddingHorizontal: 10,
      }),
    },
    modeChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    modeChipText: {
      color: theme.colors.textDim,
      fontSize: 12,
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
      gap: 8,
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
      gap: 10,
    },
    quickJumpRow: {
      gap: 6,
      paddingRight: 4,
    },
    quickJumpChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 5,
        paddingHorizontal: 10,
      }),
    },
    quickJumpChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
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
        paddingVertical: 6,
        paddingHorizontal: 10,
      }),
      minWidth: 70,
      alignItems: 'center',
    },
    monthPagerButtonDisabled: {
      opacity: 0.45,
    },
    monthPagerButtonText: {
      color: theme.colors.text,
      fontSize: 11,
      fontWeight: '700',
    },
    monthPagerButtonTextDisabled: {
      color: theme.colors.textDim,
    },
    monthLabelBlock: {
      flex: 1,
      gap: 6,
      alignItems: 'center',
    },
    monthLabel: {
      fontSize: 18,
      lineHeight: 22,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    monthMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 6,
    },
    monthMetaChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 4,
        paddingHorizontal: 8,
      }),
    },
    monthMetaChipText: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '600',
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
    },
    selectedDateChip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 6,
        paddingHorizontal: 10,
      }),
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
      paddingVertical: 12,
      paddingHorizontal: 12,
      gap: 8,
    },
    listRowCardCompact: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      gap: 8,
    },
    rowTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    rowCopy: {
      flex: 1,
      gap: 5,
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
    rowMeta: {
      color: theme.colors.textDim,
      fontSize: 12,
    },
    rowMetaCompact: {
      fontSize: 11,
    },
    rowPreviewWrap: {
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 12,
        paddingVertical: 8,
        paddingHorizontal: 10,
      }),
      flexDirection: 'row',
      gap: 0,
      alignItems: 'stretch',
    },
    rowPreviewWrapCompact: {
      paddingVertical: 7,
      paddingHorizontal: 9,
    },
    rowPreviewAccent: {
      width: 3,
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
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
    dayChip: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 12,
        paddingVertical: 7,
        paddingHorizontal: 6,
      }),
      minWidth: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayChipCompact: {
      minWidth: 40,
      paddingVertical: 6,
      paddingHorizontal: 5,
    },
    dayNumber: {
      fontSize: 18,
      lineHeight: 20,
      fontWeight: '700',
    },
    dayNumberCompact: {
      fontSize: 15,
      lineHeight: 17,
    },
    dayWeek: {
      color: theme.colors.textDim,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    dayWeekCompact: {
      fontSize: 9,
      letterSpacing: 0.4,
    },
    pillsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    pill: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 4,
        paddingHorizontal: 8,
      }),
    },
    pillText: {
      color: theme.colors.textDim,
      fontSize: 10,
      fontWeight: '600',
    },
    emptyWrap: {
      paddingTop: theme.spacing.md,
    },
  });
}
