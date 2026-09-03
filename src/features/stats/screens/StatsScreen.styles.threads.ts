import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';

export function createStatsThreadsStyles(theme: Theme) {
  return StyleSheet.create({
    recurringHeroBlock: {
      gap: 10,
    },
    recurringHeroHighlights: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    recurringGroupHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 10,
    },
    savedThreadRow: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 11,
        paddingHorizontal: 12,
      }),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    savedThreadCopy: {
      flex: 1,
      gap: 3,
    },
    savedThreadTitle: {
      color: theme.colors.text,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    savedThreadMeta: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    threadHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    threadHeaderCopy: {
      flex: 1,
      minWidth: 0,
    },
    threadLeadCard: {
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 16,
        paddingVertical: 10,
        paddingHorizontal: 11,
      }),
      gap: 8,
      borderColor: theme.colors.border,
    },
    threadLeadHeader: {
      gap: 8,
    },
    threadOpenAction: {
      alignSelf: 'flex-start',
      ...createControlPill(theme, {
        tone: 'surface',
        paddingHorizontal: 9,
        paddingVertical: 6,
      }),
    },
    threadOpenActionText: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '700',
    },
    threadLeadCopy: {
      gap: 4,
    },
    threadLeadLabel: {
      color: theme.colors.text,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    threadLeadDescription: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    threadMetaWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    threadMetaChip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingHorizontal: 10,
        paddingVertical: 6,
      }),
    },
    threadMetaChipText: {
      color: theme.colors.text,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    threadMatchList: {
      gap: 8,
    },
    threadMatchCard: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 11,
        paddingHorizontal: 12,
      }),
      gap: 8,
      borderColor: theme.colors.border,
    },
    recurringItemCardFeatured: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.surfaceAlt,
    },
    recurringItemList: {
      gap: 10,
    },
    recurringItemHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    recurringRankChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingHorizontal: 8,
        paddingVertical: 5,
      }),
    },
    recurringRankChipText: {
      color: theme.colors.text,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    recurringLatestBlock: {
      gap: 2,
    },
    recurringTimelineText: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 15,
    },
    recurringLatestTitle: {
      color: theme.colors.text,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: '700',
    },
    threadMatchHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    threadMatchCopy: {
      flex: 1,
      gap: 3,
    },
    threadMatchTitle: {
      color: theme.colors.text,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700',
    },
    threadMatchMeta: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    threadMatchPreview: {
      color: theme.colors.text,
      fontSize: 13,
      lineHeight: 18,
    },
    threadMatchSourcesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    detailsToggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    detailsToggleCopy: {
      flex: 1,
      gap: 2,
    },
    detailsToggleTitle: {
      color: theme.colors.text,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700',
    },
    detailsToggleDescription: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 16,
    },
    detailsTogglePill: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingHorizontal: 10,
        paddingVertical: 6,
      }),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    detailsTogglePillText: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '700',
    },
    detailsSectionContent: {
      gap: 10,
    },
  });
}
