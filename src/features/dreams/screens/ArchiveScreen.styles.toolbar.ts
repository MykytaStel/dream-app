import { StyleSheet } from 'react-native';
import { hexToRgba } from '../../../theme/color';
import { Theme } from '../../../theme/theme';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';

export function createArchiveToolbarStyles(theme: Theme) {
  return StyleSheet.create({
    content: {
      paddingTop: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    headerBlock: {
      gap: 12,
    },
    titleBlock: {
      gap: 4,
      paddingHorizontal: 2,
    },
    toolbarCard: {
      gap: 8,
      padding: 12,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
      position: 'relative',
      borderColor: `${theme.colors.border}CC`,
    },
    controlsCard: {
      gap: 8,
      padding: 9,
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: `${theme.colors.border}E6`,
    },
    toolbarGlowLarge: {
      position: 'absolute',
      width: 104,
      height: 104,
      borderRadius: 999,
      backgroundColor: theme.colors.auroraMid,
      opacity: 0.035,
      top: -20,
      right: -14,
    },
    toolbarGlowSmall: {
      position: 'absolute',
      width: 54,
      height: 54,
      borderRadius: 999,
      backgroundColor: theme.colors.accent,
      opacity: 0.03,
      bottom: -10,
      left: -8,
    },
    controlsMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    controlsMetaChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 4,
        paddingHorizontal: 8,
      }),
    },
    controlsMetaChipText: {
      color: theme.colors.textDim,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    controlsActionChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 4,
        paddingHorizontal: 8,
      }),
      backgroundColor: hexToRgba(theme.colors.background, 0.42),
    },
    controlsActionChipText: {
      color: theme.colors.text,
      fontSize: 9,
      fontWeight: '700',
    },
    searchRow: {
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 14,
        paddingVertical: 0,
        paddingHorizontal: 0,
      }),
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 8,
      overflow: 'hidden',
      borderColor: `${theme.colors.border}C8`,
      backgroundColor: hexToRgba(theme.colors.background, 0.28),
    },
    searchIconWrap: {
      width: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchFieldContainer: {
      flex: 1,
      gap: 4,
      marginLeft: 3,
    },
    searchInput: {
      backgroundColor: 'transparent',
      borderWidth: 0,
      paddingVertical: 6,
      paddingHorizontal: 0,
      minHeight: 0,
    },
    filtersRail: {
      gap: 5,
      paddingRight: 2,
    },
    filterChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 3,
        paddingHorizontal: 9,
      }),
      backgroundColor: hexToRgba(theme.colors.background, 0.42),
    },
    filterChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    filterChipText: {
      color: theme.colors.textDim,
      fontSize: 10,
      fontWeight: '700',
    },
    filterChipTextActive: {
      color: theme.colors.onPrimary,
    },
    controlsFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
      minHeight: 20,
    },
    resultsToolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 0,
      flexWrap: 'wrap',
      paddingHorizontal: 2,
    },
    resultsToolbarMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    resultsToolbarText: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    modeChip: {
      borderRadius: theme.borderRadii.pill,
      paddingVertical: 7,
      paddingHorizontal: 14,
      minWidth: 78,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modeChipActive: {
      backgroundColor: theme.colors.primary,
      shadowColor: theme.colors.glow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.14,
      shadowRadius: 12,
      elevation: 3,
    },
    modeChipText: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
    },
    modeChipTextActive: {
      color: theme.colors.onPrimary,
    },
    browseModeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
    },
    browseModeLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    browseModeChips: {
      borderRadius: theme.borderRadii.pill,
      borderWidth: 1,
      borderColor: `${theme.colors.border}C8`,
      backgroundColor: hexToRgba(theme.colors.background, 0.42),
      flexDirection: 'row',
      gap: 4,
      flexWrap: 'wrap',
      padding: 4,
    },
  });
}
