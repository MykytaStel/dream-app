import React from 'react';
import { Platform, Pressable, Switch, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@shopify/restyle';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { FormField } from '../../../components/ui/FormField';
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
          {(
            [
              { value: 'en', label: copy.languageEnglish },
              { value: 'uk', label: copy.languageUkrainian },
            ] as Array<{ value: AppLocale; label: string }>
          ).map(option => {
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

export function CloudSection({
  copy,
  styles,
  highlights,
  showDeveloperCloudConfig,
  cloudConfigured,
  cloudSessionStatus,
  cloudSessionIsAnonymous,
  cloudSyncEnabled,
  cloudSyncEnabledDisabled,
  cloudConfigUrl,
  cloudConfigAnonKey,
  cloudIdentityEmail,
  cloudIdentityPassword,
  isConnectingCloud,
  isSigningInCloudAccount,
  isUpgradingCloudAccount,
  isDisconnectingCloud,
  isSyncingCloud,
  cloudSyncMetaTitle,
  cloudSyncMetaDescription,
  onChangeCloudConfigUrl,
  onChangeCloudConfigAnonKey,
  onChangeCloudIdentityEmail,
  onChangeCloudIdentityPassword,
  onSaveCloudConfig,
  onClearCloudConfig,
  onConnectCloud,
  onSignInCloudAccount,
  onUpgradeCloudAccount,
  onDisconnectCloud,
  onRunCloudSync,
  onToggleCloudSync,
}: {
  copy: SettingsCopy;
  styles: SettingsStyles;
  highlights: SettingsMetaItem[];
  showDeveloperCloudConfig: boolean;
  cloudConfigured: boolean;
  cloudSessionStatus: 'signed-in' | 'signed-out';
  cloudSessionIsAnonymous: boolean;
  cloudSyncEnabled: boolean;
  cloudSyncEnabledDisabled: boolean;
  cloudConfigUrl: string;
  cloudConfigAnonKey: string;
  cloudIdentityEmail: string;
  cloudIdentityPassword: string;
  isConnectingCloud: boolean;
  isSigningInCloudAccount: boolean;
  isUpgradingCloudAccount: boolean;
  isDisconnectingCloud: boolean;
  isSyncingCloud: boolean;
  cloudSyncMetaTitle: string;
  cloudSyncMetaDescription: string;
  onChangeCloudConfigUrl: (value: string) => void;
  onChangeCloudConfigAnonKey: (value: string) => void;
  onChangeCloudIdentityEmail: (value: string) => void;
  onChangeCloudIdentityPassword: (value: string) => void;
  onSaveCloudConfig: () => void;
  onClearCloudConfig: () => void;
  onConnectCloud: () => void;
  onSignInCloudAccount: () => void;
  onUpgradeCloudAccount: () => void;
  onDisconnectCloud: () => void;
  onRunCloudSync: () => void;
  onToggleCloudSync: () => void;
}) {
  const t = useTheme<Theme>();
  const isBusy =
    isConnectingCloud ||
    isSigningInCloudAccount ||
    isUpgradingCloudAccount ||
    isDisconnectingCloud ||
    isSyncingCloud;
  const showNamedAccountForm =
    cloudSessionStatus === 'signed-out' || cloudSessionIsAnonymous;
  const namedAccountDescription =
    cloudSessionStatus === 'signed-out'
      ? copy.cloudIdentityDescriptionSignedOut
      : copy.cloudIdentityDescriptionAnonymous;

  return (
    <Card style={styles.sectionCard}>
      <SettingsSectionHeader
        title={copy.cloudTitle}
        description={copy.cloudDescription}
        trailing={
          <Switch
            value={cloudSyncEnabled}
            onValueChange={onToggleCloudSync}
            disabled={cloudSyncEnabledDisabled}
            trackColor={{
              false: t.colors.switchTrackOff,
              true: t.colors.primary,
            }}
            thumbColor={t.colors.text}
          />
        }
      />
      <SettingsMetaGrid items={highlights} dense />
      {showDeveloperCloudConfig ? (
        <View style={styles.settingControlBlock}>
          <FormField
            label={copy.cloudConfigUrlLabel}
            value={cloudConfigUrl}
            onChangeText={onChangeCloudConfigUrl}
            placeholder="https://project.supabase.co"
            helperText={copy.cloudConfigUrlHint}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!isBusy}
          />
          <FormField
            label={copy.cloudConfigAnonKeyLabel}
            value={cloudConfigAnonKey}
            onChangeText={onChangeCloudConfigAnonKey}
            placeholder="eyJ..."
            helperText={copy.cloudConfigAnonKeyHint}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isBusy}
          />
          <View style={styles.buttonRow}>
            <Button
              title={copy.cloudSaveConfigButton}
              variant="ghost"
              size="sm"
              style={styles.buttonRowButton}
              disabled={isBusy}
              onPress={onSaveCloudConfig}
            />
            <Button
              title={copy.cloudClearConfigButton}
              variant="ghost"
              size="sm"
              style={styles.buttonRowButton}
              disabled={isBusy && cloudSessionStatus === 'signed-in'}
              onPress={onClearCloudConfig}
            />
          </View>
        </View>
      ) : null}
      {showNamedAccountForm ? (
        <View style={styles.settingControlBlock}>
          <SettingsSectionHeader
            title={copy.cloudIdentityTitle}
            description={namedAccountDescription}
          />
          <FormField
            label={copy.cloudIdentityEmailLabel}
            value={cloudIdentityEmail}
            onChangeText={onChangeCloudIdentityEmail}
            placeholder="dreamer@example.com"
            helperText={copy.cloudIdentityEmailHint}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!isBusy}
          />
          <FormField
            label={copy.cloudIdentityPasswordLabel}
            value={cloudIdentityPassword}
            onChangeText={onChangeCloudIdentityPassword}
            helperText={copy.cloudIdentityPasswordHint}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            editable={!isBusy}
          />
          <Button
            title={
              cloudSessionStatus === 'signed-out'
                ? isSigningInCloudAccount
                  ? copy.cloudSignInExistingButtonBusy
                  : copy.cloudSignInExistingButton
                : isUpgradingCloudAccount
                ? copy.cloudUpgradeAccountButtonBusy
                : copy.cloudUpgradeAccountButton
            }
            variant="ghost"
            style={styles.buttonStackButton}
            disabled={!cloudConfigured || isBusy}
            onPress={
              cloudSessionStatus === 'signed-out'
                ? onSignInCloudAccount
                : onUpgradeCloudAccount
            }
          />
        </View>
      ) : null}
      <View style={styles.buttonStack}>
        {cloudSessionStatus === 'signed-in' ? (
          <>
            <Button
              title={
                isSyncingCloud
                  ? copy.cloudSyncNowButtonBusy
                  : copy.cloudSyncNowButton
              }
              variant="ghost"
              style={styles.buttonStackButton}
              disabled={isBusy || !cloudConfigured}
              onPress={onRunCloudSync}
            />
            <Button
              title={
                isDisconnectingCloud
                  ? copy.cloudDisconnectButtonBusy
                  : copy.cloudDisconnectButton
              }
              variant="danger"
              style={styles.buttonStackButton}
              disabled={isBusy}
              onPress={onDisconnectCloud}
            />
          </>
        ) : (
          <Button
            title={
              isConnectingCloud
                ? copy.cloudConnectButtonBusy
                : copy.cloudConnectButton
            }
            style={styles.buttonStackButton}
            disabled={!cloudConfigured || isBusy}
            onPress={onConnectCloud}
          />
        )}
      </View>
      <SettingsActionRow
        title={copy.cloudLastSyncLabel}
        meta={cloudSyncMetaDescription}
        value={cloudSyncMetaTitle}
      />
      <Text style={styles.privacyFootnote}>
        {showDeveloperCloudConfig
          ? cloudConfigured
            ? `${copy.cloudSyncToggleHint} ${copy.cloudFootnote}`
            : `${copy.cloudConfigMissingDescription} ${copy.cloudFootnote}`
          : copy.cloudFootnote}
      </Text>
    </Card>
  );
}
