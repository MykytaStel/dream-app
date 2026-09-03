import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';

export function createStatsReviewStyles(theme: Theme) {
  return StyleSheet.create({
    reportEntryCard: {
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 16,
        paddingVertical: 12,
        paddingHorizontal: 12,
      }),
      gap: 10,
      borderColor: theme.colors.accent,
    },
    reportEntryEyebrow: {
      color: theme.colors.accent,
      fontSize: 10,
      lineHeight: 13,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      fontWeight: '700',
    },
    reportEntryCopy: {
      gap: 3,
    },
    reportEntryTitle: {
      color: theme.colors.text,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700',
    },
    reportEntryDescription: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    reportEntryMeta: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: '600',
    },
    reportEntrySignalRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    reportEntrySignalChip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingHorizontal: 10,
        paddingVertical: 6,
      }),
    },
    reportEntrySignalChipText: {
      color: theme.colors.text,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    sectionCard: {
      gap: 10,
    },
    workQueueList: {
      gap: 8,
    },
    reviewShelfList: {
      gap: 6,
    },
    workQueueCard: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 11,
        paddingHorizontal: 12,
      }),
      gap: 6,
      borderColor: `${theme.colors.accent}55`,
      backgroundColor: theme.colors.surfaceAlt,
    },
    workQueueDreamTitle: {
      color: theme.colors.text,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700',
      flex: 1,
    },
    reviewShelfCompactRow: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 10,
        paddingHorizontal: 12,
      }),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    reviewShelfCompactCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    reviewShelfCompactEyebrow: {
      color: theme.colors.textDim,
      fontSize: 10,
      lineHeight: 13,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontWeight: '700',
    },
    reviewShelfCompactTitle: {
      color: theme.colors.text,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '700',
    },
    reviewShelfCompactMeta: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 16,
    },
    detailsSubsection: {
      gap: 4,
    },
    sectionHint: {
      color: theme.colors.textDim,
      lineHeight: 22,
    },
  });
}
