import React from 'react';
import { Platform, Pressable, Switch, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@shopify/restyle';
import { Card } from '../../../components/ui/Card';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { type AppLocale } from '../../../i18n/types';
import { Theme } from '../../../theme/theme';
import { type DreamReminderSettings } from '../../reminders/services/dreamReminderService';
import { SettingsActionRow } from './SettingsActionRow';
import { SettingsMetaGrid, type SettingsMetaItem } from './SettingsMetaGrid';
import { SettingsSectionHeader } from './SettingsSectionHeader';
import { createSettingsScreenStyles } from '../screens/SettingsScreen.styles';
import { getSettingsCopy } from '../../../constants/copy/settings';

type SettingsCopy = ReturnType<typeof getSettingsCopy>;
type SettingsStyles = ReturnType<typeof createSettingsScreenStyles>;

export function SettingsHeroSection({
  copy,
  locale,
  isApplyingReminder,
  onSelectLocale,
  styles,
}: {
  copy: SettingsCopy;
  locale: AppLocale;
  isApplyingReminder: boolean;
  onSelectLocale: (locale: AppLocale) => void;
  styles: SettingsStyles;
}) {
  return (
    <View style={styles.heroHeader}>
      <SectionHeader title={copy.title} subtitle={copy.subtitle} large />
      <View style={styles.inlineLanguageRow}>
        <Text style={styles.inlineLanguageLabel}>{copy.languageTitle}</Text>
        <View style={styles.inlineLanguageControls}>
          {([
            { value: 'en', label: copy.languageEnglish },
            { value: 'uk', label: copy.languageUkrainian },
          ] as Array<{ value: AppLocale; label: string }>).map(option => {
            const selected = locale === option.value;

            return (
              <Pressable
                key={option.value}
                style={[
                  styles.inlineLanguageChip,
                  selected ? styles.inlineLanguageChipActive : null,
                ]}
                disabled={isApplyingReminder}
                onPress={() => onSelectLocale(option.value)}
              >
                <Text
                  style={[
                    styles.inlineLanguageChipText,
                    selected ? styles.inlineLanguageChipTextActive : null,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export function ReminderSection({
  copy,
  styles,
  reminderSettings,
  permissionGranted,
  isApplyingReminder,
  reminderTime,
  showIosTimePicker,
  pickerLocale,
  getReminderDate,
  onToggleReminder,
  onOpenReminderTimePicker,
  onNativeTimePickerChange,
  onPreviewWakeFlow,
}: {
  copy: SettingsCopy;
  styles: SettingsStyles;
  reminderSettings: DreamReminderSettings;
  permissionGranted: boolean;
  isApplyingReminder: boolean;
  reminderTime: string;
  showIosTimePicker: boolean;
  pickerLocale: string;
  getReminderDate: () => Date;
  onToggleReminder: () => void;
  onOpenReminderTimePicker: () => void;
  onNativeTimePickerChange: (event: any, date?: Date) => void;
  onPreviewWakeFlow: () => void;
}) {
  const t = useTheme<Theme>();

  return (
    <Card style={styles.sectionCard}>
      <SettingsSectionHeader
        title={copy.reminderTitle}
        description={copy.reminderDescription}
        trailing={
          <Switch
            value={reminderSettings.enabled}
            onValueChange={onToggleReminder}
            disabled={isApplyingReminder}
            trackColor={{ false: t.colors.switchTrackOff, true: t.colors.primary }}
            thumbColor={t.colors.text}
          />
        }
      />

      {!permissionGranted ? (
        <Text style={styles.reminderHint}>
          {`${copy.reminderPermissionLabel}: ${copy.reminderPermissionBlocked}.`}
        </Text>
      ) : null}

      {reminderSettings.enabled ? (
        <>
          <SettingsActionRow
            title={copy.reminderTimeLabel}
            meta={copy.reminderTimeHint}
            value={reminderTime}
            disabled={isApplyingReminder}
            onPress={onOpenReminderTimePicker}
          />

          {Platform.OS === 'ios' && showIosTimePicker ? (
            <View style={styles.iosPickerWrap}>
              <DateTimePicker
                value={getReminderDate()}
                mode="time"
                display="spinner"
                locale={pickerLocale}
                themeVariant="dark"
                onChange={onNativeTimePickerChange}
              />
            </View>
          ) : null}
        </>
      ) : null}

      <SettingsActionRow
        title={copy.reminderPreviewWakeAction}
        meta={copy.reminderPreviewWakeMeta}
        onPress={onPreviewWakeFlow}
      />
    </Card>
  );
}

export function PrivacySection({
  copy,
  styles,
  privacyHighlights,
}: {
  copy: SettingsCopy;
  styles: SettingsStyles;
  privacyHighlights: SettingsMetaItem[];
}) {
  return (
    <Card style={styles.sectionCard}>
      <SettingsSectionHeader
        title={copy.privacyTitle}
        description={copy.privacyDescription}
      />
      <SettingsMetaGrid items={privacyHighlights} dense />
      <Text style={styles.privacyFootnote}>{copy.privacyFootnote}</Text>
    </Card>
  );
}
