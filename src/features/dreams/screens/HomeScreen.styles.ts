import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';

export function createHomeScreenStyles(theme: Theme) {
  return StyleSheet.create({
    emptyContainer: {
      justifyContent: 'center',
    },
    emptyCard: {
      gap: 10,
    },
    dreamCard: {
      gap: 12,
    },
    dreamMeta: {
      gap: 6,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
    },
    timestamp: {
      color: theme.colors.textDim,
    },
    preview: {
      color: theme.colors.textDim,
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
  });
}
