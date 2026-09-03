import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';

export function createStatsDetailStyles(theme: Theme) {
  return StyleSheet.create({
    compareModeSection: {
      gap: 6,
    },
    patternGroup: {
      gap: 8,
    },
    patternGroupLabel: {
      fontWeight: '700',
    },
    subsection: {
      gap: 10,
    },
    subsectionTitle: {
      fontWeight: '700',
    },
    signalBlock: {
      gap: 8,
    },
    signalLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '600',
    },
    moodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    moodLabel: {
      width: 72,
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
    reflectionList: {
      gap: 10,
    },
    reflectionItem: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: theme.borderRadii.lg,
      }),
      gap: 8,
      padding: theme.spacing.md,
    },
    reflectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    reflectionLabel: {
      flex: 1,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    reflectionMeta: {
      color: theme.colors.textDim,
      fontSize: 12,
    },
    teaserRow: {
      flexDirection: 'row',
      gap: 8,
    },
    teaserCard: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 11,
        paddingHorizontal: 12,
      }),
      flex: 1,
      gap: 4,
    },
    teaserCardAccent: {
      borderColor: theme.colors.accent,
    },
    teaserLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    teaserValue: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '700',
      includeFontPadding: false,
    },
    teaserHint: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    toggleButton: {
      alignSelf: 'flex-start',
      ...createControlPill(theme, {
        tone: 'surface',
        paddingHorizontal: 12,
        paddingVertical: 7,
      }),
    },
    toggleButtonText: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '700',
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
      color: theme.colors.onPrimary,
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
    mutedText: {
      color: theme.colors.textDim,
    },
  });
}
