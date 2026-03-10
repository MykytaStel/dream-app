import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';

export function createStatsScreenStyles(theme: Theme) {
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
      color: theme.colors.background,
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
    overviewPanel: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 16,
        paddingVertical: 12,
        paddingHorizontal: 12,
      }),
      gap: 10,
    },
    overviewPanelHeader: {
      gap: 3,
    },
    overviewPanelTitle: {
      color: theme.colors.text,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700',
    },
    overviewPanelSubtitle: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    activityBarsRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 6,
      minHeight: 64,
    },
    activityBarColumn: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
    },
    activityBarTrack: {
      width: '100%',
      maxWidth: 18,
      height: 48,
      justifyContent: 'flex-end',
      borderRadius: 999,
      overflow: 'hidden',
      backgroundColor: theme.colors.surfaceAlt,
    },
    activityBarFill: {
      width: '100%',
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
      minHeight: 4,
    },
    activityBarLabel: {
      color: theme.colors.textDim,
      fontSize: 10,
      lineHeight: 12,
      textTransform: 'uppercase',
    },
    storyRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    storyCard: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 11,
        paddingHorizontal: 12,
      }),
      flexGrow: 1,
      flexBasis: '47%',
      minWidth: 148,
      gap: 4,
    },
    storyCardAccent: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.surfaceAlt,
    },
    storyLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 14,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    storyValue: {
      color: theme.colors.text,
      fontSize: 18,
      lineHeight: 22,
      fontWeight: '700',
      includeFontPadding: false,
    },
    storyHint: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    reportEntryCard: {
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 16,
        paddingVertical: 12,
        paddingHorizontal: 12,
      }),
      gap: 10,
      borderColor: theme.colors.accent,
    },
    reportEntryEyebrow: {
      color: theme.colors.accent,
      fontSize: 10,
      lineHeight: 13,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      fontWeight: '700',
    },
    reportEntryCopy: {
      gap: 3,
    },
    reportEntryTitle: {
      color: theme.colors.text,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700',
    },
    reportEntryDescription: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    reportEntryMeta: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: '600',
    },
    reportEntrySignalRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    reportEntrySignalChip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingHorizontal: 10,
        paddingVertical: 6,
      }),
    },
    reportEntrySignalChipText: {
      color: theme.colors.text,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    sectionCard: {
      gap: 12,
    },
    detailsSubsection: {
      gap: 6,
    },
    sectionHint: {
      color: theme.colors.textDim,
      lineHeight: 22,
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
      gap: 8,
    },
    detailsListRow: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 10,
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
    patternTabsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    patternTabChip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingHorizontal: 10,
        paddingVertical: 6,
      }),
    },
    patternTabChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    patternTabChipText: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '700',
    },
    patternTabChipTextActive: {
      color: theme.colors.background,
    },
    detailsToggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    detailsToggleCopy: {
      flex: 1,
      gap: 3,
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
      lineHeight: 17,
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
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: theme.borderRadii.lg,
      }),
      gap: 8,
      padding: theme.spacing.md,
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
      gap: 8,
    },
    teaserCard: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 11,
        paddingHorizontal: 12,
      }),
      flex: 1,
      gap: 4,
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
      ...createControlPill(theme, {
        tone: 'surface',
        paddingHorizontal: 12,
        paddingVertical: 7,
      }),
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
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: theme.borderRadii.lg,
      }),
      gap: 10,
      padding: theme.spacing.md,
    },
    achievementItemUnlocked: {
      borderColor: theme.colors.accent,
    },
    achievementItemHighlighted: {
      backgroundColor: theme.colors.surfaceAlt,
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
      ...createControlPill(theme, {
        tone: 'background',
        paddingHorizontal: 10,
        paddingVertical: 6,
      }),
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
      backgroundColor: theme.colors.surface,
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
