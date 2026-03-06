import { StyleSheet } from 'react-native';
import { Theme } from '../../theme/theme';

export function createInfoRowStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 10,
    },
    label: {
      color: theme.colors.textDim,
      flex: 1,
      lineHeight: 21,
    },
    value: {
      flexShrink: 1,
      textAlign: 'right',
      lineHeight: 21,
    },
  });
}
