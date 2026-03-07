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
      gap: theme.spacing.sm,
    },
    titleBlock: {
      gap: 8,
      paddingHorizontal: 2,
    },
    controlsCard: {
      gap: 10,
    },
    filtersRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    filterChip: {
      ...createControlPill(theme, {
        tone: 'surface',
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
      gap: 8,
    },
    monthPagerButton: {
      ...createControlPill(theme, {
        tone: 'surface',
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
      gap: 5,
      alignItems: 'center',
    },
    monthLabel: {
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
        tone: 'surface',
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
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: theme.spacing.xs,
      paddingBottom: 6,
      paddingHorizontal: 2,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: 14,
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
      padding: 14,
      gap: 10,
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
    rowMeta: {
      color: theme.colors.textDim,
      fontSize: 12,
    },
    rowPreviewWrap: {
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 12,
        paddingVertical: 9,
        paddingHorizontal: 10,
      }),
      flexDirection: 'row',
      gap: 8,
      alignItems: 'stretch',
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
    dayChip: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 8,
        paddingHorizontal: 6,
      }),
      minWidth: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayNumber: {
      fontSize: 18,
      lineHeight: 20,
      fontWeight: '700',
    },
    dayWeek: {
      color: theme.colors.textDim,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
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
