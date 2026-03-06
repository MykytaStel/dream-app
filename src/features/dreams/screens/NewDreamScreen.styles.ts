import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';
import { getDreamLayout } from '../constants/layout';

export function createNewDreamScreenStyles(theme: Theme, selected: boolean) {
  const layout = getDreamLayout(theme);

  return StyleSheet.create({
    heroCard: {
      gap: layout.heroGap,
    },
    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    },
    heroCopy: {
      flex: 1,
      gap: layout.rowGap,
    },
    heroEyebrow: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    heroDescription: {
      color: theme.colors.textDim,
    },
    pulseShell: {
      width: 76,
      height: 76,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 24,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    helperChipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    helperChip: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    helperChipLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
    },
    card: {
      gap: layout.sectionGap + 2,
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
      gap: 8,
    },
    tagInput: {
      flex: 1,
    },
    tagButton: {
      minWidth: 92,
    },
    tagsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    emptyTags: {
      color: theme.colors.textDim,
    },
    recordingHint: {
      color: theme.colors.accent,
    },
    attachedAudioCard: {
      gap: layout.rowGap + 2,
      borderRadius: 12,
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
  });
}
