import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';

export function createStatsScreenStyles(theme: Theme) {
  return StyleSheet.create({
    heroCard: {
      gap: 16,
    },
    heroHeader: {
      gap: 6,
    },
    heroEyebrow: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    monthLabel: {
      color: theme.colors.textDim,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 12,
    },
    sectionCard: {
      gap: 12,
    },
    sectionTitle: {
      fontWeight: '700',
    },
    moodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    moodLabel: {
      width: 56,
      color: theme.colors.textDim,
      fontSize: 12,
    },
    moodTrack: {
      flex: 1,
      height: 10,
      borderRadius: 999,
      overflow: 'hidden',
      backgroundColor: theme.colors.surfaceAlt,
    },
    moodFill: {
      height: '100%',
      borderRadius: 999,
    },
    moodValue: {
      width: 20,
      textAlign: 'right',
      fontWeight: '700',
    },
    tagsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
  });
}
