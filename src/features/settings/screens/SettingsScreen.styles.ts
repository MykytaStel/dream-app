import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';

export function createSettingsScreenStyles(theme: Theme) {
  return StyleSheet.create({
    heroHeader: {
      gap: 12,
      paddingTop: 4,
    },
    inlineLanguageRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
    },
    inlineLanguageLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    inlineLanguageControls: {
      flexDirection: 'row',
      gap: 7,
      flexWrap: 'wrap',
    },
    inlineLanguageChip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 6,
        paddingHorizontal: 10,
      }),
    },
    inlineLanguageChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    inlineLanguageChipText: {
      color: theme.colors.textDim,
      fontWeight: '600',
      fontSize: 11,
    },
    inlineLanguageChipTextActive: {
      color: theme.colors.background,
    },
    sectionCard: {
      gap: 10,
    },
    reminderHint: {
      color: theme.colors.textDim,
      lineHeight: 17,
      fontSize: 12,
    },
    iosPickerWrap: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: theme.borderRadii.lg,
        paddingVertical: 2,
        paddingHorizontal: 0,
      }),
      overflow: 'hidden',
    },
    advancedToggleWrap: {
      marginTop: 2,
    },
    buttonRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      alignItems: 'stretch',
    },
    buttonStack: {
      gap: 10,
      alignItems: 'stretch',
    },
    buttonRowButton: {
      flex: 1,
      minWidth: 150,
    },
    buttonStackButton: {
      width: '100%',
    },
    exportPathBlock: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 10,
        paddingHorizontal: 11,
      }),
      gap: 5,
    },
    exportPathLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    exportPathValue: {
      fontSize: 12,
      lineHeight: 18,
    },
    restoreList: {
      gap: 8,
    },
    restoreModeWrap: {
      gap: 8,
    },
    restoreModeRow: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    restoreModeChip: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 10,
        paddingHorizontal: 12,
      }),
      flexBasis: '48%',
      flexGrow: 1,
      gap: 4,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    restoreModeChipActive: {
      backgroundColor: theme.colors.surfaceElevated,
      borderColor: theme.colors.primary,
    },
    restoreModeChipText: {
      color: theme.colors.text,
      fontWeight: '700',
    },
    restoreModeChipTextActive: {
      color: theme.colors.primary,
    },
    restoreModeHint: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    restorePreviewBlock: {
      gap: 8,
    },
    restoreLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      fontWeight: '700',
    },
    restoreEmptyBlock: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 11,
        paddingHorizontal: 12,
      }),
      gap: 4,
    },
    restoreEmptyTitle: {
      color: theme.colors.text,
      fontWeight: '700',
    },
    restoreHint: {
      color: theme.colors.textDim,
      lineHeight: 17,
      fontSize: 12,
    },
    privacyFootnote: {
      color: theme.colors.textDim,
      lineHeight: 17,
      fontSize: 11,
    },
    footerBlock: {
      paddingVertical: 8,
      alignItems: 'center',
      gap: 4,
    },
    footerVersion: {
      color: theme.colors.textDim,
      fontSize: 12,
      textAlign: 'center',
    },
    footerMeta: {
      color: theme.colors.textDim,
      fontSize: 11,
      textAlign: 'center',
      opacity: 0.8,
    },
  });
}
