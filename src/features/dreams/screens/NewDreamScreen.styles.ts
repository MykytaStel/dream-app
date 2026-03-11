import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';
import { getDreamLayout } from '../constants/layout';

export function createNewDreamScreenStyles(theme: Theme, selected: boolean) {
  const layout = getDreamLayout(theme);

  return StyleSheet.create({
    heroCard: {
      gap: layout.heroGap,
      overflow: 'hidden',
      position: 'relative',
    },
    heroCardCompact: {
      gap: 8,
    },
    heroGlowLarge: {
      position: 'absolute',
      width: 180,
      height: 180,
      borderRadius: 999,
      backgroundColor: theme.colors.auroraMid,
      opacity: 0.08,
      top: -54,
      right: -42,
    },
    heroGlowSmall: {
      position: 'absolute',
      width: 136,
      height: 136,
      borderRadius: 999,
      backgroundColor: theme.colors.accent,
      opacity: 0.08,
      bottom: -36,
      left: -28,
    },
    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    heroCopy: {
      flex: 1,
      gap: layout.rowGap,
    },
    heroCopyCompact: {
      gap: 4,
    },
    heroEyebrow: {
      color: theme.colors.accent,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    kaleidoscopeShell: {
      width: 88,
      height: 88,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 26,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    kaleidoscopeFacet: {
      position: 'absolute',
      width: 26,
      height: 26,
      borderRadius: 9,
      transform: [{ rotate: '45deg' }],
    },
    kaleidoscopeFacetPrimary: {
      backgroundColor: theme.colors.primary,
      top: 18,
    },
    kaleidoscopeFacetAccent: {
      backgroundColor: theme.colors.accent,
      left: 21,
      bottom: 22,
    },
    kaleidoscopeFacetAlt: {
      backgroundColor: theme.colors.auroraMid,
      right: 21,
      bottom: 22,
    },
    helperChipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    helperChip: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingVertical: 7,
      paddingHorizontal: 12,
    },
    helperChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    helperChipLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
    },
    helperChipLabelActive: {
      color: theme.colors.background,
      fontSize: 11,
      fontWeight: '700',
    },
    card: {
      gap: layout.sectionGap + 2,
    },
    refineActionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    refineActionChip: {
      borderRadius: theme.borderRadii.pill,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
    },
    refineActionChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    refineActionLabel: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '700',
    },
    refineActionLabelActive: {
      color: theme.colors.background,
    },
    refineHint: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    sectionAccentRow: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: -2,
    },
    sectionAccentPrimary: {
      width: 28,
      height: 4,
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
    },
    sectionAccentSecondary: {
      width: 12,
      height: 4,
      borderRadius: 999,
      backgroundColor: theme.colors.accent,
    },
    sectionAccentAlt: {
      backgroundColor: theme.colors.auroraMid,
    },
    sectionAccentMuted: {
      backgroundColor: theme.colors.textDim,
      opacity: 0.45,
    },
    textInput: {
      minHeight: 180,
    },
    moodRow: {
      flexDirection: 'row',
      gap: 8,
    },
    moodOption: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: selected ? theme.colors.primary : theme.colors.border,
      backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceAlt,
    },
    moodLabel: {
      textAlign: 'center',
      fontWeight: '700',
      color: selected ? theme.colors.background : theme.colors.text,
    },
    contextBlock: {
      gap: 8,
    },
    contextFieldLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '600',
    },
    contextHint: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    contextOptionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    contextOption: {
      flexGrow: 1,
      flexBasis: 72,
      minWidth: 72,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: selected ? theme.colors.primary : theme.colors.border,
      backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceAlt,
    },
    contextOptionLabel: {
      textAlign: 'center',
      fontWeight: '700',
      fontSize: 11,
      lineHeight: 14,
      color: selected ? theme.colors.background : theme.colors.text,
    },
    contextTextInput: {
      minHeight: 96,
    },
    tagsInputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
    },
    tagField: {
      flex: 1,
    },
    tagInput: {
      minHeight: 0,
    },
    tagButton: {
      minWidth: 70,
      marginBottom: 1,
    },
    tagsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    emptyTags: {
      color: theme.colors.textDim,
    },
    voiceStatusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap',
    },
    voiceStatusPill: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 8,
      paddingHorizontal: 12,
      flexGrow: 1,
    },
    voiceStatusLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    voiceFileLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '600',
    },
    recordingHint: {
      color: theme.colors.accent,
    },
    attachedAudioCard: {
      gap: layout.rowGap + 2,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      padding: layout.surfacePadding - 2,
    },
    attachedAudioTitle: {
      fontWeight: '700',
    },
    attachedAudioUri: {
      color: theme.colors.textDim,
    },
    captureAlternateBlock: {
      gap: layout.rowGap + 2,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      paddingTop: layout.sectionGap,
    },
    captureAlternateLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
  });
}
