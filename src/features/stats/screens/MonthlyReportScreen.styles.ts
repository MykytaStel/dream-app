import { StyleSheet } from 'react-native';
import { fontFamilies } from '../../../theme/fonts';
import { Theme } from '../../../theme/theme';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';

export function createMonthlyReportScreenStyles(theme: Theme) {
  return StyleSheet.create({
    heroCard: {
      gap: 12,
      padding: 16,
      overflow: 'hidden',
      position: 'relative',
    },
    heroGlowTop: {
      position: 'absolute',
      width: 180,
      height: 180,
      borderRadius: 999,
      backgroundColor: theme.colors.auroraMid,
      opacity: 0.08,
      top: -54,
      right: -30,
    },
    heroGlowBottom: {
      position: 'absolute',
      width: 144,
      height: 144,
      borderRadius: 999,
      backgroundColor: theme.colors.accent,
      opacity: 0.08,
      bottom: -30,
      left: -24,
    },
    heroFacetCluster: {
      position: 'absolute',
      width: 96,
      height: 96,
      alignItems: 'center',
      justifyContent: 'center',
      top: 18,
      right: 22,
    },
    heroFacet: {
      position: 'absolute',
      width: 34,
      height: 34,
      borderRadius: 12,
      transform: [{ rotate: '45deg' }],
    },
    heroFacetPrimary: {
      top: 12,
      backgroundColor: theme.colors.primary,
    },
    heroFacetAccent: {
      left: 16,
      bottom: 16,
      backgroundColor: theme.colors.accent,
    },
    heroFacetAlt: {
      right: 16,
      bottom: 16,
      backgroundColor: theme.colors.auroraMid,
    },
    backButton: {
      alignSelf: 'flex-start',
      ...createControlPill(theme, {
        tone: 'surface',
        paddingHorizontal: 10,
        paddingVertical: 6,
      }),
    },
    backLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '700',
    },
    eyebrow: {
      color: theme.colors.accent,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    heroMonthTitle: {
      fontFamily: fontFamilies.display,
      fontSize: 32,
      lineHeight: 38,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    heroMeta: {
      color: theme.colors.textDim,
      fontSize: 14,
      lineHeight: 20,
    },
    heroMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    heroMetaChip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingHorizontal: 10,
        paddingVertical: 6,
      }),
    },
    heroMetaChipText: {
      color: theme.colors.text,
      fontSize: 11,
      fontWeight: '700',
    },
    monthStripBlock: {
      gap: 8,
    },
    monthStripLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontWeight: '700',
    },
    monthStripRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    monthChip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingHorizontal: 10,
        paddingVertical: 6,
      }),
    },
    monthChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    monthChipText: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '700',
    },
    monthChipTextActive: {
      color: theme.colors.background,
    },
    coverCard: {
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 16,
        paddingVertical: 14,
        paddingHorizontal: 14,
      }),
      gap: 8,
      borderColor: theme.colors.accent,
    },
    coverLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontWeight: '700',
    },
    coverText: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '700',
      includeFontPadding: false,
    },
    coverHint: {
      color: theme.colors.textDim,
      fontSize: 13,
      lineHeight: 18,
    },
    coverSignalsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    coverSignalChip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingHorizontal: 10,
        paddingVertical: 6,
      }),
    },
    coverSignalChipText: {
      color: theme.colors.text,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    coverActionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 2,
    },
    coverActionButton: {
      flexGrow: 1,
      minWidth: 140,
    },
    sectionCard: {
      gap: 12,
    },
    revisitCard: {
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 16,
        paddingVertical: 14,
        paddingHorizontal: 14,
      }),
      gap: 10,
      borderColor: theme.colors.accent,
    },
    revisitBadge: {
      alignSelf: 'flex-start',
      ...createControlPill(theme, {
        tone: 'surface',
        paddingHorizontal: 10,
        paddingVertical: 6,
      }),
    },
    revisitBadgeText: {
      color: theme.colors.text,
      fontSize: 11,
      fontWeight: '700',
    },
    revisitDreamTitle: {
      fontFamily: fontFamilies.display,
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '700',
      includeFontPadding: false,
    },
    revisitReason: {
      color: theme.colors.textDim,
      fontSize: 14,
      lineHeight: 20,
    },
    revisitAction: {
      alignSelf: 'flex-start',
      minWidth: 160,
    },
    metricLeadTile: {
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 16,
        paddingVertical: 14,
        paddingHorizontal: 14,
      }),
      gap: 6,
      borderColor: theme.colors.accent,
    },
    metricLeadLabel: {
      color: theme.colors.textDim,
      fontSize: 10,
      lineHeight: 13,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    metricLeadValue: {
      fontSize: 34,
      lineHeight: 38,
      fontWeight: '700',
      includeFontPadding: false,
    },
    metricLeadHint: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    metricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    metricTile: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 12,
        paddingHorizontal: 12,
      }),
      flexGrow: 1,
      flexBasis: '31%',
      minWidth: 100,
      gap: 4,
    },
    metricLabel: {
      color: theme.colors.textDim,
      fontSize: 10,
      lineHeight: 13,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    metricValue: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700',
      includeFontPadding: false,
    },
    metricHint: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 15,
    },
    signalGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    signalLeadCard: {
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 16,
        paddingVertical: 14,
        paddingHorizontal: 14,
      }),
      gap: 6,
      borderColor: theme.colors.accent,
    },
    signalCardPressable: {
      overflow: 'hidden',
    },
    signalCardPressed: {
      opacity: 0.95,
    },
    signalLeadValue: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '700',
      includeFontPadding: false,
      textTransform: 'capitalize',
    },
    signalCard: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 12,
        paddingHorizontal: 12,
      }),
      flexGrow: 1,
      flexBasis: '47%',
      minWidth: 142,
      gap: 4,
      minHeight: 104,
      justifyContent: 'space-between',
    },
    signalLabel: {
      color: theme.colors.textDim,
      fontSize: 10,
      lineHeight: 13,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    signalValue: {
      fontSize: 18,
      lineHeight: 22,
      fontWeight: '700',
      includeFontPadding: false,
      textTransform: 'capitalize',
    },
    signalMeta: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 15,
    },
    signalAction: {
      color: theme.colors.accent,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.45,
    },
    savedThreadsList: {
      gap: 8,
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
    calmGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    calmTile: {
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 14,
        paddingVertical: 12,
        paddingHorizontal: 12,
      }),
      flexGrow: 1,
      flexBasis: '31%',
      minWidth: 100,
      gap: 4,
    },
    calmValue: {
      fontSize: 20,
      lineHeight: 25,
      fontWeight: '700',
      includeFontPadding: false,
    },
    calmLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 15,
    },
    emptyContainer: {
      justifyContent: 'center',
    },
  });
}

export type MonthlyReportScreenStyles = ReturnType<typeof createMonthlyReportScreenStyles>;
