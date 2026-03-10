import { StyleSheet } from 'react-native';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';
import { Theme } from '../../../theme/theme';

export function createDreamDetailScreenStyles(theme: Theme) {
  return StyleSheet.create({
    heroCard: {
      gap: 8,
      overflow: 'hidden',
      position: 'relative',
      padding: 14,
      backgroundColor: theme.colors.surface,
    },
    heroGlowLarge: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: 999,
      backgroundColor: theme.colors.auroraMid,
      opacity: 0.06,
      top: -82,
      right: -58,
    },
    heroGlowSmall: {
      position: 'absolute',
      width: 140,
      height: 140,
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
      opacity: 0.06,
      bottom: -52,
      left: -34,
    },
    heroTopBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    heroActionsWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      gap: 5,
    },
    heroActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    backButton: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 9,
        paddingHorizontal: 9,
      }),
      width: 40,
      height: 40,
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
        paddingHorizontal: 8,
      }),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statusChipLabel: {
      color: theme.colors.textDim,
      fontSize: 9,
      fontWeight: '700',
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
    },
    heroHeader: {
      gap: 5,
    },
    heroActionButton: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 6,
        paddingHorizontal: 6,
      }),
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroActionButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    heroActionButtonDanger: {
      borderColor: `${theme.colors.danger}55`,
    },
    heroActionButtonPressed: {
      opacity: 0.95,
      transform: [{ scale: 0.985 }],
    },
    heroTitle: {
      fontSize: 26,
      lineHeight: 31,
      fontWeight: '700',
      includeFontPadding: false,
    },
    heroSubtitle: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    heroPreviewText: {
      color: theme.colors.text,
      fontSize: 12,
      lineHeight: 18,
      maxWidth: '92%',
    },
    summaryCard: {
      padding: 12,
      gap: 8,
      backgroundColor: theme.colors.surfaceElevated,
    },
    glanceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    glanceCard: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 8,
        paddingHorizontal: 9,
      }),
      flex: 1,
      minWidth: 124,
      gap: 5,
    },
    glanceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    glanceIconShell: {
      width: 20,
      height: 20,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceAlt,
    },
    glanceLabel: {
      color: theme.colors.textDim,
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      fontWeight: '700',
    },
    glanceValue: {
      fontWeight: '700',
      fontSize: 13,
      lineHeight: 17,
    },
    savedCard: {
      padding: 14,
      gap: 10,
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
      fontSize: 15,
    },
    savedDescription: {
      color: theme.colors.textDim,
      lineHeight: 18,
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
      gap: 6,
    },
    savedStatTile: {
      flex: 1,
      gap: 4,
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 14,
        paddingVertical: 8,
        paddingHorizontal: 9,
      }),
    },
    savedStatLabel: {
      color: theme.colors.textDim,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    savedStatValue: {
      fontWeight: '700',
      fontSize: 15,
      lineHeight: 18,
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
      lineHeight: 20,
    },
    mutedText: {
      color: theme.colors.textDim,
      lineHeight: 17,
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
      gap: 6,
    },
    contextRows: {
      gap: 8,
    },
    relatedList: {
      gap: 10,
    },
    relatedCarousel: {
      marginHorizontal: -4,
    },
    relatedCarouselContent: {
      paddingHorizontal: 4,
      gap: 7,
    },
    relatedCard: {
      gap: 7,
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 14,
        paddingVertical: 9,
        paddingHorizontal: 9,
      }),
      width: 198,
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
      gap: 3,
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
      gap: 6,
    },
    audioCard: {
      gap: 5,
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 14,
        paddingVertical: 9,
        paddingHorizontal: 9,
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
        paddingVertical: 5,
        paddingHorizontal: 9,
      }),
    },
    progressBadgeLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '600',
    },
    transcriptMetaCard: {
      gap: 7,
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 14,
        paddingVertical: 9,
        paddingHorizontal: 9,
      }),
    },
    analysisStateCard: {
      gap: 5,
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 14,
        paddingVertical: 9,
        paddingHorizontal: 9,
      }),
    },
    analysisStateLabel: {
      color: theme.colors.textDim,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    analysisStateText: {
      lineHeight: 18,
      color: theme.colors.text,
    },
    analysisActionsRow: {
      gap: 6,
    },
    transcriptEditorInput: {
      minHeight: 150,
    },
    transcriptActions: {
      gap: 6,
    },
  });
}

export type DreamDetailScreenStyles = ReturnType<typeof createDreamDetailScreenStyles>;
