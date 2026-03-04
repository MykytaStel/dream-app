import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';

export function createNewDreamScreenStyles(theme: Theme, selected: boolean) {
  return StyleSheet.create({
    card: {
      gap: 12,
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
      gap: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      padding: 12,
    },
    attachedAudioTitle: {
      fontWeight: '700',
    },
    attachedAudioUri: {
      color: theme.colors.textDim,
    },
  });
}
