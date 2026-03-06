import { StyleSheet } from 'react-native';
import { Theme } from '../../../theme/theme';

export function createSettingsScreenStyles(theme: Theme) {
  return StyleSheet.create({
    heroCard: {
      gap: 8,
    },
    heroEyebrow: {
      color: theme.colors.accent,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    sectionCard: {
      gap: 8,
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
    reminderValue: {
      fontWeight: '700',
    },
    reminderHint: {
      color: theme.colors.textDim,
      lineHeight: 20,
    },
    reminderTimeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    reminderTimeChip: {
      borderRadius: theme.borderRadii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    reminderTimeChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    reminderTimeChipText: {
      color: theme.colors.textDim,
      fontWeight: '600',
      fontSize: 12,
    },
    reminderTimeChipTextActive: {
      color: theme.colors.background,
    },
    title: {
      fontWeight: '700',
      lineHeight: 24,
      flexShrink: 1,
    },
    description: {
      marginTop: 6,
      color: theme.colors.textDim,
      lineHeight: 22,
      flexShrink: 1,
    },
    privacyRows: {
      gap: 10,
    },
    privacyFootnote: {
      color: theme.colors.textDim,
      lineHeight: 20,
    },
  });
}
