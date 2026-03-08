import { StyleSheet } from 'react-native';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';
import { Theme } from '../../../theme/theme';

export function createDreamDetailScreenStyles(theme: Theme) {
  return StyleSheet.create({
    heroCard: {
      gap: 16,
      overflow: 'hidden',
      position: 'relative',
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
      gap: 12,
    },
    heroStatusRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      gap: 8,
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
        paddingVertical: 6,
        paddingHorizontal: 10,
      }),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statusChipLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
    },
    heroHeader: {
      gap: 6,
    },
    heroEyebrow: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    heroTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    heroTitle: {
      flex: 1,
      fontSize: 32,
      lineHeight: 38,
      fontWeight: '700',
      includeFontPadding: false,
    },
    heroSubtitle: {
      color: theme.colors.textDim,
      fontSize: 15,
      lineHeight: 22,
    },
    heroStatsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    heroPreviewCard: {
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 16,
        paddingVertical: 12,
        paddingHorizontal: 12,
      }),
      gap: 6,
    },
    heroPreviewLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      fontWeight: '700',
    },
    heroPreviewText: {
      color: theme.colors.text,
      fontSize: 14,
      lineHeight: 20,
    },
    metaChip: {
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 16,
        paddingVertical: 10,
        paddingHorizontal: 12,
      }),
      flex: 1,
      minWidth: 102,
      gap: 4,
    },
    metaChipLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    metaChipValue: {
      fontWeight: '700',
      fontSize: 16,
      lineHeight: 20,
    },
    heroActionsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    deleteAction: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 8,
        paddingHorizontal: 12,
      }),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
      gap: 8,
      borderColor: `${theme.colors.danger}66`,
      backgroundColor: `${theme.colors.danger}14`,
    },
    deleteActionPressed: {
      opacity: 0.94,
      transform: [{ scale: 0.99 }],
    },
    deleteActionLabel: {
      color: theme.colors.danger,
      fontSize: 12,
      fontWeight: '700',
    },
    savedCard: {
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
      fontSize: 18,
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
      gap: 10,
    },
    savedStatTile: {
      flex: 1,
      gap: 4,
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 14,
        paddingVertical: 10,
        paddingHorizontal: 12,
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
      gap: 14,
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
      lineHeight: 24,
    },
    mutedText: {
      color: theme.colors.textDim,
      lineHeight: 20,
    },
    statusText: {
      lineHeight: 22,
      color: theme.colors.textDim,
    },
    statusErrorText: {
      lineHeight: 22,
      color: theme.colors.danger,
    },
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    contextRows: {
      gap: 12,
    },
    relatedList: {
      gap: 10,
    },
    relatedCarousel: {
      marginHorizontal: -4,
    },
    relatedCarouselContent: {
      paddingHorizontal: 4,
      gap: 10,
    },
    relatedCard: {
      gap: 10,
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 14,
        paddingVertical: 12,
        paddingHorizontal: 12,
      }),
      width: 248,
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
      fontSize: 12,
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
      gap: 8,
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 14,
        paddingVertical: 12,
        paddingHorizontal: 12,
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
      gap: 10,
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 14,
        paddingVertical: 12,
        paddingHorizontal: 12,
      }),
    },
    analysisStateCard: {
      gap: 8,
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 14,
        paddingVertical: 12,
        paddingHorizontal: 12,
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
      gap: 10,
    },
    transcriptEditorInput: {
      minHeight: 168,
    },
    transcriptActions: {
      gap: 10,
    },
  });
}
