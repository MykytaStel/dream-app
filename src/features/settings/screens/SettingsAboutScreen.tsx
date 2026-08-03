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
 * reachable only by scrolling past every control in the app. A row on the hub
 * makes it one tap away instead — but the version still belongs at the bottom
 * of the screen it lands on, the way a colophon does, rather than being the
 * first thing read.
 */
export default function SettingsAboutScreen() {
  const { copy, styles, controller } = useSettingsSpoke();

  return (
    <ScreenContainer scroll withTopInset={false}>
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

      {/* Last, the way a colophon is. Moving it to the top of its own screen
          put the build number above the tools someone actually came for. */}
      <View style={styles.footerBlock}>
        <Text style={styles.footerVersion}>
          {`${copy.footerBuildLabel} ${controller.APP_VERSION_LABEL}`}
        </Text>
        <Text style={styles.footerMeta}>{controller.footerMeta}</Text>
      </View>
    </ScreenContainer>
  );
}
