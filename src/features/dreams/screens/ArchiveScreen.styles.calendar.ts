import { StyleSheet } from 'react-native';
import { hexToRgba } from '../../../theme/color';
import { Theme } from '../../../theme/theme';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';

export function createArchiveCalendarStyles(theme: Theme) {
  return StyleSheet.create({
    revisitCard: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 16,
        paddingVertical: 10,
        paddingHorizontal: 12,
      }),
      gap: 4,
      borderColor: `${theme.colors.accent}66`,
    },
    revisitHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
    },
    revisitBadge: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 5,
        paddingHorizontal: 8,
      }),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderColor: `${theme.colors.accent}55`,
      backgroundColor: hexToRgba(theme.colors.primary, 0.08),
    },
    revisitBadgeText: {
      color: theme.colors.accent,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: '700',
    },
    revisitLabel: {
      color: theme.colors.textDim,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    revisitAction: {
      color: theme.colors.accent,
      fontSize: 11,
      fontWeight: '700',
    },
    revisitActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: 4,
    },
    revisitTitle: {
      color: theme.colors.text,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700',
    },
    revisitReason: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
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
      paddingRight: 0,
    },
    monthPagerSlot: {
      width: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickJumpRow: {
      gap: 5,
      paddingRight: 4,
    },
    quickJumpChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 4,
        paddingHorizontal: 8,
      }),
      backgroundColor: hexToRgba(theme.colors.background, 0.42),
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
      color: theme.colors.onPrimary,
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
      backgroundColor: hexToRgba(theme.colors.background, 0.42),
    },
    monthPagerButtonDisabled: {
      opacity: 0.45,
    },
    monthLabelBlock: {
      flex: 1,
      gap: 3,
      alignItems: 'center',
    },
    monthLabel: {
      fontSize: 17,
      lineHeight: 21,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    monthMetaText: {
      color: theme.colors.textDim,
      fontSize: 10,
      fontWeight: '600',
      textAlign: 'center',
    },
    monthInlineToggleButton: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 4,
        paddingHorizontal: 10,
      }),
      backgroundColor: hexToRgba(theme.colors.background, 0.42),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    monthInlineToggleButtonText: {
      color: theme.colors.text,
      fontSize: 10,
      fontWeight: '700',
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
      gap: 5,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: `${theme.colors.border}99`,
    },
    calendarWeekRow: {
      flexDirection: 'row',
      gap: 4,
    },
    calendarCell: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 12,
        paddingVertical: 6,
        paddingHorizontal: 4,
      }),
      flex: 1,
      minHeight: 46,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    calendarCellPlaceholder: {
      opacity: 0,
    },
    calendarCellActive: {
      backgroundColor: theme.colors.surface,
    },
    calendarCellToday: {
      borderColor: `${theme.colors.primary}66`,
      borderWidth: 1.5,
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
      // Muted by weight, not by fading the colour. At 53% alpha these dates
      // measured 2.92 on kaleidoscope and 2.32 on the light theme, against the
      // 4.5 that 12px text needs — every theme failed, the light one worst.
      // The lighter weight keeps the hierarchy without making a date
      // unreadable on the day someone is looking for it.
      color: theme.colors.textDim,
      fontWeight: '500',
    },
    calendarMoodDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      opacity: 0.85,
    },
    calendarMoodDotNeutral: {
      backgroundColor: theme.colors.textDim,
      opacity: 0.5,
    },
    selectedDateRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    selectedDateChip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 6,
        paddingHorizontal: 10,
      }),
      backgroundColor: hexToRgba(theme.colors.background, 0.42),
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
      backgroundColor: hexToRgba(theme.colors.background, 0.42),
    },
    clearDateChipText: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '700',
    },
  });
}
