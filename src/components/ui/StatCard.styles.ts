import { StyleSheet } from 'react-native';

export const statCardStyles = StyleSheet.create({
  card: {
    flex: 1,
  },
  label: {
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
  },
  value: {
    marginTop: 6,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    includeFontPadding: false,
  },
});
