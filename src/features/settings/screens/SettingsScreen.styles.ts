import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';

export function createSettingsScreenStyles(theme: Theme) {
  return StyleSheet.create({
    heroCard: {
      gap: 8,
    },
    heroEyebrow: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    sectionCard: {
      gap: 8,
    },
    title: {
      fontWeight: '700',
    },
    description: {
      marginTop: 6,
      color: theme.colors.textDim,
    },
  });
}
