import { StyleSheet } from 'react-native';
import { Theme } from '../../theme/theme';

export function createTextStyles(theme: Theme) {
  return StyleSheet.create({
    base: {
      color: theme.colors.text,
      fontSize: 16,
      lineHeight: 23,
      includeFontPadding: false,
    },
  });
}
