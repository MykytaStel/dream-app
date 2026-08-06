import { StyleSheet } from 'react-native';
import type { Theme } from '../../../theme/theme';
import { createSoftTile } from '../../../theme/surfaces';

export function createArchiveHealthStyles(theme: Theme) {
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
    blockedCard: {
      borderColor: theme.colors.danger,
    },
    statusTitle: {
      color: theme.colors.text,
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '800',
    },
    body: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 18,
    },
    metricRow: {
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
      flexGrow: 1,
      minWidth: 108,
      gap: 3,
    },
    metricLabel: {
      color: theme.colors.textDim,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontWeight: '700',
    },
    metricValue: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    issueList: {
      gap: theme.spacing.sm,
    },
    issue: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 13,
        paddingVertical: 11,
        paddingHorizontal: 12,
      }),
      gap: 5,
    },
    issueCritical: {
      borderColor: theme.colors.danger,
    },
    issueTitleRow: {
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
      fontSize: 11,
      fontWeight: '700',
    },
    issueBody: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 18,
    },
    actionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    action: {
      flexGrow: 1,
      minWidth: 160,
    },
    backupPath: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 16,
    },
    note: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 12,
        paddingVertical: 10,
        paddingHorizontal: 11,
      }),
    },
    loading: {
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.lg,
    },
    error: {
      color: theme.colors.danger,
      fontWeight: '700',
    },
  });
}
