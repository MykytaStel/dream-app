import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import RootNavigator from './src/app/navigation/RootNavigator';
import { AppProviders } from './src/app/AppProvider';
import { AppLockGate } from './src/features/security/components/AppLockGate';

// Lock copy lives here as plain strings because AppLockGate renders outside
// ThemeProvider and i18n context. These are intentionally not localised —
// the lock screen appears before any locale preference is loaded.
const LOCK_COPY = {
  promptMessage: 'Unlock Kaleidoscope',
  unlockLabel: 'Unlock',
  subtitle: 'Your dreams are protected.',
  appName: 'Kaleidoscope',
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AppProviders>
        <AppLockGate
          promptMessage={LOCK_COPY.promptMessage}
          unlockLabel={LOCK_COPY.unlockLabel}
          subtitle={LOCK_COPY.subtitle}
          appName={LOCK_COPY.appName}
        >
          <RootNavigator />
        </AppLockGate>
      </AppProviders>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
