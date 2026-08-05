import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';
import { createSoftTile } from '../../../theme/surfaces';

export function createSettingsStorageScreenStyles(theme: Theme) {
  return StyleSheet.create({
    content: {
      gap: theme.spacing.md,
    },
    card: {
      gap: theme.spacing.sm,
    },
    summaryCard: {
      gap: theme.spacing.sm,
      borderColor: theme.colors.primary,
    },
    summaryValue: {
      color: theme.colors.text,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '800',
    },
    description: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 18,
    },
    warning: {
      color: theme.colors.accent,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: '600',
    },
    updated: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 16,
    },
    metricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    metricTile: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 12,
        paddingVertical: 10,
        paddingHorizontal: 11,
      }),
      minWidth: 132,
      flexGrow: 1,
      flexBasis: 132,
      gap: 3,
    },
    metricLabel: {
      color: theme.colors.textDim,
      fontSize: 10,
      lineHeight: 14,
      textTransform: 'uppercase',
      letterSpacing: 0.55,
      fontWeight: '700',
    },
    metricValue: {
      color: theme.colors.text,
      fontSize: 16,
      lineHeight: 21,
      fontWeight: '700',
    },
    actionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    actionButton: {
      flexGrow: 1,
      minWidth: 170,
    },
    loadingCard: {
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.lg,
    },
    loadingTitle: {
      color: theme.colors.text,
      fontWeight: '700',
      textAlign: 'center',
    },
    loadingDescription: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
    },
    errorCard: {
      gap: theme.spacing.sm,
      borderColor: theme.colors.danger,
    },
    errorTitle: {
      color: theme.colors.danger,
      fontWeight: '700',
    },
    noteCard: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 12,
        paddingVertical: 10,
        paddingHorizontal: 11,
      }),
    },
    noteText: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 17,
    },
  });
}
