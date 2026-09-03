import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';

export function createStatsInsightsStyles(theme: Theme) {
  return StyleSheet.create({
    metricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    metricTile: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 11,
        paddingHorizontal: 12,
      }),
      flexGrow: 1,
      flexBasis: '47%',
      minWidth: 144,
      gap: 4,
    },
    metricLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 14,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    metricValue: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '700',
      includeFontPadding: false,
    },
    insightGrid: {
      gap: 8,
    },
    insightCard: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 11,
        paddingHorizontal: 12,
      }),
      flexGrow: 1,
      flexBasis: '47%',
      minWidth: 144,
      gap: 5,
    },
    insightCardInteractive: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.surfaceAlt,
    },
    insightCardPressed: {
      opacity: 0.96,
      transform: [{ scale: 0.992 }],
    },
    insightLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 14,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    insightValue: {
      fontSize: 18,
      lineHeight: 22,
      fontWeight: '700',
      includeFontPadding: false,
    },
    insightHint: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    weeklyPatternGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    weeklyPatternCard: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 11,
        paddingHorizontal: 12,
      }),
      flexGrow: 1,
      flexBasis: '47%',
      minWidth: 146,
      gap: 4,
    },
    weeklyPatternCardAccent: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.surfaceAlt,
    },
    weeklyPatternLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 14,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontWeight: '700',
    },
    weeklyPatternTitle: {
      color: theme.colors.text,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '700',
      includeFontPadding: false,
    },
    weeklyPatternHint: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 16,
    },
    takeawayLeadCard: {
      minHeight: 118,
      justifyContent: 'space-between',
    },
    takeawaySecondaryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    takeawaySecondaryCard: {
      flexGrow: 1,
      flexBasis: '47%',
      minWidth: 142,
      minHeight: 96,
      justifyContent: 'space-between',
    },
    detailsList: {
      gap: 6,
    },
    detailsListRow: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 9,
        paddingHorizontal: 13,
      }),
      gap: 5,
    },
    detailsListHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    detailsListCopy: {
      flex: 1,
      gap: 2,
    },
    detailsListLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 14,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    detailsListHint: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 16,
    },
    detailsListValueChip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingHorizontal: 10,
        paddingVertical: 6,
      }),
    },
    detailsListValue: {
      color: theme.colors.text,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '700',
    },
    patternGroupList: {
      gap: 12,
    },
    savedThreadsBlock: {
      gap: 8,
    },
    savedThreadsHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    savedThreadsLabel: {
      color: theme.colors.text,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700',
    },
    savedThreadsCountChip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 4,
        paddingHorizontal: 8,
      }),
    },
    savedThreadsCountText: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '700',
    },
    savedThreadsList: {
      gap: 8,
    },
  });
}
