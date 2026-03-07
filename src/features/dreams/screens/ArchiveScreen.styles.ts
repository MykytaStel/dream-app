import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';

export function createArchiveScreenStyles(theme: Theme) {
  return StyleSheet.create({
    content: {
      paddingTop: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    headerBlock: {
      gap: theme.spacing.md,
    },
    heroCard: {
      gap: 12,
    },
    backButton: {
      alignSelf: 'flex-start',
      borderRadius: theme.borderRadii.pill,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
    },
    backLabel: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '700',
    },
    filtersRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    filterChip: {
      borderRadius: theme.borderRadii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 7,
      paddingHorizontal: 12,
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
      gap: 12,
    },
    calendarHeader: {
      gap: 12,
    },
    calendarCopy: {
      gap: 4,
    },
    calendarTitle: {
      fontWeight: '700',
    },
    calendarSubtitle: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 18,
    },
    monthPager: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    monthPagerButton: {
      borderRadius: theme.borderRadii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 7,
      paddingHorizontal: 10,
      minWidth: 72,
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
      gap: 2,
      alignItems: 'center',
    },
    monthLabel: {
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    monthMeta: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 15,
      textAlign: 'center',
    },
    weekdayRow: {
      flexDirection: 'row',
      gap: 8,
    },
    weekdayLabel: {
      flex: 1,
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    calendarCell: {
      width: '12.57%',
      minHeight: 56,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
    calendarCellPlaceholder: {
      opacity: 0,
    },
    calendarCellActive: {
      backgroundColor: theme.colors.surface,
    },
    calendarCellSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    calendarCellDay: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: '700',
    },
    calendarCellDaySelected: {
      color: theme.colors.background,
    },
    calendarCellDayMuted: {
      color: theme.colors.textDim,
    },
    calendarCellCount: {
      color: theme.colors.textDim,
      fontSize: 10,
      fontWeight: '700',
    },
    calendarCellCountSelected: {
      color: theme.colors.background,
      opacity: 0.8,
    },
    selectedDateRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      alignItems: 'center',
    },
    selectedDateChip: {
      borderRadius: theme.borderRadii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 7,
      paddingHorizontal: 10,
    },
    selectedDateText: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '600',
    },
    clearDateChip: {
      borderRadius: theme.borderRadii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      paddingVertical: 7,
      paddingHorizontal: 10,
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
      paddingTop: theme.spacing.sm,
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
      flexDirection: 'row',
      gap: 8,
      alignItems: 'stretch',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 9,
      paddingHorizontal: 10,
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
      minWidth: 48,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 6,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
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
      borderRadius: theme.borderRadii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingVertical: 4,
      paddingHorizontal: 8,
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
