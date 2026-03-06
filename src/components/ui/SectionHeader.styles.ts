import { StyleSheet } from 'react-native';
import { Theme } from '../../theme/theme';

export function createSectionHeaderStyles(theme: Theme, large: boolean) {
  return StyleSheet.create({
    container: {
      gap: 8,
    },
    title: {
      fontSize: large ? 27 : 21,
      lineHeight: large ? 34 : 28,
      fontWeight: '700',
      flexShrink: 1,
      includeFontPadding: false,
    },
    subtitle: {
      color: theme.colors.textDim,
      lineHeight: 22,
      flexShrink: 1,
      includeFontPadding: false,
    },
  });
}
