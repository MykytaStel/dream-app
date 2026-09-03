import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';

export function createStatsHeroStyles(theme: Theme) {
  return StyleSheet.create({
    emptyContainer: {
      justifyContent: 'center',
    },
    heroCard: {
      gap: 10,
      padding: 14,
    },
    heroHeader: {
      gap: 4,
    },
    modeSection: {
      gap: 6,
    },
    heroTopGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    heroEyebrow: {
      color: theme.colors.accent,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 8,
    },
    summaryCard: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 10,
        paddingHorizontal: 10,
      }),
      flexGrow: 1,
      flexBasis: '31%',
      minWidth: 0,
      gap: 2,
      minHeight: 66,
    },
    summaryLabel: {
      color: theme.colors.textDim,
      fontSize: 10,
      lineHeight: 13,
    },
    summaryValue: {
      fontSize: 18,
      lineHeight: 22,
      fontWeight: '700',
      includeFontPadding: false,
    },
    summaryHint: {
      color: theme.colors.textDim,
      fontSize: 10,
      lineHeight: 13,
    },
    rangeHeader: {
      gap: 8,
    },
    rangeLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '600',
    },
    rangeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    rangeSection: {
      gap: 6,
      flexGrow: 1,
      flexBasis: '48%',
      minWidth: 136,
    },
    rangeSectionWide: {
      flexBasis: '100%',
    },
    rangeChip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingHorizontal: 10,
        paddingVertical: 6,
      }),
    },
    rangeChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    rangeChipText: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
    },
    rangeChipTextActive: {
      color: theme.colors.onPrimary,
    },
    compareHint: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    comparePanel: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 16,
        paddingVertical: 12,
        paddingHorizontal: 12,
      }),
      gap: 10,
    },
    comparePanelHeader: {
      gap: 3,
    },
    comparePanelTitle: {
      color: theme.colors.text,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700',
    },
    comparePanelSubtitle: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    compareMetricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    compareMetricTile: {
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 14,
        paddingVertical: 10,
        paddingHorizontal: 11,
      }),
      flexGrow: 1,
      flexBasis: '31%',
      minWidth: 102,
      gap: 4,
    },
    compareMetricLabel: {
      color: theme.colors.textDim,
      fontSize: 10,
      lineHeight: 13,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    compareMetricValue: {
      color: theme.colors.text,
      fontSize: 18,
      lineHeight: 22,
      fontWeight: '700',
      includeFontPadding: false,
    },
    compareMetricMeta: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 15,
    },
    compareMetricDeltaPositive: {
      color: theme.colors.accent,
    },
    compareMetricDeltaNegative: {
      color: theme.colors.primaryAlt,
    },
    compareMetricDeltaNeutral: {
      color: theme.colors.textDim,
    },
  });
}
