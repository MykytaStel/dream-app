import { StyleSheet } from 'react-native';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';
import { Theme } from '../../../theme/theme';

export function createDreamDetailScreenStyles(theme: Theme) {
  return StyleSheet.create({
    heroCard: {
      gap: 10,
      overflow: 'hidden',
      position: 'relative',
      padding: 16,
      backgroundColor: theme.colors.surface,
    },
    heroGlowLarge: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: 999,
      backgroundColor: theme.colors.auroraMid,
      opacity: 0.08,
      top: -72,
      right: -48,
    },
    heroGlowSmall: {
      position: 'absolute',
      width: 140,
      height: 140,
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
      opacity: 0.08,
      bottom: -42,
      left: -22,
    },
    heroTopBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 10,
    },
    heroStatusRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      gap: 6,
    },
    backButton: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 9,
        paddingHorizontal: 9,
      }),
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backLabel: {
      color: theme.colors.text,
      fontWeight: '700',
      fontSize: 16,
      lineHeight: 18,
    },
    statusChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 4,
        paddingHorizontal: 9,
      }),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    statusChipInteractive: {
      minHeight: 30,
    },
    statusChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    statusChipPressed: {
      opacity: 0.95,
      transform: [{ scale: 0.985 }],
    },
    statusChipLabel: {
      color: theme.colors.textDim,
      fontSize: 10,
      fontWeight: '700',
    },
    statusChipLabelActive: {
      color: theme.colors.background,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
    },
    heroHeader: {
      gap: 6,
    },
    heroTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    titleEditButton: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 7,
        paddingHorizontal: 7,
      }),
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleEditButtonPressed: {
      opacity: 0.95,
      transform: [{ scale: 0.985 }],
    },
    heroTitle: {
      flex: 1,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700',
      includeFontPadding: false,
    },
    heroSubtitle: {
      color: theme.colors.textDim,
      fontSize: 13,
      lineHeight: 18,
    },
    heroPreviewText: {
      color: theme.colors.text,
      fontSize: 13,
      lineHeight: 19,
      maxWidth: '88%',
    },
    summaryCard: {
      padding: 14,
      gap: 10,
      backgroundColor: theme.colors.surfaceElevated,
    },
    glanceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    glanceCard: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 9,
        paddingHorizontal: 10,
      }),
      flex: 1,
      minWidth: 132,
      gap: 6,
    },
    glanceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    glanceIconShell: {
      width: 22,
      height: 22,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceAlt,
    },
    glanceLabel: {
      color: theme.colors.textDim,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      fontWeight: '700',
    },
    glanceValue: {
      fontWeight: '700',
      fontSize: 14,
      lineHeight: 18,
    },
    heroActionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    savedCard: {
      padding: 16,
      gap: 12,
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.surface,
    },
    savedHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    savedCopy: {
      flex: 1,
      gap: 4,
    },
    savedTitle: {
      fontWeight: '700',
      fontSize: 16,
    },
    savedDescription: {
      color: theme.colors.textDim,
      lineHeight: 20,
    },
    savedDismiss: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 7,
        paddingHorizontal: 7,
      }),
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
    },
    savedStatsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    savedStatTile: {
      flex: 1,
      gap: 4,
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 14,
        paddingVertical: 9,
        paddingHorizontal: 10,
      }),
    },
    savedStatLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    savedStatValue: {
      fontWeight: '700',
      fontSize: 16,
      lineHeight: 20,
    },
    sectionCard: {
      gap: 12,
    },
    sectionTitle: {
      fontWeight: '700',
      fontSize: 16,
      lineHeight: 21,
    },
    subsectionLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    bodyText: {
      color: theme.colors.text,
      lineHeight: 22,
    },
    mutedText: {
      color: theme.colors.textDim,
      lineHeight: 18,
    },
    statusText: {
      lineHeight: 20,
      color: theme.colors.textDim,
    },
    statusErrorText: {
      lineHeight: 20,
      color: theme.colors.danger,
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    contextRows: {
      gap: 10,
    },
    relatedList: {
      gap: 10,
    },
    relatedCarousel: {
      marginHorizontal: -4,
    },
    relatedCarouselContent: {
      paddingHorizontal: 4,
      gap: 8,
    },
    relatedCard: {
      gap: 8,
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 14,
        paddingVertical: 10,
        paddingHorizontal: 10,
      }),
      width: 220,
    },
    relatedCardPressed: {
      opacity: 0.96,
      transform: [{ scale: 0.994 }],
    },
    relatedHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    relatedCopy: {
      flex: 1,
      gap: 4,
    },
    relatedTitle: {
      fontWeight: '700',
    },
    relatedMeta: {
      color: theme.colors.textDim,
      fontSize: 11,
    },
    relatedSharedLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sectionMutedActionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    audioCard: {
      gap: 6,
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 14,
        paddingVertical: 10,
        paddingHorizontal: 10,
      }),
    },
    audioPath: {
      color: theme.colors.textDim,
      fontSize: 13,
    },
    progressBadge: {
      alignSelf: 'flex-start',
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 6,
        paddingHorizontal: 10,
      }),
    },
    progressBadgeLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '600',
    },
    transcriptMetaCard: {
      gap: 8,
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 14,
        paddingVertical: 10,
        paddingHorizontal: 10,
      }),
    },
    analysisStateCard: {
      gap: 6,
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 14,
        paddingVertical: 10,
        paddingHorizontal: 10,
      }),
    },
    analysisStateLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    analysisStateText: {
      lineHeight: 20,
      color: theme.colors.text,
    },
    analysisActionsRow: {
      gap: 8,
    },
    transcriptEditorInput: {
      minHeight: 150,
    },
    transcriptActions: {
      gap: 8,
    },
  });
}
