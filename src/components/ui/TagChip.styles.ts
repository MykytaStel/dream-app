import { StyleSheet } from 'react-native';
import { Theme } from '../../theme/theme';
import { createControlPill } from '../../theme/surfaces';

export function createTagChipStyles(theme: Theme, selected = false) {
  return StyleSheet.create({
    pressable: {
      borderRadius: 999,
    },
    chip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 6,
        paddingHorizontal: 10,
      }),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
      borderColor: selected ? theme.colors.primary : theme.colors.border,
    },
    label: {
      color: selected ? theme.colors.background : theme.colors.text,
      fontSize: 11,
      fontWeight: '700',
    },
    icon: {
      marginRight: -1,
    },
  });
}
