import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';

export function createSettingsScreenStyles(theme: Theme) {
  return StyleSheet.create({
    heroHeader: {
      gap: 14,
      paddingTop: 2,
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
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    inlineLanguageControls: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    inlineLanguageChip: {
      borderRadius: theme.borderRadii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 6,
      paddingHorizontal: 11,
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
    heroEyebrow: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    sectionCard: {
      gap: 6,
    },
    advancedToggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
    },
    toggleCopy: {
      flex: 1,
      gap: 2,
    },
    toggleTitle: {
      fontWeight: '700',
    },
    toggleMeta: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    reminderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    reminderMetaStack: {
      gap: 10,
    },
    reminderLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 11,
      paddingHorizontal: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
    },
    settingRowCopy: {
      flex: 1,
      gap: 2,
    },
    settingRowLabel: {
      fontWeight: '700',
    },
    settingRowMeta: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    settingRowValue: {
      fontWeight: '700',
      fontSize: 16,
      color: theme.colors.text,
    },
    reminderValue: {
      fontWeight: '700',
    },
    reminderHint: {
      color: theme.colors.textDim,
      lineHeight: 18,
      fontSize: 12,
    },
    reminderTimeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    iosPickerWrap: {
      borderRadius: theme.borderRadii.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      overflow: 'hidden',
      paddingVertical: 2,
    },
    reminderTimeChip: {
      borderRadius: theme.borderRadii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 7,
      paddingHorizontal: 12,
    },
    reminderTimeChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    reminderTimeChipText: {
      color: theme.colors.textDim,
      fontWeight: '600',
      fontSize: 11,
    },
    reminderTimeChipTextActive: {
      color: theme.colors.background,
    },
    title: {
      fontWeight: '700',
      lineHeight: 22,
      flexShrink: 1,
    },
    description: {
      marginTop: 2,
      color: theme.colors.textDim,
      lineHeight: 17,
      fontSize: 12,
      flexShrink: 1,
    },
    privacyRows: {
      gap: 10,
    },
    devActionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    exportPathBlock: {
      gap: 6,
      padding: 12,
      borderRadius: theme.borderRadii.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
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
    privacyFootnote: {
      color: theme.colors.textDim,
      lineHeight: 18,
      fontSize: 12,
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
