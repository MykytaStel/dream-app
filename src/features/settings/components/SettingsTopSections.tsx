import React from 'react';
import { Platform, Pressable, Switch, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@shopify/restyle';
import { Card } from '../../../components/ui/Card';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { type AppLocale } from '../../../i18n/types';
import { Theme, type AppThemeId } from '../../../theme/theme';
import { type BiometricAvailability } from '../../../services/security/biometricService';
import {
  getDreamReminderNotificationContent,
  type DreamReminderSettings,
  type DreamReminderStyle,
} from '../../reminders/services/dreamReminderService';
import { SettingsActionRow } from './SettingsActionRow';
import { SettingsSegmentedControl } from './SettingsSegmentedControl';
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
        <View
          style={[
            styles.inlineLanguageControls,
            isPending ? styles.inlineLanguageControlsPending : null,
          ]}
        >
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
  suggestedTime,
  getReminderDate,
  onToggleReminder,
  onOpenReminderTimePicker,
  onNativeTimePickerChange,
  onApplySuggestedTime,
  onSelectReminderStyle,
}: {
  copy: SettingsCopy;
  styles: SettingsStyles;
  reminderSettings: DreamReminderSettings;
  permissionGranted: boolean;
  isApplyingReminder: boolean;
  reminderTime: string;
  showIosTimePicker: boolean;
  pickerLocale: string;
  suggestedTime: { label: string } | null;
  getReminderDate: () => Date;
  onToggleReminder: () => void;
  onOpenReminderTimePicker: () => void;
  onNativeTimePickerChange: (event: any, date?: Date) => void;
  onApplySuggestedTime: () => void;
  onSelectReminderStyle: (style: DreamReminderStyle) => void;
}) {
  const t = useTheme<Theme>();
  const reminderStyleOptions = React.useMemo(
    () =>
      [
        {
          value: 'balanced',
          label: copy.reminderStyleBalancedLabel,
        },
        {
          value: 'gentle',
          label: copy.reminderStyleGentleLabel,
        },
        {
          value: 'direct',
          label: copy.reminderStyleDirectLabel,
        },
      ] satisfies Array<{ value: DreamReminderStyle; label: string }>,
    [copy],
  );
  const reminderSummaryMeta = !reminderSettings.enabled
    ? !permissionGranted
      ? `${copy.reminderPermissionLabel}: ${copy.reminderPermissionBlocked}.`
      : copy.reminderEnableHint
    : copy.reminderTimeHint;
  const reminderSummaryValue = reminderSettings.enabled
    ? reminderTime
    : copy.reminderOffValue;
  const reminderStyleLabel =
    reminderSettings.style === 'gentle'
      ? copy.reminderStyleGentleLabel
      : reminderSettings.style === 'direct'
        ? copy.reminderStyleDirectLabel
        : copy.reminderStyleBalancedLabel;
  const reminderStyleDescription =
    reminderSettings.style === 'gentle'
      ? copy.reminderStyleGentleDescription
      : reminderSettings.style === 'direct'
        ? copy.reminderStyleDirectDescription
        : copy.reminderStyleBalancedDescription;
  const reminderStylePreview = React.useMemo(
    () => getDreamReminderNotificationContent(copy, reminderSettings.style),
    [copy, reminderSettings.style],
  );

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

      <SettingsActionRow
        title={copy.reminderCurrentScheduleLabel}
        meta={reminderSummaryMeta}
        value={reminderSummaryValue}
        disabled={isApplyingReminder}
        onPress={reminderSettings.enabled ? onOpenReminderTimePicker : undefined}
      />

      <View style={styles.settingControlBlock}>
        <SettingsSectionHeader
          title={copy.reminderStyleTitle}
          description={copy.reminderStyleDescription}
        />
        <SettingsSegmentedControl
          options={reminderStyleOptions}
          selectedValue={reminderSettings.style}
          onChange={value => {
            if (isApplyingReminder) {
              return;
            }
            onSelectReminderStyle(value);
          }}
          columns={3}
          minWidth={92}
        />
        <Text style={styles.reminderHint}>{reminderStyleDescription}</Text>
        <Text style={styles.reminderHint}>{copy.reminderStylePreviewLabel}</Text>
        <SettingsActionRow
          title={reminderStylePreview.title}
          meta={reminderStylePreview.body}
          value={reminderStyleLabel}
          disabled
        />
        <Text style={styles.themeFootnote}>{copy.reminderStyleFootnote}</Text>
      </View>

      {reminderSettings.enabled ? (
        <>
          {suggestedTime ? (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.reminderSuggestionRow}
              onPress={onApplySuggestedTime}
              disabled={isApplyingReminder}
            >
              <Text style={styles.reminderSuggestionText}>
                {`${copy.reminderSmartSuggestionLabel} · ${suggestedTime.label}`}
              </Text>
              <View style={styles.reminderSuggestionApplyChip}>
                <Text style={styles.reminderSuggestionApplyText}>{copy.reminderSmartSuggestionApply}</Text>
              </View>
            </TouchableOpacity>
          ) : null}

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

export function ThemeSection({
  copy,
  styles,
  themeId,
  onSelectTheme,
}: {
  copy: SettingsCopy;
  styles: SettingsStyles;
  themeId: AppThemeId;
  onSelectTheme: (themeId: AppThemeId) => void;
}) {
  const options = React.useMemo(
    () =>
      [
        {
          value: 'kaleidoscope',
          label: copy.themeOptionKaleido,
        },
        {
          value: 'ember',
          label: copy.themeOptionEmber,
        },
        {
          value: 'moss',
          label: copy.themeOptionMoss,
        },
      ] satisfies Array<{ value: AppThemeId; label: string }>,
    [copy],
  );

  return (
    <Card style={styles.sectionCard}>
      <SettingsSectionHeader
        title={copy.themeTitle}
        description={copy.themeDescription}
      />
      <SettingsSegmentedControl
        options={options}
        selectedValue={themeId}
        onChange={onSelectTheme}
        columns={3}
        minWidth={92}
      />
      <Text style={styles.themeFootnote}>{copy.themeFootnote}</Text>
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

export function BackupSummarySection({
  copy,
  styles,
  summaryMeta,
  summaryValue,
  onPress,
}: {
  copy: SettingsCopy;
  styles: SettingsStyles;
  summaryMeta: string;
  summaryValue: string;
  onPress: () => void;
}) {
  return (
    <Card style={styles.sectionCard}>
      <SettingsSectionHeader
        title={copy.backupScreenTitle}
        description={copy.backupSummaryDescription}
      />
      <SettingsActionRow
        title={copy.backupSummaryOpenTitle}
        meta={summaryMeta}
        value={summaryValue}
        onPress={onPress}
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
