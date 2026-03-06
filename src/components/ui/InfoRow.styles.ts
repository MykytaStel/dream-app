import { StyleSheet } from 'react-native';
import { Theme } from '../../theme/theme';

export function createInfoRowStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      width: '100%',
    },
    label: {
      color: theme.colors.textDim,
      width: '38%',
      flexShrink: 0,
      lineHeight: 21,
    },
    value: {
      flex: 1,
      minWidth: 0,
      textAlign: 'right',
      lineHeight: 21,
    },
  });
}
