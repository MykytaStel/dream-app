import React from 'react';
import { View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { Text } from '../../../components/ui/Text';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { openBackupScreen } from '../../../app/navigation/navigationRef';
import { listDreams } from '../../dreams/repository/dreamsRepository';
import { BackupOnboardingModal } from '../components/BackupOnboardingModal';
import {
  BACKUP_ONBOARDING_DREAM_THRESHOLD,
  shouldShowBackupOnboarding,
} from '../model/backupOnboarding';
import {
  hasSeenBackupOnboarding,
  markBackupOnboardingSeen,
  resetBackupOnboardingSeen,
} from '../services/backupOnboardingService';
import { SettingsActionRow } from '../components/SettingsActionRow';
import { SettingsSectionHeader } from '../components/SettingsSectionHeader';
import { createSettingsScreenStyles } from './SettingsScreen.styles';

export default function BackupOnboardingPreviewScreen() {
  const theme = useTheme<Theme>();
  const styles = createSettingsScreenStyles(theme);
  const { locale } = useI18n();
  const copy = React.useMemo(() => getSettingsCopy(locale), [locale]);
  const [dreamCount, setDreamCount] = React.useState(0);
  const [hasSeen, setHasSeen] = React.useState(false);
  const [isModalVisible, setIsModalVisible] = React.useState(false);

  const refreshState = React.useCallback(() => {
    setDreamCount(listDreams().length);
    setHasSeen(hasSeenBackupOnboarding());
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refreshState();
    }, [refreshState]),
  );

  const isEligible = React.useMemo(
    () =>
      shouldShowBackupOnboarding({
        dreamCount,
        hasSeen,
      }),
    [dreamCount, hasSeen],
  );

  const closeModal = React.useCallback(() => {
    markBackupOnboardingSeen();
    setHasSeen(true);
    setIsModalVisible(false);
  }, []);

  const resetSeen = React.useCallback(() => {
    resetBackupOnboardingSeen();
    setHasSeen(false);
  }, []);

  const markSeen = React.useCallback(() => {
    markBackupOnboardingSeen();
    setHasSeen(true);
  }, []);

  const openModal = React.useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const openBackup = React.useCallback(() => {
    closeModal();
    openBackupScreen();
  }, [closeModal]);

  return (
    <>
      <ScreenContainer scroll>
        <Card style={styles.sectionCard}>
          <SettingsSectionHeader
            title={copy.backupOnboardingPreviewTitle}
            description={copy.backupOnboardingPreviewDescription}
          />
          <SettingsActionRow
            title={copy.backupOnboardingDreamsLabel}
            value={String(dreamCount)}
            variant="inline"
          />
          <SettingsActionRow
            title={copy.backupOnboardingThresholdLabel}
            value={String(BACKUP_ONBOARDING_DREAM_THRESHOLD)}
            variant="inline"
          />
          <SettingsActionRow
            title={copy.backupOnboardingPreviewSeenTitle}
            value={
              hasSeen
                ? copy.backupOnboardingPreviewSeenValue
                : copy.backupOnboardingPreviewUnseenValue
            }
            variant="inline"
          />
          <SettingsActionRow
            title={copy.backupOnboardingPreviewEligibilityTitle}
            meta={
              isEligible
                ? copy.backupOnboardingPreviewEligibilityReady
                : copy.backupOnboardingPreviewEligibilityWaiting
            }
            value={
              isEligible
                ? copy.backupOnboardingPreviewEligibilityReadyValue
                : copy.backupOnboardingPreviewEligibilityWaitingValue
            }
            variant="inline"
          />
          <View style={styles.buttonStack}>
            <Button
              title={copy.backupOnboardingPreviewOpenAction}
              onPress={openModal}
              style={styles.buttonStackButton}
            />
            <Button
              title={copy.backupOnboardingPreviewResetAction}
              onPress={resetSeen}
              variant="ghost"
              style={styles.buttonStackButton}
            />
            <Button
              title={copy.backupOnboardingPreviewMarkSeenAction}
              onPress={markSeen}
              variant="ghost"
              style={styles.buttonStackButton}
            />
          </View>
          <Text style={styles.privacyFootnote}>
            {copy.backupOnboardingPreviewFootnote}
          </Text>
        </Card>
      </ScreenContainer>

      <BackupOnboardingModal
        visible={isModalVisible}
        dreamCount={dreamCount}
        onClose={closeModal}
        onOpenBackup={openBackup}
      />
    </>
  );
}
