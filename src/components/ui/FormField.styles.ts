import { StyleSheet } from 'react-native';
import { Theme } from '../../theme/theme';

export function createFormFieldStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      gap: 8,
    },
    label: {
      color: theme.colors.textDim,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      padding: 12,
      color: theme.colors.text,
      backgroundColor: theme.colors.surfaceAlt,
    },
    helper: {
      color: theme.colors.textDim,
    },
    helperError: {
      color: theme.colors.danger,
    },
    inputInvalid: {
      borderColor: theme.colors.danger,
    },
  });
}
