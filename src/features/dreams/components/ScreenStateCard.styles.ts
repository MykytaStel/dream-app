import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';

export function createScreenStateCardStyles(_theme: Theme) {
  return StyleSheet.create({
    card: {
      gap: 12,
      minHeight: 126,
      justifyContent: 'center',
    },
  });
}
