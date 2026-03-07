import { StyleSheet } from 'react-native';
import { Theme } from '../../theme/theme';
import { createFieldSurface } from '../../theme/surfaces';

export function createFormFieldStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      gap: 6,
    },
    label: {
      color: theme.colors.textDim,
    },
    input: {
      ...createFieldSurface(theme),
      color: theme.colors.text,
      fontSize: 14,
      lineHeight: 20,
    },
    helper: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    helperError: {
      color: theme.colors.danger,
    },
    inputInvalid: {
      borderColor: theme.colors.danger,
    },
  });
}
