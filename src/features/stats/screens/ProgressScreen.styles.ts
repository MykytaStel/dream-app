import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';

export function createProgressScreenStyles(theme: Theme) {
  return StyleSheet.create({
    heroCard: {
      gap: 14,
      padding: 16,
    },
    heroHeader: {
      gap: 8,
    },
    backButton: {
      alignSelf: 'flex-start',
      ...createControlPill(theme, {
        tone: 'surface',
        paddingHorizontal: 10,
        paddingVertical: 6,
      }),
    },
    backLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '700',
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    summaryCard: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 11,
        paddingHorizontal: 12,
      }),
      flex: 1,
      minWidth: 148,
      gap: 4,
    },
    summaryCardAccent: {
      borderColor: theme.colors.accent,
    },
    summaryLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    summaryValue: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '700',
      includeFontPadding: false,
    },
    summaryHint: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    focusCard: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 16,
        paddingVertical: 12,
        paddingHorizontal: 13,
      }),
      gap: 8,
      borderColor: theme.colors.border,
    },
    focusLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.55,
      fontWeight: '700',
    },
    focusTitle: {
      color: theme.colors.text,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '700',
    },
    focusDescription: {
      color: theme.colors.textDim,
      lineHeight: 19,
      fontSize: 13,
    },
    focusMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      flexWrap: 'wrap',
    },
    focusMetaText: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: '600',
    },
    sectionCard: {
      gap: 12,
    },
    achievementsList: {
      gap: 12,
    },
    achievementItem: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: theme.borderRadii.lg,
      }),
      gap: 10,
      padding: theme.spacing.md,
    },
    achievementItemUnlocked: {
      borderColor: theme.colors.accent,
    },
    achievementItemHighlighted: {
      backgroundColor: theme.colors.surfaceAlt,
    },
    achievementHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    achievementCopy: {
      flex: 1,
      gap: 4,
    },
    achievementTitle: {
      fontWeight: '700',
    },
    achievementDescription: {
      color: theme.colors.textDim,
      lineHeight: 20,
    },
    achievementBadge: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingHorizontal: 10,
        paddingVertical: 6,
      }),
    },
    achievementBadgeUnlocked: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.accent,
    },
    achievementBadgeText: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '700',
    },
    achievementBadgeTextUnlocked: {
      color: theme.colors.background,
    },
    achievementProgressTrack: {
      height: 8,
      borderRadius: 999,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
    },
    achievementProgressFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
    },
    achievementProgressFillUnlocked: {
      backgroundColor: theme.colors.accent,
    },
  });
}
