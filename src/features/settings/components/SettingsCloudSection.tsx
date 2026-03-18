import React from 'react';
import { Pressable, Switch, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { FormField } from '../../../components/ui/FormField';
import { Text } from '../../../components/ui/Text';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { Theme } from '../../../theme/theme';
import { createSettingsScreenStyles } from '../screens/SettingsScreen.styles';
import { SettingsActionRow } from './SettingsActionRow';
import { SettingsMetaGrid, type SettingsMetaItem } from './SettingsMetaGrid';
import { SettingsSectionHeader } from './SettingsSectionHeader';
import { SettingsSegmentedControl } from './SettingsSegmentedControl';

type SettingsCopy = ReturnType<typeof getSettingsCopy>;
type SettingsStyles = ReturnType<typeof createSettingsScreenStyles>;
type BackupEntryPath = 'first-device' | 'another-device';
type CloudSessionStatus = 'signed-in' | 'signed-out';

function getCloudGuideSteps(
  copy: SettingsCopy,
  cloudSessionStatus: CloudSessionStatus,
  backupEntryPath: BackupEntryPath,
  cloudSessionIsAnonymous: boolean,
) {
  if (cloudSessionStatus === 'signed-out') {
    return backupEntryPath === 'first-device'
      ? [copy.cloudGuideStepOne, copy.cloudGuideStepTwo, copy.cloudGuideStepThree]
      : [
          copy.cloudGuideExistingStepOne,
          copy.cloudGuideExistingStepTwo,
          copy.cloudGuideExistingStepThree,
        ];
  }

  return cloudSessionIsAnonymous
    ? [
        copy.cloudGuideAnonymousStepOne,
        copy.cloudGuideAnonymousStepTwo,
        copy.cloudGuideAnonymousStepThree,
      ]
    : [copy.cloudGuideNamedStepOne, copy.cloudGuideNamedStepTwo, copy.cloudGuideNamedStepThree];
}

function getCloudFootnote(
  copy: SettingsCopy,
  showDeveloperCloudConfig: boolean,
  cloudConfigured: boolean,
) {
  if (!showDeveloperCloudConfig) {
    return copy.cloudFootnote;
  }

  return cloudConfigured
    ? `${copy.cloudSyncToggleHint} ${copy.cloudFootnote}`
    : `${copy.cloudConfigMissingDescription} ${copy.cloudFootnote}`;
}

function CloudIdentityFields({
  copy,
  cloudIdentityEmail,
  cloudIdentityPassword,
  isBusy,
  onChangeCloudIdentityEmail,
  onChangeCloudIdentityPassword,
}: {
  copy: SettingsCopy;
  cloudIdentityEmail: string;
  cloudIdentityPassword: string;
  isBusy: boolean;
  onChangeCloudIdentityEmail: (value: string) => void;
  onChangeCloudIdentityPassword: (value: string) => void;
}) {
  return (
    <>
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
    </>
  );
}

function CloudGuideBlock({
  copy,
  styles,
  steps,
}: {
  copy: SettingsCopy;
  styles: SettingsStyles;
  steps: string[];
}) {
  return (
    <View style={styles.backupGuideBlock}>
      <Text style={styles.backupGuideTitle}>{copy.cloudGuideTitle}</Text>
      {steps.map((step, index) => (
        <View key={`${index + 1}-${step}`} style={styles.backupGuideStepRow}>
          <View style={styles.backupGuideStepBadge}>
            <Text style={styles.backupGuideStepBadgeText}>{index + 1}</Text>
          </View>
          <Text style={styles.backupGuideStepText}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

function CloudDeveloperConfigBlock({
  copy,
  styles,
  cloudConfigUrl,
  cloudConfigAnonKey,
  isBusy,
  cloudSessionStatus,
  onChangeCloudConfigUrl,
  onChangeCloudConfigAnonKey,
  onSaveCloudConfig,
  onClearCloudConfig,
}: {
  copy: SettingsCopy;
  styles: SettingsStyles;
  cloudConfigUrl: string;
  cloudConfigAnonKey: string;
  isBusy: boolean;
  cloudSessionStatus: CloudSessionStatus;
  onChangeCloudConfigUrl: (value: string) => void;
  onChangeCloudConfigAnonKey: (value: string) => void;
  onSaveCloudConfig: () => void;
  onClearCloudConfig: () => void;
}) {
  return (
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
  );
}

function CloudAccountFormBlock({
  copy,
  styles,
  title,
  description,
  cloudIdentityEmail,
  cloudIdentityPassword,
  isBusy,
  primaryActionTitle,
  primaryActionDisabled,
  onChangeCloudIdentityEmail,
  onChangeCloudIdentityPassword,
  onPrimaryAction,
  secondaryActionTitle,
  onSecondaryAction,
}: {
  copy: SettingsCopy;
  styles: SettingsStyles;
  title: string;
  description: string;
  cloudIdentityEmail: string;
  cloudIdentityPassword: string;
  isBusy: boolean;
  primaryActionTitle: string;
  primaryActionDisabled: boolean;
  onChangeCloudIdentityEmail: (value: string) => void;
  onChangeCloudIdentityPassword: (value: string) => void;
  onPrimaryAction: () => void;
  secondaryActionTitle?: string;
  onSecondaryAction?: () => void;
}) {
  return (
    <View style={styles.settingControlBlock}>
      <SettingsSectionHeader title={title} description={description} />
      <CloudIdentityFields
        copy={copy}
        cloudIdentityEmail={cloudIdentityEmail}
        cloudIdentityPassword={cloudIdentityPassword}
        isBusy={isBusy}
        onChangeCloudIdentityEmail={onChangeCloudIdentityEmail}
        onChangeCloudIdentityPassword={onChangeCloudIdentityPassword}
      />
      <Button
        title={primaryActionTitle}
        style={styles.buttonStackButton}
        disabled={primaryActionDisabled}
        onPress={onPrimaryAction}
      />
      {secondaryActionTitle && onSecondaryAction ? (
        <Button
          title={secondaryActionTitle}
          variant="ghost"
          style={styles.buttonStackButton}
          disabled={primaryActionDisabled}
          onPress={onSecondaryAction}
        />
      ) : null}
    </View>
  );
}

function CloudSessionActions({
  styles,
  cloudConfigured,
  isBusy,
  syncActionTitle,
  disconnectActionTitle,
  onRunCloudSync,
  onDisconnectCloud,
}: {
  styles: SettingsStyles;
  cloudConfigured: boolean;
  isBusy: boolean;
  syncActionTitle: string;
  disconnectActionTitle: string;
  onRunCloudSync: () => void;
  onDisconnectCloud: () => void;
}) {
  return (
    <View style={styles.buttonStack}>
      <Button
        title={syncActionTitle}
        variant="ghost"
        style={styles.buttonStackButton}
        disabled={isBusy || !cloudConfigured}
        onPress={onRunCloudSync}
      />
      <Button
        title={disconnectActionTitle}
        variant="danger"
        style={styles.buttonStackButton}
        disabled={isBusy}
        onPress={onDisconnectCloud}
      />
    </View>
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
  isRequestingCloudPasswordReset,
  isUpgradingCloudAccount,
  isDisconnectingCloud,
  isSyncingCloud,
  cloudActionFeedback,
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
  onRequestCloudPasswordReset,
  onUpgradeCloudAccount,
  onDisconnectCloud,
  onRunCloudSync,
  onToggleCloudSync,
  onDismissCloudActionFeedback,
}: {
  copy: SettingsCopy;
  styles: SettingsStyles;
  highlights: SettingsMetaItem[];
  showDeveloperCloudConfig: boolean;
  cloudConfigured: boolean;
  cloudSessionStatus: CloudSessionStatus;
  cloudSessionIsAnonymous: boolean;
  cloudSyncEnabled: boolean;
  cloudSyncEnabledDisabled: boolean;
  cloudConfigUrl: string;
  cloudConfigAnonKey: string;
  cloudIdentityEmail: string;
  cloudIdentityPassword: string;
  isConnectingCloud: boolean;
  isSigningInCloudAccount: boolean;
  isRequestingCloudPasswordReset: boolean;
  isUpgradingCloudAccount: boolean;
  isDisconnectingCloud: boolean;
  isSyncingCloud: boolean;
  cloudActionFeedback: { title: string; description: string } | null;
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
  onRequestCloudPasswordReset: () => void;
  onUpgradeCloudAccount: () => void;
  onDisconnectCloud: () => void;
  onRunCloudSync: () => void;
  onToggleCloudSync: () => void;
  onDismissCloudActionFeedback: () => void;
}) {
  const t = useTheme<Theme>();
  const [backupEntryPath, setBackupEntryPath] =
    React.useState<BackupEntryPath>('first-device');
  const isBusy =
    isConnectingCloud ||
    isSigningInCloudAccount ||
    isRequestingCloudPasswordReset ||
    isUpgradingCloudAccount ||
    isDisconnectingCloud ||
    isSyncingCloud;
  const showPathSelector = cloudSessionStatus === 'signed-out';
  const showConnectAction =
    cloudSessionStatus === 'signed-out' && backupEntryPath === 'first-device';
  const showExistingBackupForm =
    cloudSessionStatus === 'signed-out' && backupEntryPath === 'another-device';
  const showSaveBackupForm = cloudSessionIsAnonymous;
  const showNamedAccountActions =
    cloudSessionStatus === 'signed-in' && !cloudSessionIsAnonymous;
  const showHighlights = cloudSessionStatus === 'signed-in' || showDeveloperCloudConfig;
  const backupGuideSteps = getCloudGuideSteps(
    copy,
    cloudSessionStatus,
    backupEntryPath,
    cloudSessionIsAnonymous,
  );
  const cloudFootnote = getCloudFootnote(copy, showDeveloperCloudConfig, cloudConfigured);

  return (
    <Card style={styles.sectionCard}>
      <SettingsSectionHeader
        title={copy.cloudTitle}
        description={copy.cloudDescription}
        trailing={
          cloudSessionStatus === 'signed-in' ? (
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
          ) : null
        }
      />
      {showHighlights ? <SettingsMetaGrid items={highlights} dense /> : null}
      {showPathSelector ? (
        <View style={styles.backupModeBlock}>
          <SettingsSectionHeader
            title={copy.cloudPathTitle}
            description={copy.cloudPathDescription}
          />
          <SettingsSegmentedControl
            selectedValue={backupEntryPath}
            onChange={setBackupEntryPath}
            options={[
              { value: 'first-device', label: copy.cloudPathThisDevice },
              { value: 'another-device', label: copy.cloudPathAnotherDevice },
            ]}
            columns={2}
            minWidth={130}
          />
        </View>
      ) : null}
      <CloudGuideBlock copy={copy} styles={styles} steps={backupGuideSteps} />
      {cloudActionFeedback ? (
        <Pressable style={styles.backupSuccessBlock} onPress={onDismissCloudActionFeedback}>
          <Text style={styles.backupSuccessTitle}>
            {`${copy.cloudSuccessTitle}: ${cloudActionFeedback.title}`}
          </Text>
          <Text style={styles.backupSuccessText}>{cloudActionFeedback.description}</Text>
        </Pressable>
      ) : null}
      {showDeveloperCloudConfig ? (
        <CloudDeveloperConfigBlock
          copy={copy}
          styles={styles}
          cloudConfigUrl={cloudConfigUrl}
          cloudConfigAnonKey={cloudConfigAnonKey}
          isBusy={isBusy}
          cloudSessionStatus={cloudSessionStatus}
          onChangeCloudConfigUrl={onChangeCloudConfigUrl}
          onChangeCloudConfigAnonKey={onChangeCloudConfigAnonKey}
          onSaveCloudConfig={onSaveCloudConfig}
          onClearCloudConfig={onClearCloudConfig}
        />
      ) : null}
      {showConnectAction ? (
        <View style={styles.buttonStack}>
          <View style={styles.settingControlBlock}>
            <SettingsSectionHeader
              title={copy.cloudFirstDeviceTitle}
              description={copy.cloudFirstDeviceDescription}
            />
            <Button
              title={isConnectingCloud ? copy.cloudConnectButtonBusy : copy.cloudConnectButton}
              style={styles.buttonStackButton}
              disabled={!cloudConfigured || isBusy}
              onPress={onConnectCloud}
            />
          </View>
        </View>
      ) : null}
      {showExistingBackupForm ? (
        <CloudAccountFormBlock
          copy={copy}
          styles={styles}
          title={copy.cloudExistingBackupTitle}
          description={copy.cloudIdentityDescriptionSignedOut}
          cloudIdentityEmail={cloudIdentityEmail}
          cloudIdentityPassword={cloudIdentityPassword}
          isBusy={isBusy}
          primaryActionTitle={
            isSigningInCloudAccount
              ? copy.cloudSignInExistingButtonBusy
              : copy.cloudSignInExistingButton
          }
          primaryActionDisabled={!cloudConfigured || isBusy}
          onChangeCloudIdentityEmail={onChangeCloudIdentityEmail}
          onChangeCloudIdentityPassword={onChangeCloudIdentityPassword}
          onPrimaryAction={onSignInCloudAccount}
          secondaryActionTitle={
            isRequestingCloudPasswordReset
              ? copy.cloudResetPasswordButtonBusy
              : copy.cloudResetPasswordButton
          }
          onSecondaryAction={onRequestCloudPasswordReset}
        />
      ) : null}
      {showSaveBackupForm ? (
        <CloudAccountFormBlock
          copy={copy}
          styles={styles}
          title={copy.cloudSaveBackupTitle}
          description={copy.cloudIdentityDescriptionAnonymous}
          cloudIdentityEmail={cloudIdentityEmail}
          cloudIdentityPassword={cloudIdentityPassword}
          isBusy={isBusy}
          primaryActionTitle={
            isUpgradingCloudAccount
              ? copy.cloudUpgradeAccountButtonBusy
              : copy.cloudUpgradeAccountButton
          }
          primaryActionDisabled={!cloudConfigured || isBusy}
          onChangeCloudIdentityEmail={onChangeCloudIdentityEmail}
          onChangeCloudIdentityPassword={onChangeCloudIdentityPassword}
          onPrimaryAction={onUpgradeCloudAccount}
        />
      ) : null}
      {showNamedAccountActions || showSaveBackupForm ? (
        <CloudSessionActions
          styles={styles}
          cloudConfigured={cloudConfigured}
          isBusy={isBusy}
          syncActionTitle={isSyncingCloud ? copy.cloudSyncNowButtonBusy : copy.cloudSyncNowButton}
          disconnectActionTitle={
            isDisconnectingCloud ? copy.cloudDisconnectButtonBusy : copy.cloudDisconnectButton
          }
          onRunCloudSync={onRunCloudSync}
          onDisconnectCloud={onDisconnectCloud}
        />
      ) : null}
      {cloudSessionStatus === 'signed-in' ? (
        <SettingsActionRow
          title={copy.cloudLastSyncLabel}
          meta={cloudSyncMetaDescription}
          value={cloudSyncMetaTitle}
        />
      ) : null}
      <Text style={styles.privacyFootnote}>{cloudFootnote}</Text>
    </Card>
  );
}
