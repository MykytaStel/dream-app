import { StyleSheet } from 'react-native';
import { Theme } from '../../theme/theme';
import { fontFamilies } from '../../theme/fonts';

export function createTextStyles(theme: Theme) {
  return StyleSheet.create({
    base: {
      color: theme.colors.text,
      fontFamily: fontFamilies.sans,
      fontSize: 16,
      lineHeight: 23,
      includeFontPadding: false,
    },
  });
}
