import { StyleSheet } from 'react-native';
import { Theme } from '../../theme/theme';

export function createTagChipStyles(theme: Theme, selected = false) {
  return StyleSheet.create({
    pressable: {
      borderRadius: 999,
    },
    chip: {
      borderRadius: 999,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceElevated,
      borderWidth: 1,
      borderColor: selected ? theme.colors.primary : theme.colors.border,
      paddingVertical: 7,
      paddingHorizontal: 11,
    },
    label: {
      color: selected ? theme.colors.background : theme.colors.text,
      fontSize: 12,
      fontWeight: '600',
    },
    icon: {
      marginRight: -1,
    },
  });
}
