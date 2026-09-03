import { StyleSheet } from 'react-native';
import { hexToRgba } from '../../../theme/color';
import { Theme } from '../../../theme/theme';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';

export function createStatsOverviewStyles(theme: Theme) {
  return StyleSheet.create({
    overviewPanel: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 16,
        paddingVertical: 12,
        paddingHorizontal: 12,
      }),
      gap: 10,
    },
    overviewPanelHeader: {
      gap: 3,
    },
    overviewPanelTitle: {
      color: theme.colors.text,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700',
    },
    overviewPanelSubtitle: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    activityBarsRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 6,
      minHeight: 64,
    },
    activityBarColumn: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
    },
    activityBarTrack: {
      width: '100%',
      maxWidth: 18,
      height: 48,
      justifyContent: 'flex-end',
      borderRadius: 999,
      overflow: 'hidden',
      backgroundColor: theme.colors.surfaceAlt,
    },
    activityBarFill: {
      width: '100%',
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
      minHeight: 4,
    },
    activityBarLabel: {
      color: theme.colors.textDim,
      fontSize: 10,
      lineHeight: 12,
      textTransform: 'uppercase',
    },
    storyRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    storyCard: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 11,
        paddingHorizontal: 12,
      }),
      flexGrow: 1,
      flexBasis: '47%',
      minWidth: 148,
      gap: 4,
    },
    storyCardSingle: {
      minWidth: '100%',
    },
    storyCardAccent: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.surfaceAlt,
    },
    memoryNudgeCard: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 16,
        paddingVertical: 12,
        paddingHorizontal: 12,
      }),
      gap: 6,
      borderColor: `${theme.colors.accent}88`,
      backgroundColor: theme.colors.surfaceAlt,
    },
    memoryNudgeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    memoryNudgeBadge: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingHorizontal: 8,
        paddingVertical: 5,
      }),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderColor: `${theme.colors.accent}55`,
      backgroundColor: hexToRgba(theme.colors.primary, 0.08),
    },
    memoryNudgeBadgeText: {
      color: theme.colors.accent,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: '700',
    },
    memoryNudgeActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: 2,
    },
    memoryNudgeActionText: {
      color: theme.colors.accent,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: '700',
    },
    storyLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 14,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    storyValue: {
      color: theme.colors.text,
      fontSize: 18,
      lineHeight: 22,
      fontWeight: '700',
      includeFontPadding: false,
    },
    storyHint: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    overviewNextStepHint: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 16,
    },
  });
}
