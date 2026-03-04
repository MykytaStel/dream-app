import { StyleSheet } from 'react-native';
import { Theme } from '../../theme/theme';

export function createInfoRowStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    label: {
      color: theme.colors.textDim,
    },
  });
}
