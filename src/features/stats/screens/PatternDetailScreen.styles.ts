import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';

export function createPatternDetailScreenStyles(theme: Theme) {
  return StyleSheet.create({
    listContent: {
      padding: theme.spacing.md,
      gap: theme.spacing.md,
    },
    listHeader: {
      gap: theme.spacing.md,
    },
    heroCard: {
      gap: 14,
      overflow: 'hidden',
      position: 'relative',
    },
    heroGlow: {
      position: 'absolute',
      width: 168,
      height: 168,
      borderRadius: 999,
      backgroundColor: theme.colors.auroraMid,
      opacity: 0.08,
      top: -64,
      right: -52,
    },
    heroEyebrow: {
      color: theme.colors.accent,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    heroTitle: {
      fontSize: 28,
      lineHeight: 32,
      fontWeight: '700',
      textTransform: 'capitalize',
      includeFontPadding: false,
    },
    heroSubtitle: {
      color: theme.colors.textDim,
      fontSize: 14,
      lineHeight: 20,
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    summaryCard: {
      flexBasis: '48%',
      flexGrow: 1,
      minWidth: 132,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 10,
      paddingHorizontal: 11,
      gap: 4,
    },
    summaryLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.45,
      textTransform: 'uppercase',
    },
    summaryValue: {
      color: theme.colors.text,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700',
    },
    saveThreadButton: {
      alignSelf: 'flex-start',
      borderRadius: theme.borderRadii.pill,
      borderWidth: 1,
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 7,
      paddingHorizontal: 12,
    },
    saveThreadButtonPressed: {
      opacity: 0.95,
    },
    saveThreadButtonText: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '700',
    },
    metaRow: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    metaPill: {
      borderRadius: theme.borderRadii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    metaPillAccent: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.surface,
    },
    metaText: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '700',
    },
    sectionTitle: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700',
    },
    matchList: {
      gap: 10,
    },
    rowPressable: {
      borderRadius: theme.borderRadii.xl,
    },
    rowPressablePressed: {
      opacity: 0.96,
      transform: [{ scale: 0.994 }],
    },
    rowCard: {
      gap: 10,
      padding: 14,
    },
    rowHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    dateBadge: {
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 50,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 7,
      paddingHorizontal: 8,
    },
    weekday: {
      color: theme.colors.textDim,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    dayNumber: {
      fontSize: 18,
      lineHeight: 21,
      fontWeight: '700',
    },
    month: {
      color: theme.colors.textDim,
      fontSize: 11,
    },
    rowCopy: {
      flex: 1,
      gap: 4,
    },
    rowTitle: {
      fontSize: 16,
      lineHeight: 21,
      fontWeight: '700',
    },
    rowMeta: {
      color: theme.colors.textDim,
      fontSize: 12,
    },
    timelineMarkerChip: {
      borderRadius: theme.borderRadii.pill,
      borderWidth: 1,
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 5,
      paddingHorizontal: 9,
    },
    timelineMarkerText: {
      color: theme.colors.text,
      fontSize: 11,
      fontWeight: '700',
    },
    previewWrap: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'stretch',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 9,
      paddingHorizontal: 10,
    },
    previewAccent: {
      width: 3,
      borderRadius: 999,
      backgroundColor: theme.colors.accent,
    },
    preview: {
      flex: 1,
      color: theme.colors.textDim,
      fontSize: 13,
      lineHeight: 18,
    },
    sourceLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sourcesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      alignItems: 'center',
    },
    emptyWrap: {
      paddingTop: theme.spacing.md,
    },
  });
}
