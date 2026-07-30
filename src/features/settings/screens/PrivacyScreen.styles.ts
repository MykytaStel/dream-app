import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';

export function createPrivacyScreenStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    intro: {
      color: theme.colors.text,
      fontSize: 15,
      lineHeight: 22,
    },
    note: {
      color: theme.colors.textDim,
      fontSize: 13,
      lineHeight: 19,
    },
    item: {
      gap: 6,
    },
    itemTitle: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    itemBody: {
      color: theme.colors.textDim,
      fontSize: 13,
      lineHeight: 20,
    },
  });
}
