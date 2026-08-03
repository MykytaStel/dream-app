import React from 'react';
import { View } from 'react-native';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { Text } from '../../../components/ui/Text';
import { logActionError } from '../../../app/errorReporting';
import {
  openBackupOnboardingPreview,
  openMonthlyReport,
  openSyncDiagnosticsPreview,
  openWakeEntry,
} from '../../../app/navigation/navigationRef';
import { DevSection } from '../components/SettingsAdvancedSections';
import { useSettingsSpoke } from './useSettingsSpoke';

/**
 * Version, schema, export — and the development tools, when there are any.
 *
 * The footer of the old settings scroll, which meant the build number was
 * reachable only by scrolling past every control in the app. It is rarely
 * wanted and worth finding quickly when it is, which is exactly what a row on
 * the hub is for.
 */
export default function SettingsAboutScreen() {
  const { copy, styles, controller } = useSettingsSpoke();

  return (
    <ScreenContainer scroll>
      <View style={styles.footerBlock}>
        <Text style={styles.footerVersion}>
          {`${copy.footerBuildLabel} ${controller.APP_VERSION_LABEL}`}
        </Text>
        <Text style={styles.footerMeta}>{controller.footerMeta}</Text>
      </View>

      {controller.__DEV__ ? (
        <DevSection
          copy={copy}
          styles={styles}
          seedDreamCount={controller.seedDreamCount}
          isUpdatingSeedDreams={controller.isUpdatingSeedDreams}
          onPreviewWakeFlow={() => openWakeEntry({ source: 'manual' })}
          onSeed250={() =>
            controller
              .onSeedDreams(250)
              .catch(e => logActionError('SettingsAboutScreen.onSeedDreams', e))
          }
          onSeed1000={() =>
            controller
              .onSeedDreams(1000)
              .catch(e => logActionError('SettingsAboutScreen.onSeedDreams', e))
          }
          onPreviewMonthlyReport={() => openMonthlyReport()}
          onPreviewBackupOnboarding={() => openBackupOnboardingPreview()}
          onPreviewSyncDiagnostics={() => openSyncDiagnosticsPreview()}
          onClearSeedDreams={controller.onClearSeedDreams}
        />
      ) : null}
    </ScreenContainer>
  );
}
