import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';
import { createControlPill } from '../../../theme/surfaces';

export function createHomeDreamRowStyles(theme: Theme) {
  return StyleSheet.create({
    dreamHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
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
    dateBadgeFeatured: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.surface,
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
    dreamHeaderCopy: {
      gap: 4,
    },
    dreamHeaderCopyExpanded: {
      flex: 1,
      minWidth: 0,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    title: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '700',
      flex: 1,
      includeFontPadding: false,
    },
    moodDot: {
      width: 10,
      height: 10,
      borderRadius: 999,
    },
    lucidityGlyph: {
      color: theme.colors.accent,
      fontSize: 10,
      lineHeight: 14,
      includeFontPadding: false,
    },
    headerMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
      minHeight: 24,
    },
    headerMetaHint: {
      color: `${theme.colors.textDim}CC`,
      fontSize: 11,
      lineHeight: 15,
    },
    timestampRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
    },
    timestamp: {
      color: theme.colors.textDim,
      fontSize: 11,
    },
    moodPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: theme.borderRadii.pill,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
    },
    moodPillText: {
      color: theme.colors.text,
      fontSize: 11,
      fontWeight: '600',
    },
    signalRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    signalChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: theme.borderRadii.pill,
      borderWidth: 1,
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    signalChipText: {
      fontSize: 10,
      fontWeight: '700',
    },
    previewPanel: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 10,
      borderRadius: 18,
      borderWidth: 1,
      paddingVertical: 10,
      paddingHorizontal: 10,
    },
    previewAccent: {
      width: 4,
      borderRadius: 999,
    },
    previewContent: {
      flex: 1,
      gap: 7,
      minWidth: 0,
    },
    previewHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      flexWrap: 'wrap',
    },
    previewLabelPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: theme.borderRadii.pill,
      borderWidth: 1,
      paddingVertical: 4,
      paddingHorizontal: 8,
      alignSelf: 'flex-start',
    },
    previewLabelText: {
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    previewAudioIcon: {
      alignSelf: 'flex-start',
      marginTop: 2,
    },
    previewAccentPrimary: {
      backgroundColor: theme.colors.primary,
    },
    preview: {
      color: theme.colors.textDim,
      flex: 1,
      lineHeight: 18,
      fontSize: 13,
    },
    previewTranscript: {
      fontStyle: 'italic',
    },
    dreamFooterRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      flexWrap: 'wrap',
    },
    statePills: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      flex: 1,
    },
    matchReasonsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    matchReasonPill: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 4,
        paddingHorizontal: 8,
      }),
      borderColor: theme.colors.accent,
    },
    matchReasonPillText: {
      color: theme.colors.text,
      fontSize: 10,
      fontWeight: '700',
    },
    statePill: {
      borderRadius: theme.borderRadii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    statePillText: {
      color: theme.colors.textDim,
      fontSize: 10,
      fontWeight: '700',
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      justifyContent: 'flex-end',
    },
    tagPill: {
      borderRadius: theme.borderRadii.pill,
      paddingVertical: 4,
      paddingHorizontal: 8,
      backgroundColor: `${theme.colors.primary}10`,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    tagOverflowPill: {
      backgroundColor: theme.colors.surfaceAlt,
    },
    tagPillText: {
      color: theme.colors.textDim,
      fontSize: 10,
      fontWeight: '600',
    },
  });
}
