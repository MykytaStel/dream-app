import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from './src/app/navigation/RootNavigator';
import { AppProviders } from './src/app/AppProvider';
import { AudioCleanupMaintenance } from './src/features/dreams/components/AudioCleanupMaintenance';
import { ArchiveHealthMaintenance } from './src/features/settings/components/ArchiveHealthMaintenance';
import { LocalDataRecoveryGate } from './src/features/settings/components/LocalDataRecoveryGate';
import { AppLockGate } from './src/features/security/components/AppLockGate';
import { StorageMigrationGate } from './src/services/storage/StorageMigrationGate';

// Lock copy lives here as plain strings because AppLockGate renders outside
// ThemeProvider and i18n context. These are intentionally not localised —
// the lock screen appears before any locale preference is loaded.
const LOCK_COPY = {
  promptMessage: 'Unlock Kaleidoscope',
  unlockLabel: 'Unlock',
  subtitle: 'Your dreams are protected.',
  appName: 'Kaleidoscope',
  lockDisabledTitle: 'App lock turned off',
  lockDisabledDescriptionNotEnrolled:
    'No biometrics are set up on this device anymore, so App Lock was turned off automatically. You can turn it back on in Settings once Face ID or a fingerprint is set up again.',
  lockDisabledDescriptionUnsupported:
    'This device no longer supports biometric authentication, so App Lock was turned off automatically.',
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <LocalDataRecoveryGate>
        <StorageMigrationGate>
          <AppProviders>
            <AppLockGate
              promptMessage={LOCK_COPY.promptMessage}
              unlockLabel={LOCK_COPY.unlockLabel}
              subtitle={LOCK_COPY.subtitle}
              appName={LOCK_COPY.appName}
              lockDisabledTitle={LOCK_COPY.lockDisabledTitle}
              lockDisabledDescriptionNotEnrolled={
                LOCK_COPY.lockDisabledDescriptionNotEnrolled
              }
              lockDisabledDescriptionUnsupported={
                LOCK_COPY.lockDisabledDescriptionUnsupported
              }
            >
              <AudioCleanupMaintenance />
              <ArchiveHealthMaintenance />
              <RootNavigator />
            </AppLockGate>
          </AppProviders>
        </StorageMigrationGate>
      </LocalDataRecoveryGate>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
