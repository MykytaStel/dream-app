import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';

export function createHomeControlsStyles(theme: Theme) {
  return StyleSheet.create({
    sectionLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    sectionHint: {
      color: theme.colors.textDim,
      marginTop: -2,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    searchCard: {
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    searchBarRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    searchCardHeaderRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    searchFieldContainer: {
      flex: 1,
      gap: 4,
    },
    searchFieldInput: {
      paddingVertical: 10,
      minHeight: 0,
    },
    controlSection: {
      gap: 8,
    },
    controlCard: {
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    controlSectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
    },
    searchDetailsToggleRow: {
      alignItems: 'flex-start',
      marginTop: -2,
    },
    searchDetailsToggleButton: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 6,
        paddingHorizontal: 10,
      }),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    primaryControlsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 10,
      flexWrap: 'wrap',
    },
    primaryActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
      marginTop: -2,
    },
    controlSectionDivider: {
      height: 1,
      backgroundColor: theme.colors.border,
      opacity: 0.65,
    },
    sortControlBlock: {
      gap: 8,
    },
    resultCount: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '600',
    },
    inlineActionButton: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 6,
        paddingHorizontal: 10,
      }),
    },
    inlineActionButtonActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    inlineActionButtonText: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '700',
    },
    inlineActionButtonTextActive: {
      color: theme.colors.onPrimary,
    },
    activeFiltersRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
    },
    emptyActionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
    },
    searchPresetHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
    },
    searchPresetLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    searchPresetSaveButton: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 5,
        paddingHorizontal: 9,
      }),
    },
    searchPresetSaveButtonText: {
      color: theme.colors.text,
      fontSize: 11,
      fontWeight: '700',
    },
    searchPresetRow: {
      flexDirection: 'row',
      gap: 8,
      paddingRight: 4,
    },
    filterGroup: {
      gap: 6,
    },
    filterGroupGrid: {
      flexDirection: 'row',
      gap: 10,
      flexWrap: 'wrap',
    },
    filterGroupGridItem: {
      flex: 1,
      minWidth: 148,
    },
    filterGroupLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '600',
    },
    filterGroupMetaLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '600',
    },
    filterSelectionBlock: {
      gap: 8,
    },
    filterButton: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 6,
        paddingHorizontal: 10,
      }),
    },
    filterButtonActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    filterButtonLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '600',
    },
    filterButtonLabelActive: {
      color: theme.colors.onPrimary,
    },
    clearFiltersButton: {
      alignSelf: 'flex-start',
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 6,
        paddingHorizontal: 10,
      }),
    },
    clearFiltersButtonText: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '700',
    },
    filterEmptyText: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    filterMoreButton: {
      alignSelf: 'flex-start',
      paddingVertical: 4,
    },
    filterMoreButtonText: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '700',
    },
    filterSheetRoot: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: `${theme.colors.scrim}59`,
    },
    filterSheetBackdrop: {
      flex: 1,
    },
    filterSheetCard: {
      gap: 10,
      borderTopLeftRadius: theme.borderRadii.xl,
      borderTopRightRadius: theme.borderRadii.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderBottomWidth: 0,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 24,
    },
    filterSheetHeader: {
      gap: 8,
    },
    filterSheetHeaderActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    filterSheetHandle: {
      alignSelf: 'center',
      width: 42,
      height: 5,
      borderRadius: 999,
      backgroundColor: theme.colors.border,
    },
    filterSheetBody: {
      gap: 12,
      paddingBottom: 8,
    },
    filterSheetScroll: {
      maxHeight: 460,
    },
    homeCustomizeOrderList: {
      gap: 8,
    },
    homeCustomizeOrderRow: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 8,
        paddingHorizontal: 10,
      }),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    homeCustomizeOrderRowHidden: {
      opacity: 0.68,
    },
    homeCustomizeOrderCopy: {
      flex: 1,
      gap: 2,
    },
    homeCustomizeOrderTitle: {
      color: theme.colors.text,
      fontSize: 13,
      lineHeight: 17,
      fontWeight: '700',
    },
    homeCustomizeOrderMeta: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 15,
    },
    homeCustomizeOrderActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    homeCustomizeOrderButton: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 7,
        paddingHorizontal: 9,
      }),
      minWidth: 34,
      alignItems: 'center',
      justifyContent: 'center',
    },
    homeCustomizeOrderButtonDisabled: {
      opacity: 0.45,
    },
    homeCustomizeOrderButtonPressed: {
      opacity: 0.88,
    },
    filterAdvancedMeta: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '600',
    },
  });
}
