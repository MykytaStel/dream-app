import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';

export function createSettingsScreenStyles(theme: Theme) {
  return StyleSheet.create({
    heroHeader: {
      gap: 8,
      paddingTop: 0,
    },
    inlineLanguageRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap',
    },
    inlineLanguageLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    workspaceCard: {
      gap: 6,
    },
    inlineLanguageControls: {
      flexDirection: 'row',
      gap: 7,
      flexWrap: 'wrap',
    },
    inlineLanguageChip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 5,
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
      gap: 8,
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
    buttonRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      alignItems: 'stretch',
    },
    buttonStack: {
      gap: 8,
      alignItems: 'stretch',
    },
    guidanceStack: {
      gap: 4,
    },
    settingControlBlock: {
      gap: 6,
    },
    backupModeBlock: {
      gap: 8,
    },
    backupModeHint: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 18,
    },
    backupGuideBlock: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 11,
        paddingHorizontal: 12,
      }),
      gap: 8,
    },
    backupGuideTitle: {
      color: theme.colors.text,
      fontWeight: '700',
    },
    backupGuideStepRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 9,
    },
    backupGuideStepBadge: {
      width: 22,
      height: 22,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
    },
    backupGuideStepBadgeText: {
      color: theme.colors.background,
      fontSize: 11,
      fontWeight: '700',
    },
    backupGuideStepText: {
      flex: 1,
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 18,
    },
    backupSuccessBlock: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 11,
        paddingHorizontal: 12,
      }),
      gap: 5,
      borderColor: theme.colors.primary,
    },
    backupSuccessTitle: {
      color: theme.colors.text,
      fontWeight: '700',
    },
    backupSuccessText: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 18,
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
      gap: 6,
    },
    restorePreviewBlock: {
      gap: 6,
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
      lineHeight: 16,
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
