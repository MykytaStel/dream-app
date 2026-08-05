import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import {
  ROOT_ROUTE_NAMES,
  type RootStackParamList,
} from '../../../app/navigation/routes';
import { getStorageDiagnosticsCopy } from '../../../constants/copy/storageDiagnostics';
import { SettingsActionRow } from '../components/SettingsActionRow';
import { useSettingsSpoke } from './useSettingsSpoke';

/**
 * The way in, and nothing else.
 *
 * This screen used to be nine sections in one scroll — language, theme,
 * reminders, backup, lock, privacy, analysis, transcription, and a developer
 * block — which meant everything was equally far away and the reminder time
 * sat above a two-hundred-megabyte download. Someone opening it to change one
 * thing had to read past the other eight.
 *
 * Now it is a list of rooms. Each row carries what its screen currently says,
 * so the common question — is the reminder on, is the app locked — is answered
 * without opening anything, and the answer to "where do I change X" is one
 * short list rather than a scroll.
 *
 * Backup is a row here like the rest, though its screen predates the hub. That
 * it already worked this way is most of the argument for the others.
 */
export default function SettingsScreen() {
  const { copy, styles, controller, locale } = useSettingsSpoke();
  const storageCopy = React.useMemo(
    () => getStorageDiagnosticsCopy(locale),
    [locale],
  );
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const backupMeta =
    controller.cloudSession.status === 'signed-in'
      ? `${copy.cloudLastSyncLabel}: ${controller.cloudSyncMetaTitle}`
      : controller.cloudSummaryAccountValue;

  return (
    <ScreenContainer scroll>
      {/* No subtitle: it listed four of the six things the rows below name. */}
      <SectionHeader title={copy.title} />

      <View style={styles.hubList}>
        <SettingsActionRow
          title={copy.hubAppearanceTitle}
          meta={copy.hubAppearanceMeta}
          onPress={() =>
            navigation.navigate(ROOT_ROUTE_NAMES.SettingsAppearance)
          }
        />

        <SettingsActionRow
          title={copy.hubRemindersTitle}
          meta={copy.hubRemindersMeta}
          value={
            controller.reminderSettings.enabled
              ? controller.reminderTime
              : copy.hubRemindersOff
          }
          onPress={() =>
            navigation.navigate(ROOT_ROUTE_NAMES.SettingsReminders)
          }
        />

        <SettingsActionRow
          title={copy.hubBackupTitle}
          meta={backupMeta}
          value={controller.cloudSummaryStatusValue}
          onPress={() => navigation.navigate(ROOT_ROUTE_NAMES.Backup)}
        />

        <SettingsActionRow
          title={copy.hubSecurityTitle}
          meta={copy.hubSecurityMeta}
          value={
            controller.biometricLockEnabled
              ? copy.hubSecurityLocked
              : copy.hubSecurityUnlocked
          }
          onPress={() => navigation.navigate(ROOT_ROUTE_NAMES.SettingsSecurity)}
        />

        <SettingsActionRow
          title={copy.hubAnalysisTitle}
          meta={copy.hubAnalysisMeta}
          onPress={() => navigation.navigate(ROOT_ROUTE_NAMES.SettingsAnalysis)}
        />

        <SettingsActionRow
          title={storageCopy.hubTitle}
          meta={storageCopy.hubMeta}
          onPress={() => navigation.navigate(ROOT_ROUTE_NAMES.SettingsStorage)}
        />

        <SettingsActionRow
          title={copy.hubAboutTitle}
          meta={copy.hubAboutMeta}
          value={controller.APP_VERSION_LABEL}
          onPress={() => navigation.navigate(ROOT_ROUTE_NAMES.SettingsAbout)}
        />
      </View>
    </ScreenContainer>
  );
}
