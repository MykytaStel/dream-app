import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';

export function createDreamDetailScreenStyles(theme: Theme) {
  return StyleSheet.create({
    heroCard: {
      gap: 18,
    },
    backButton: {
      alignSelf: 'flex-start',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    backLabel: {
      color: theme.colors.textDim,
      fontWeight: '600',
    },
    heroHeader: {
      gap: 8,
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
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '700',
      includeFontPadding: false,
    },
    moodDot: {
      width: 12,
      height: 12,
      borderRadius: 999,
    },
    heroSubtitle: {
      color: theme.colors.textDim,
      lineHeight: 22,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    metaChip: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 10,
      paddingHorizontal: 12,
      minWidth: 104,
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
      borderRadius: theme.borderRadii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    savedDismissLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '700',
    },
    savedStatsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    savedStatTile: {
      flex: 1,
      gap: 4,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 10,
      paddingHorizontal: 12,
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
    },
    bodyText: {
      color: theme.colors.text,
      lineHeight: 24,
    },
    mutedText: {
      color: theme.colors.textDim,
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
      gap: 10,
    },
    relatedList: {
      gap: 10,
    },
    relatedCard: {
      gap: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      padding: 12,
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
    audioCard: {
      gap: 8,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      padding: 12,
    },
    audioPath: {
      color: theme.colors.textDim,
      fontSize: 13,
    },
    progressBadge: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    progressBadgeLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '600',
    },
    transcriptMetaCard: {
      gap: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      padding: 12,
    },
    transcriptEditorInput: {
      minHeight: 168,
    },
    transcriptActions: {
      gap: 10,
    },
  });
}
