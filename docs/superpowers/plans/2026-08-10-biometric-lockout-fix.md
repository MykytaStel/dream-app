# Biometric Lockout Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop biometric app-lock from permanently locking a user out of their own
journal when the device's biometrics stop working (OS update, hardware fault,
deleted enrollment) — by detecting that case and auto-disabling the lock instead of
leaving the user stuck behind a lock screen with no way to reach Settings.

**Architecture:** `useAppLockGate`'s existing `triggerAuth` already calls
`authenticateWithBiometrics` on every unlock attempt. It gains one additional check
on failure — `checkBiometricAvailability()`, the same capability check the Settings
enable-flow already uses — to distinguish "this one attempt failed" (stay locked,
unchanged) from "biometrics are no longer possible on this device" (auto-disable,
unlock, notify). The notice surfaces through a new piece of hook state that
`AppLockGate.tsx` turns into a plain `Alert.alert`, using new hardcoded-English copy
in `App.tsx` (matching the lock screen's existing pre-i18n copy convention).

**Tech Stack:** React Native, TypeScript, `react-native-biometrics` via the existing
`biometricService.ts` wrapper.

## Global Constraints

- An ordinary failed/declined biometric attempt (device still supports biometrics)
  must NOT unlock the app or show any notice — only `checkBiometricAvailability()`
  reporting `available: false` triggers the auto-disable path. Weakening this would
  be a real security regression.
- The three new copy strings are plain hardcoded English constants in `App.tsx`'s
  `LOCK_COPY`, not routed through `getSettingsCopy`/i18n — `AppLockGate` can render
  before the async locale preference has loaded (documented at `App.tsx:12-14`).
- No change to `src/features/settings/hooks/useSettingsScreenController.ts` or any
  Settings screen file — `biometricLockEnabled` there is already re-read from
  storage on every screen focus.
- No PIN/passcode fallback, no proactive/periodic re-check while unlocked — both
  explicitly out of scope per the design spec.
- Never add a `Co-Authored-By` trailer to any commit.

---

### Task 1: Auto-disable biometric lock when biometrics become unavailable

**Files:**
- Modify: `src/features/security/hooks/useAppLockGate.ts` (full file, 66 lines)
- Modify: `src/features/security/components/AppLockGate.tsx` (full file, 153 lines)
- Modify: `App.tsx` (full file, 50 lines)

**Interfaces:**
- Consumes: `checkBiometricAvailability(): Promise<BiometricAvailability>` and
  `setBiometricLockEnabled(enabled: boolean): void`, both existing and unchanged,
  from `src/services/security/biometricService.ts`. `BiometricAvailability` is
  `{available: false, reason: 'not-supported' | 'not-enrolled' | 'unknown'} |
  {available: true, biometryType: string}`.
- Produces: `useAppLockGate(promptMessage: string)` now returns
  `{locked: boolean, triggerAuth: () => Promise<boolean>, autoDisabledReason:
  'not-supported' | 'not-enrolled' | 'unknown' | null, dismissAutoDisabledNotice:
  () => void}`. `AppLockGate` gains three new required string props:
  `lockDisabledTitle`, `lockDisabledDescriptionNotEnrolled`,
  `lockDisabledDescriptionUnsupported`.

This is one task, not split further — the hook's new state, the component's new
props, and `App.tsx`'s new copy values are one coupled unit; a reviewer could not
meaningfully approve one file here while rejecting another.

- [ ] **Step 1: Update the hook**

Find the current full contents of `src/features/security/hooks/useAppLockGate.ts`:

```ts
import React from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  authenticateWithBiometrics,
  getBiometricLockEnabled,
} from '../../../services/security/biometricService';
import { hapticUnlock } from '../../../services/haptics/hapticService';

export function useAppLockGate(promptMessage: string) {
  const [locked, setLocked] = React.useState(() => getBiometricLockEnabled());
  const appStateRef = React.useRef<AppStateStatus>(AppState.currentState);
  const authInProgressRef = React.useRef(false);

  const triggerAuth = React.useCallback(async () => {
    if (authInProgressRef.current) return false;
    authInProgressRef.current = true;
    try {
      const success = await authenticateWithBiometrics(promptMessage);
      if (success) {
        hapticUnlock();
        setLocked(false);
      }
      return success;
    } finally {
      authInProgressRef.current = false;
    }
  }, [promptMessage]);

  // Auto-trigger on initial mount if locked
  React.useEffect(() => {
    if (!locked) return;
    triggerAuth();
  }, []);

  // Re-lock when app returns to foreground from background
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;
      const comingFromBackground =
        (prevState === 'background' || prevState === 'inactive') &&
        nextState === 'active';
      if (comingFromBackground && getBiometricLockEnabled()) {
        setLocked(true);
        triggerAuth();
      }
    });
    return () => subscription.remove();
  }, [triggerAuth]);

  return { locked, triggerAuth };
}
```

Replace it entirely with:

```ts
import React from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  authenticateWithBiometrics,
  checkBiometricAvailability,
  getBiometricLockEnabled,
  setBiometricLockEnabled,
} from '../../../services/security/biometricService';
import { hapticUnlock } from '../../../services/haptics/hapticService';

export type BiometricLockAutoDisabledReason =
  | 'not-supported'
  | 'not-enrolled'
  | 'unknown';

export function useAppLockGate(promptMessage: string) {
  const [locked, setLocked] = React.useState(() => getBiometricLockEnabled());
  const [autoDisabledReason, setAutoDisabledReason] =
    React.useState<BiometricLockAutoDisabledReason | null>(null);
  const appStateRef = React.useRef<AppStateStatus>(AppState.currentState);
  const authInProgressRef = React.useRef(false);

  const triggerAuth = React.useCallback(async () => {
    if (authInProgressRef.current) return false;
    authInProgressRef.current = true;
    try {
      const success = await authenticateWithBiometrics(promptMessage);
      if (success) {
        hapticUnlock();
        setLocked(false);
        return true;
      }

      const availability = await checkBiometricAvailability();
      if (!availability.available) {
        // The device itself confirms biometric auth cannot succeed right
        // now (hardware/enrollment changed, e.g. after an OS update).
        // Continuing to require it would lock the user out of their own
        // journal permanently, and protects nothing — there's no attacker
        // to keep out if the OS can't verify anyone either. Disable the
        // lock instead of leaving them stuck.
        setBiometricLockEnabled(false);
        setLocked(false);
        setAutoDisabledReason(availability.reason);
      }
      return false;
    } finally {
      authInProgressRef.current = false;
    }
  }, [promptMessage]);

  const dismissAutoDisabledNotice = React.useCallback(() => {
    setAutoDisabledReason(null);
  }, []);

  // Auto-trigger on initial mount if locked
  React.useEffect(() => {
    if (!locked) return;
    triggerAuth();
  }, []);

  // Re-lock when app returns to foreground from background
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;
      const comingFromBackground =
        (prevState === 'background' || prevState === 'inactive') &&
        nextState === 'active';
      if (comingFromBackground && getBiometricLockEnabled()) {
        setLocked(true);
        triggerAuth();
      }
    });
    return () => subscription.remove();
  }, [triggerAuth]);

  return {
    locked,
    triggerAuth,
    autoDisabledReason,
    dismissAutoDisabledNotice,
  };
}
```

- [ ] **Step 2: Update the lock-screen component**

Find the current full contents of `src/features/security/components/AppLockGate.tsx`:

```tsx
import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../../theme/AppThemeProvider';
import { Theme } from '../../../theme/theme';
import { useAppLockGate } from '../hooks/useAppLockGate';

type AppLockGateProps = {
  children: React.ReactNode;
  promptMessage: string;
  unlockLabel: string;
  subtitle: string;
  appName: string;
};

export function AppLockGate({
  children,
  promptMessage,
  unlockLabel,
  subtitle,
  appName,
}: AppLockGateProps) {
  const { locked, triggerAuth } = useAppLockGate(promptMessage);
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <>
      {children}
      <Modal
        visible={locked}
        animationType="fade"
        transparent={false}
        statusBarTranslucent
      >
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconWrap}>
              <Ionicons
                name="lock-closed"
                size={40}
                color={theme.colors.primaryAlt}
              />
            </View>
            <View style={styles.textBlock}>
              <AppLockText style={styles.title}>{appName}</AppLockText>
              <AppLockText style={styles.subtitle}>{subtitle}</AppLockText>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.unlockButton,
              pressed ? styles.unlockButtonPressed : null,
            ]}
            onPress={triggerAuth}
          >
            <Ionicons
              name="finger-print"
              size={18}
              color={theme.colors.primary}
            />
            <AppLockText style={styles.unlockLabel}>{unlockLabel}</AppLockText>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}
```

(The `AppLockText` helper and `createStyles`/`styles` below it are unchanged — omitted
here for brevity, do not modify them.)

Replace the imports and the `AppLockGateProps`/`AppLockGate` block above with:

```tsx
import React from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../../theme/AppThemeProvider';
import { Theme } from '../../../theme/theme';
import { useAppLockGate } from '../hooks/useAppLockGate';

type AppLockGateProps = {
  children: React.ReactNode;
  promptMessage: string;
  unlockLabel: string;
  subtitle: string;
  appName: string;
  lockDisabledTitle: string;
  lockDisabledDescriptionNotEnrolled: string;
  lockDisabledDescriptionUnsupported: string;
};

export function AppLockGate({
  children,
  promptMessage,
  unlockLabel,
  subtitle,
  appName,
  lockDisabledTitle,
  lockDisabledDescriptionNotEnrolled,
  lockDisabledDescriptionUnsupported,
}: AppLockGateProps) {
  const { locked, triggerAuth, autoDisabledReason, dismissAutoDisabledNotice } =
    useAppLockGate(promptMessage);
  const { theme } = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  React.useEffect(() => {
    if (!autoDisabledReason) {
      return;
    }
    Alert.alert(
      lockDisabledTitle,
      autoDisabledReason === 'not-enrolled'
        ? lockDisabledDescriptionNotEnrolled
        : lockDisabledDescriptionUnsupported,
      [{ text: 'OK', onPress: dismissAutoDisabledNotice }],
    );
  }, [
    autoDisabledReason,
    dismissAutoDisabledNotice,
    lockDisabledDescriptionNotEnrolled,
    lockDisabledDescriptionUnsupported,
    lockDisabledTitle,
  ]);

  return (
    <>
      {children}
      <Modal
        visible={locked}
        animationType="fade"
        transparent={false}
        statusBarTranslucent
      >
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconWrap}>
              <Ionicons
                name="lock-closed"
                size={40}
                color={theme.colors.primaryAlt}
              />
            </View>
            <View style={styles.textBlock}>
              <AppLockText style={styles.title}>{appName}</AppLockText>
              <AppLockText style={styles.subtitle}>{subtitle}</AppLockText>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.unlockButton,
              pressed ? styles.unlockButtonPressed : null,
            ]}
            onPress={triggerAuth}
          >
            <Ionicons
              name="finger-print"
              size={18}
              color={theme.colors.primary}
            />
            <AppLockText style={styles.unlockLabel}>{unlockLabel}</AppLockText>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}
```

Everything below this point in the file (the `AppLockText` function, its `styles`
constant, and `createStyles`) stays exactly as it already is — do not touch it.

- [ ] **Step 3: Update the app root's copy and props**

Find the current full contents of `App.tsx`:

```tsx
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
```

Replace the `LOCK_COPY` constant and the `<AppLockGate>` JSX block with:

```tsx
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
```

The `styles` constant at the bottom of the file is unchanged.

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors. (This will fail if `App.tsx` is missing any of the three new
required props, or if either modified file has a type mismatch — treat any error
here as a real problem to fix, not something to silence.)

Run: `npx eslint src/features/security/hooks/useAppLockGate.ts src/features/security/components/AppLockGate.tsx App.tsx`
Expected: no errors, including no `react-hooks/exhaustive-deps` warning on the new
`useEffect` in `AppLockGate.tsx`.

- [ ] **Step 5: Run the full test suite for regressions**

Run: `npx jest`
Expected: PASS — same suite/test count as before this change (this task adds no new
test files, since `useAppLockGate.ts` has no existing test harness to extend — see
Global Constraints and the design spec's Testing section for why).

- [ ] **Step 6: Commit**

```bash
git add src/features/security/hooks/useAppLockGate.ts \
  src/features/security/components/AppLockGate.tsx \
  App.tsx
git commit -m "fix: auto-disable biometric lock when biometrics become unavailable"
```
