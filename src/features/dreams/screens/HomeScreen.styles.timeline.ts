import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';

export function createHomeTimelineStyles(theme: Theme) {
  return StyleSheet.create({
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
      gap: 8,
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
      gap: 7,
      overflow: 'hidden',
    },
    spotlightHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    spotlightHeaderCopy: {
      flex: 1,
      gap: 3,
    },
    spotlightHeaderHint: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    spotlightLeadRow: {
      gap: 6,
    },
    spotlightSupportRow: {
      flexDirection: 'row',
      gap: 7,
      flexWrap: 'wrap',
    },
    spotlightTile: {
      ...createSoftTile(theme),
      gap: 3,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    spotlightTileLead: {
      minWidth: '100%',
      paddingVertical: 10,
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
    spotlightCueHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
    },
    spotlightCueBadge: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 5,
        paddingHorizontal: 8,
      }),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderColor: `${theme.colors.accent}55`,
      backgroundColor: `${theme.colors.accent}14`,
    },
    spotlightCueBadgeText: {
      color: theme.colors.accent,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: '700',
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
    weeklyPatternsSection: {
      gap: 8,
    },
    weeklyPatternsHeader: {
      gap: 3,
    },
    weeklyPatternsSubtitle: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    weeklyPatternsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },
    weeklyPatternCard: {
      ...createSoftTile(theme),
      flexGrow: 1,
      flexBasis: '47%',
      minWidth: 146,
      gap: 4,
      paddingVertical: 10,
      paddingHorizontal: 11,
    },
    weeklyPatternCardAccent: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.surfaceAlt,
    },
    weeklyPatternLabel: {
      color: theme.colors.textDim,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    weeklyPatternTitle: {
      color: theme.colors.text,
      fontSize: 16,
      lineHeight: 20,
      fontWeight: '700',
    },
    weeklyPatternHint: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 15,
    },
    spotlightActionHint: {
      color: theme.colors.accent,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: '700',
      marginTop: 2,
    },
    spotlightCueActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: 3,
    },
  });
}
