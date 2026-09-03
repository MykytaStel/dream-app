import { StyleSheet } from 'react-native';
import { hexToRgba } from '../../../theme/color';
import { Theme } from '../../../theme/theme';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';

export function createArchiveListStyles(theme: Theme) {
  return StyleSheet.create({
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
      paddingVertical: 13,
      paddingHorizontal: 14,
      gap: 9,
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: `${theme.colors.border}D9`,
    },
    listRowCardVisual: {
      overflow: 'hidden',
      position: 'relative',
    },
    listRowGlow: {
      position: 'absolute',
      width: 112,
      height: 112,
      borderRadius: 999,
      top: -26,
      right: -20,
      opacity: 0.9,
    },
    listRowAccentBar: {
      position: 'absolute',
      left: 14,
      right: 22,
      top: 0,
      height: 3,
      borderRadius: 999,
      opacity: 0.95,
    },
    comfortableTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 10,
    },
    comfortableDateWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    rowTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    rowCopy: {
      flex: 1,
      gap: 7,
    },
    rowTitle: {
      fontSize: 18,
      lineHeight: 23,
      fontWeight: '700',
    },
    rowDateChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 4,
        paddingHorizontal: 8,
      }),
    },
    rowDateChipText: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
    },
    rowDateChipTextStrong: {
      color: theme.colors.text,
    },
    rowDateChipTextCompact: {
      fontSize: 9,
    },
    signalRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    signalChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: theme.borderRadii.pill,
      borderWidth: 1,
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    signalChipText: {
      fontSize: 10,
      fontWeight: '700',
    },
    rowPreview: {
      flex: 1,
      color: theme.colors.textDim,
      fontSize: 13,
      lineHeight: 19,
    },
    rowPreviewPanel: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 16,
        paddingVertical: 11,
        paddingHorizontal: 12,
      }),
      backgroundColor: hexToRgba(theme.colors.background, 0.38),
      borderColor: `${theme.colors.border}CC`,
      flexDirection: 'row',
      gap: 10,
    },
    rowPreviewAccent: {
      width: 4,
      borderRadius: 999,
    },
    rowPreviewContent: {
      flex: 1,
      gap: 7,
      minWidth: 0,
    },
    rowPreviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      flexWrap: 'wrap',
    },
    rowPreviewTypePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: theme.borderRadii.pill,
      borderWidth: 1,
      paddingVertical: 4,
      paddingHorizontal: 8,
      alignSelf: 'flex-start',
    },
    rowPreviewTypeText: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    matchReasonsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    matchReasonPill: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 3,
        paddingHorizontal: 7,
      }),
      borderColor: theme.colors.accent,
    },
    matchReasonPillText: {
      color: theme.colors.text,
      fontSize: 9,
      fontWeight: '700',
    },
    rowChevron: {
      marginRight: -2,
      paddingTop: 2,
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
      backgroundColor: hexToRgba(theme.colors.background, 0.34),
    },
    pillText: {
      color: theme.colors.textDim,
      fontSize: 10,
      fontWeight: '700',
    },
    compactStatusText: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 14,
    },
    emptyWrap: {
      paddingTop: theme.spacing.md,
    },
    tagRailRow: {
      gap: 5,
    },
    tagRailLabel: {
      color: theme.colors.textDim,
      fontSize: 9,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    tagRail: {
      gap: 5,
      paddingRight: 2,
    },
    tagChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 4,
        paddingHorizontal: 9,
      }),
      backgroundColor: hexToRgba(theme.colors.background, 0.42),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    tagChipActive: {
      borderColor: theme.colors.auroraMid,
      backgroundColor: theme.colors.auroraMid,
    },
    tagChipText: {
      color: theme.colors.textDim,
      fontSize: 10,
      fontWeight: '700',
    },
    tagChipTextActive: {
      color: theme.colors.onPrimary,
    },
    tagChipCount: {
      color: theme.colors.textDim,
      fontSize: 9,
      fontWeight: '700',
      opacity: 0.7,
    },
    tagChipCountActive: {
      color: theme.colors.onPrimary,
      opacity: 0.8,
    },
  });
}
