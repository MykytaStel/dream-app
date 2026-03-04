import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';

export function createSettingsScreenStyles(theme: Theme) {
  return StyleSheet.create({
    title: {
      fontWeight: '700',
    },
    description: {
      marginTop: 6,
      color: theme.colors.textDim,
    },
  });
}
