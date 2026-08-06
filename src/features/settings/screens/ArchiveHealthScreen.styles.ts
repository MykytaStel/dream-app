import { StyleSheet } from 'react-native';
import type { Theme } from '../../../theme/theme';
import { createSoftTile } from '../../../theme/surfaces';

export function createArchiveHealthScreenStyles(theme: Theme) {
  return StyleSheet.create({
    content: {
      gap: theme.spacing.md,
    },
    card: {
      gap: theme.spacing.sm,
    },
    statusCard: {
      gap: theme.spacing.sm,
      borderColor: theme.colors.primary,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
      flexWrap: 'wrap',
    },
    statusValue: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '800',
      color: theme.colors.text,
    },
    description: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 18,
    },
    metricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    metric: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 12,
        paddingVertical: 10,
        paddingHorizontal: 11,
      }),
      minWidth: 125,
      flexGrow: 1,
      flexBasis: 125,
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
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '700',
    },
    issueList: {
      gap: theme.spacing.sm,
    },
    issue: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 12,
        paddingVertical: 11,
        paddingHorizontal: 12,
      }),
      gap: 5,
    },
    issueHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    issueTitle: {
      flex: 1,
      color: theme.colors.text,
      fontWeight: '700',
      lineHeight: 19,
    },
    issueCount: {
      color: theme.colors.primary,
      fontWeight: '800',
    },
    issueMeta: {
      color: theme.colors.textDim,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.45,
    },
    issueDescription: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 18,
    },
    criticalText: {
      color: theme.colors.danger,
    },
    warningText: {
      color: theme.colors.accent,
    },
    successText: {
      color: theme.colors.success,
    },
    actionStack: {
      gap: theme.spacing.sm,
    },
    checkpoint: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 12,
        paddingVertical: 11,
        paddingHorizontal: 12,
      }),
      gap: 5,
      borderColor: theme.colors.success,
    },
    checkpointName: {
      color: theme.colors.text,
      fontSize: 11,
      lineHeight: 16,
      fontWeight: '700',
    },
    historyList: {
      gap: 7,
    },
    historyRow: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 10,
        paddingVertical: 9,
        paddingHorizontal: 10,
      }),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    historyTitle: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '700',
    },
    historyMeta: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 15,
      textAlign: 'right',
    },
    loadingCard: {
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.lg,
    },
    errorCard: {
      gap: theme.spacing.sm,
      borderColor: theme.colors.danger,
    },
    errorTitle: {
      color: theme.colors.danger,
      fontWeight: '700',
    },
  });
}
