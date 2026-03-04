import { StyleSheet } from 'react-native';
import { Theme } from '../../theme/theme';

export function createSectionHeaderStyles(theme: Theme, large: boolean) {
  return StyleSheet.create({
    container: {
      gap: 6,
    },
    title: {
      fontSize: large ? 28 : 22,
      fontWeight: '700',
    },
    subtitle: {
      color: theme.colors.textDim,
    },
  });
}
