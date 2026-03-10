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
    heroTopBarSpacer: {
      minWidth: 40,
      minHeight: 24,
    },
    heroQuickActions: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
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
    heroActionPill: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 7,
        paddingHorizontal: 10,
      }),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    heroActionPillActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    heroActionPillPressed: {
      opacity: 0.95,
      transform: [{ scale: 0.985 }],
    },
    heroActionLabel: {
      color: theme.colors.text,
      fontSize: 11,
      fontWeight: '700',
      lineHeight: 15,
    },
    heroActionLabelActive: {
      color: theme.colors.background,
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
    heroFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingTop: 2,
    },
    heroDeleteAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    heroDeleteActionPressed: {
      opacity: 0.72,
    },
    heroDeleteActionLabel: {
      color: theme.colors.danger,
      fontSize: 11,
      fontWeight: '700',
      lineHeight: 15,
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
      padding: 12,
      gap: 8,
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.surface,
    },
    savedHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    savedLead: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    savedIconShell: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 6,
        paddingHorizontal: 6,
      }),
      width: 28,
      height: 28,
      borderColor: `${theme.colors.accent}44`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    savedCopy: {
      flex: 1,
      gap: 2,
    },
    savedTitle: {
      fontWeight: '700',
      fontSize: 13,
    },
    savedDescription: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    savedDismiss: {
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
    savedMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    savedMetaPill: {
      flex: 1,
      minWidth: 136,
      gap: 3,
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 12,
        paddingVertical: 7,
        paddingHorizontal: 8,
      }),
    },
    savedMetaLabel: {
      color: theme.colors.textDim,
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    savedMetaValue: {
      fontWeight: '700',
      fontSize: 13,
      lineHeight: 16,
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
