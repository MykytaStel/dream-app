import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';

export function createStatsScreenStyles(theme: Theme) {
  return StyleSheet.create({
    emptyContainer: {
      justifyContent: 'center',
    },
    heroCard: {
      gap: 14,
      padding: 16,
    },
    heroHeader: {
      gap: 6,
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
      flex: 1,
      padding: 12,
      gap: 2,
      backgroundColor: theme.colors.surfaceAlt,
    },
    summaryLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 14,
    },
    summaryValue: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700',
      includeFontPadding: false,
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
    rangeChip: {
      borderRadius: theme.borderRadii.pill,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
    },
    rangeChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    rangeChipText: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '700',
    },
    rangeChipTextActive: {
      color: theme.colors.background,
    },
    sectionCard: {
      gap: 14,
    },
    sectionHint: {
      color: theme.colors.textDim,
      lineHeight: 22,
    },
    metricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    metricTile: {
      flexGrow: 1,
      flexBasis: '47%',
      minWidth: 144,
      padding: 12,
      borderRadius: theme.borderRadii.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
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
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    insightCard: {
      flexGrow: 1,
      flexBasis: '47%',
      minWidth: 144,
      padding: 12,
      borderRadius: theme.borderRadii.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      gap: 5,
    },
    insightCardInteractive: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.surface,
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
    coverageList: {
      gap: 12,
    },
    coverageItem: {
      gap: 7,
    },
    coverageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    coverageLabel: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: '600',
      flex: 1,
    },
    coverageValue: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '700',
    },
    coverageTrack: {
      height: 10,
      borderRadius: 999,
      overflow: 'hidden',
      backgroundColor: theme.colors.surfaceAlt,
    },
    coverageFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
    },
    attentionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    attentionCard: {
      flexGrow: 1,
      flexBasis: '31%',
      minWidth: 92,
      padding: 12,
      borderRadius: theme.borderRadii.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      gap: 4,
    },
    attentionValue: {
      fontSize: 24,
      lineHeight: 28,
      fontWeight: '700',
      includeFontPadding: false,
    },
    attentionLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    patternGroupList: {
      gap: 12,
    },
    patternGroup: {
      gap: 8,
    },
    patternGroupLabel: {
      fontWeight: '700',
    },
    subsection: {
      gap: 10,
    },
    subsectionTitle: {
      fontWeight: '700',
    },
    signalBlock: {
      gap: 8,
    },
    signalLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '600',
    },
    moodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    moodLabel: {
      width: 72,
      color: theme.colors.textDim,
      fontSize: 12,
    },
    moodTrack: {
      flex: 1,
      height: 10,
      borderRadius: 999,
      overflow: 'hidden',
      backgroundColor: theme.colors.surfaceAlt,
    },
    moodFill: {
      height: '100%',
      borderRadius: 999,
    },
    moodValue: {
      width: 20,
      textAlign: 'right',
      fontWeight: '700',
    },
    tagsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    reflectionList: {
      gap: 10,
    },
    reflectionItem: {
      gap: 8,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadii.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
    },
    reflectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    reflectionLabel: {
      flex: 1,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    reflectionMeta: {
      color: theme.colors.textDim,
      fontSize: 12,
    },
    teaserRow: {
      flexDirection: 'row',
      gap: 10,
    },
    teaserCard: {
      flex: 1,
      gap: 4,
      padding: 12,
      borderRadius: theme.borderRadii.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
    },
    teaserCardAccent: {
      borderColor: theme.colors.accent,
    },
    teaserLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    teaserValue: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '700',
      includeFontPadding: false,
    },
    teaserHint: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    toggleButton: {
      alignSelf: 'flex-start',
      borderRadius: theme.borderRadii.pill,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
    },
    toggleButtonText: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '700',
    },
    achievementsList: {
      gap: 12,
    },
    achievementItem: {
      gap: 10,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadii.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
    },
    achievementItemUnlocked: {
      borderColor: theme.colors.accent,
    },
    achievementItemHighlighted: {
      backgroundColor: theme.colors.surfaceElevated,
    },
    achievementHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    achievementCopy: {
      flex: 1,
      gap: 4,
    },
    achievementTitle: {
      fontWeight: '700',
    },
    achievementDescription: {
      color: theme.colors.textDim,
      lineHeight: 20,
    },
    achievementBadge: {
      borderRadius: theme.borderRadii.pill,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    achievementBadgeUnlocked: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.accent,
    },
    achievementBadgeText: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '700',
    },
    achievementBadgeTextUnlocked: {
      color: theme.colors.background,
    },
    achievementProgressTrack: {
      height: 8,
      borderRadius: 999,
      overflow: 'hidden',
      backgroundColor: theme.colors.background,
    },
    achievementProgressFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
    },
    achievementProgressFillUnlocked: {
      backgroundColor: theme.colors.accent,
    },
    mutedText: {
      color: theme.colors.textDim,
    },
  });
}
