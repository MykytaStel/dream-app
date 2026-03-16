import React from 'react';
import { Platform, Pressable, Switch, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@shopify/restyle';
import { Card } from '../../../components/ui/Card';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { type AppLocale } from '../../../i18n/types';
import { Theme } from '../../../theme/theme';
import { type BiometricAvailability } from '../../../services/security/biometricService';
import { type DreamReminderSettings } from '../../reminders/services/dreamReminderService';
import { SettingsActionRow } from './SettingsActionRow';
import { type SettingsMetaItem } from './SettingsMetaGrid';
import { SettingsSectionHeader } from './SettingsSectionHeader';
import { createSettingsScreenStyles } from '../screens/SettingsScreen.styles';

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
  const [optimisticLocale, setOptimisticLocale] = React.useState<AppLocale | null>(null);

  React.useEffect(() => {
    setOptimisticLocale(null);
  }, [locale]);

  const displayLocale = optimisticLocale ?? locale;
  const isPending = optimisticLocale !== null;

  return (
    <View style={styles.heroHeader}>
      <SectionHeader title={copy.title} subtitle={copy.subtitle} />
      <View style={styles.inlineLanguageRow}>
        <Text style={styles.inlineLanguageLabel}>{copy.languageTitle}</Text>
        <View style={[styles.inlineLanguageControls, isPending ? { opacity: 0.72 } : null]}>
          {(
            [
              { value: 'en', label: copy.languageEnglish },
              { value: 'uk', label: copy.languageUkrainian },
            ] as Array<{ value: AppLocale; label: string }>
          ).map(option => {
            const selected = displayLocale === option.value;

            return (
              <Pressable
                key={option.value}
                style={[
                  styles.inlineLanguageChip,
                  selected ? styles.inlineLanguageChipActive : null,
                ]}
                disabled={isApplyingReminder || isPending}
                onPress={() => {
                  setOptimisticLocale(option.value);
                  onSelectLocale(option.value);
                }}
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
            trackColor={{
              false: t.colors.switchTrackOff,
              true: t.colors.primary,
            }}
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
    </Card>
  );
}

export function BiometricLockSection({
  copy,
  styles,
  biometricAvailability,
  biometricLockEnabled,
  isApplyingBiometricLock,
  onToggleBiometricLock,
}: {
  copy: SettingsCopy;
  styles: SettingsStyles;
  biometricAvailability: BiometricAvailability | null;
  biometricLockEnabled: boolean;
  isApplyingBiometricLock: boolean;
  onToggleBiometricLock: () => void;
}) {
  const t = useTheme<Theme>();

  const isSupported = biometricAvailability?.available === true;
  const isNotEnrolled =
    biometricAvailability?.available === false &&
    biometricAvailability.reason === 'not-enrolled';

  const statusValue = React.useMemo(() => {
    if (!biometricAvailability) {
      return copy.biometricLockDisabledValue;
    }
    if (!isSupported) {
      return isNotEnrolled
        ? copy.biometricLockNotEnrolledValue
        : copy.biometricLockNotSupportedValue;
    }
    return biometricLockEnabled
      ? copy.biometricLockEnabledValue
      : copy.biometricLockDisabledValue;
  }, [biometricAvailability, biometricLockEnabled, copy, isNotEnrolled, isSupported]);

  return (
    <Card style={styles.sectionCard}>
      <SettingsSectionHeader
        title={copy.biometricLockTitle}
        description={copy.biometricLockDescription}
        trailing={
          <Switch
            value={biometricLockEnabled}
            onValueChange={onToggleBiometricLock}
            disabled={!isSupported || isApplyingBiometricLock}
            trackColor={{
              false: t.colors.switchTrackOff,
              true: t.colors.primary,
            }}
            thumbColor={t.colors.text}
          />
        }
      />
      <SettingsActionRow
        title={
          isSupported && biometricAvailability?.available
            ? biometricAvailability.biometryType
            : copy.biometricLockNotSupportedValue
        }
        value={statusValue}
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
      <SettingsSectionHeader title={copy.privacyTitle} description={copy.privacyDescription} />
      {privacyHighlights.map(item => (
        <SettingsActionRow key={item.label} title={item.label} meta={item.value} />
      ))}
      <Text style={styles.privacyFootnote}>{copy.privacyFootnote}</Text>
    </Card>
  );
}
