import { StyleSheet } from 'react-native';
import { Theme } from '../../theme/theme';

export function createTagChipStyles(theme: Theme) {
  return StyleSheet.create({
    chip: {
      borderRadius: 999,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    label: {
      fontWeight: '600',
    },
  });
}
