# Biometric Contextual Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a modal on the Home screen after 1 saved dream, prompting the user to
enable biometric app lock, and make it the highest-priority of the three onboarding
modals now competing for Home's attention (biometric, reminder, backup).

**Architecture:** Mirrors the just-shipped reminder-onboarding slice: a pure
threshold function, a seen-flag storage service, and a self-contained modal that owns
its own enable flow by calling existing, unchanged biometric-service functions. The
three-way modal sequencing in `HomeScreen.tsx` is rebuilt around a single pure
priority function (`pickActiveOnboardingModal`) plus one generalized handoff-gate
state machine, replacing the pairwise `readyForHandoff` pattern that the previous
slice's final review flagged as not scaling past two modals.

**Tech Stack:** React Native, TypeScript, `@shopify/restyle` theming, MMKV (`kv`)
storage, `react-native-biometrics` via the existing `biometricService.ts` wrapper,
Jest.

## Global Constraints

- Threshold is 1 dream for biometric onboarding (`BIOMETRIC_ONBOARDING_DREAM_THRESHOLD = 1`).
- Priority order among onboarding modals: **biometric → reminder → backup**.
  Biometric claims the slot first when more than one is eligible.
- Reuse these existing functions from `src/services/security/biometricService.ts`
  **unchanged**: `checkBiometricAvailability()`, `authenticateWithBiometrics(promptMessage)`,
  `setBiometricLockEnabled(enabled)`.
- Reuse these existing copy keys from `src/constants/copy/settings.ts` **unchanged**
  (already present in both `SETTINGS_COPY_EN` and `SETTINGS_COPY_UK`):
  `biometricLockPrompt`, `biometricLockEnableErrorTitle`, `biometricLockEnableErrorFailed`.
- The onboarding modal must never appear on a device where
  `checkBiometricAvailability()` resolves `available: false` — no "unavailable"
  messaging inside the onboarding flow itself.
- No change to `src/features/settings/screens/SettingsSecurityScreen.tsx` or the
  existing manual-toggle flow in `src/features/settings/hooks/useSettingsScreenController.ts`
  (`onToggleBiometricLock`, lines 366-405). The new onboarding modal is a separate
  call site into the same underlying service functions, not a refactor of the
  existing one.
- No tracking call added to the existing manual Settings toggle — `trackBiometricLockToggled`
  is called only from the new onboarding modal.
- No Whisper onboarding, no `useHomeOnboardingModals()` orchestration hook — both
  explicitly out of scope per the design spec.
- Never add a `Co-Authored-By` trailer to any commit.

---

### Task 1: Biometric seen-flag storage, pure decision function, and the onboarding priority function

**Files:**
- Create: `src/features/security/model/biometricOnboarding.ts`
- Create: `src/features/security/services/biometricOnboardingService.ts`
- Create: `src/features/dreams/model/homeOnboardingPriority.ts`
- Modify: `src/services/storage/keys.ts:26` (insert one new line after `REMINDER_ONBOARDING_SEEN_KEY`)
- Test: `__tests__/biometricOnboarding.test.ts`
- Test: `__tests__/homeOnboardingPriority.test.ts`

**Interfaces:**
- Produces: `BIOMETRIC_ONBOARDING_DREAM_THRESHOLD: number`, `shouldShowBiometricOnboarding({dreamCount: number, hasSeen: boolean, forceVisible?: boolean}): boolean`, `hasSeenBiometricOnboarding(): boolean`, `markBiometricOnboardingSeen(): void`, `resetBiometricOnboardingSeen(): void`, `type HomeOnboardingModalKind = 'biometric' | 'reminder' | 'backup'`, `pickActiveOnboardingModal(candidates: {biometric: boolean; reminder: boolean; backup: boolean}): HomeOnboardingModalKind | null`.
- Consumes: nothing from other tasks.

- [ ] **Step 1: Write the failing tests**

Create `__tests__/biometricOnboarding.test.ts`:

```ts
import {
  BIOMETRIC_ONBOARDING_DREAM_THRESHOLD,
  shouldShowBiometricOnboarding,
} from '../src/features/security/model/biometricOnboarding';
import {
  hasSeenBiometricOnboarding,
  markBiometricOnboardingSeen,
  resetBiometricOnboardingSeen,
} from '../src/features/security/services/biometricOnboardingService';

describe('biometric onboarding', () => {
  beforeEach(() => {
    resetBiometricOnboardingSeen();
  });

  it('stays hidden below the threshold', () => {
    expect(
      shouldShowBiometricOnboarding({
        dreamCount: BIOMETRIC_ONBOARDING_DREAM_THRESHOLD - 1,
        hasSeen: false,
      }),
    ).toBe(false);
  });

  it('opens at the threshold when unseen', () => {
    expect(
      shouldShowBiometricOnboarding({
        dreamCount: BIOMETRIC_ONBOARDING_DREAM_THRESHOLD,
        hasSeen: false,
      }),
    ).toBe(true);
  });

  it('stays hidden after it was seen', () => {
    expect(
      shouldShowBiometricOnboarding({
        dreamCount: BIOMETRIC_ONBOARDING_DREAM_THRESHOLD + 4,
        hasSeen: true,
      }),
    ).toBe(false);
  });

  it('can be force-opened in preview mode', () => {
    expect(
      shouldShowBiometricOnboarding({
        dreamCount: 0,
        hasSeen: true,
        forceVisible: true,
      }),
    ).toBe(true);
  });

  it('persists the seen flag', () => {
    expect(hasSeenBiometricOnboarding()).toBe(false);

    markBiometricOnboardingSeen();

    expect(hasSeenBiometricOnboarding()).toBe(true);

    resetBiometricOnboardingSeen();

    expect(hasSeenBiometricOnboarding()).toBe(false);
  });
});
```

Create `__tests__/homeOnboardingPriority.test.ts`:

```ts
import { pickActiveOnboardingModal } from '../src/features/dreams/model/homeOnboardingPriority';

describe('home onboarding priority', () => {
  it('returns null when nothing is eligible', () => {
    expect(
      pickActiveOnboardingModal({
        biometric: false,
        reminder: false,
        backup: false,
      }),
    ).toBeNull();
  });

  it('picks biometric alone', () => {
    expect(
      pickActiveOnboardingModal({
        biometric: true,
        reminder: false,
        backup: false,
      }),
    ).toBe('biometric');
  });

  it('picks reminder alone', () => {
    expect(
      pickActiveOnboardingModal({
        biometric: false,
        reminder: true,
        backup: false,
      }),
    ).toBe('reminder');
  });

  it('picks backup alone', () => {
    expect(
      pickActiveOnboardingModal({
        biometric: false,
        reminder: false,
        backup: true,
      }),
    ).toBe('backup');
  });

  it('prefers biometric over reminder and backup when all are eligible', () => {
    expect(
      pickActiveOnboardingModal({
        biometric: true,
        reminder: true,
        backup: true,
      }),
    ).toBe('biometric');
  });

  it('prefers biometric over backup when reminder is not eligible', () => {
    expect(
      pickActiveOnboardingModal({
        biometric: true,
        reminder: false,
        backup: true,
      }),
    ).toBe('biometric');
  });

  it('prefers reminder over backup when biometric is not eligible', () => {
    expect(
      pickActiveOnboardingModal({
        biometric: false,
        reminder: true,
        backup: true,
      }),
    ).toBe('reminder');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/biometricOnboarding.test.ts __tests__/homeOnboardingPriority.test.ts`
Expected: FAIL — both files fail to resolve their imports (`Cannot find module '../src/features/security/model/biometricOnboarding'` etc.), since none of the source files exist yet.

- [ ] **Step 3: Add the storage key**

In `src/services/storage/keys.ts`, find this existing line (currently line 26):

```ts
export const REMINDER_ONBOARDING_SEEN_KEY = 'reminder-onboarding-seen';
```

Add immediately after it:

```ts
export const BIOMETRIC_ONBOARDING_SEEN_KEY = 'biometric-onboarding-seen';
```

- [ ] **Step 4: Create the pure decision function**

Create `src/features/security/model/biometricOnboarding.ts`:

```ts
export const BIOMETRIC_ONBOARDING_DREAM_THRESHOLD = 1;

type ShouldShowBiometricOnboardingArgs = {
  dreamCount: number;
  hasSeen: boolean;
  forceVisible?: boolean;
};

export function shouldShowBiometricOnboarding({
  dreamCount,
  hasSeen,
  forceVisible = false,
}: ShouldShowBiometricOnboardingArgs) {
  if (forceVisible) {
    return true;
  }
  return !hasSeen && dreamCount >= BIOMETRIC_ONBOARDING_DREAM_THRESHOLD;
}
```

- [ ] **Step 5: Create the seen-flag storage service**

Create `src/features/security/services/biometricOnboardingService.ts`:

```ts
import { BIOMETRIC_ONBOARDING_SEEN_KEY } from '../../../services/storage/keys';
import { kv } from '../../../services/storage/mmkv';

export function hasSeenBiometricOnboarding() {
  return kv.getBoolean(BIOMETRIC_ONBOARDING_SEEN_KEY) === true;
}

export function markBiometricOnboardingSeen() {
  kv.set(BIOMETRIC_ONBOARDING_SEEN_KEY, true);
}

export function resetBiometricOnboardingSeen() {
  kv.remove(BIOMETRIC_ONBOARDING_SEEN_KEY);
}
```

- [ ] **Step 6: Create the priority function**

Create `src/features/dreams/model/homeOnboardingPriority.ts`:

```ts
export type HomeOnboardingModalKind = 'biometric' | 'reminder' | 'backup';

type OnboardingCandidates = {
  biometric: boolean;
  reminder: boolean;
  backup: boolean;
};

export function pickActiveOnboardingModal(
  candidates: OnboardingCandidates,
): HomeOnboardingModalKind | null {
  if (candidates.biometric) {
    return 'biometric';
  }
  if (candidates.reminder) {
    return 'reminder';
  }
  if (candidates.backup) {
    return 'backup';
  }
  return null;
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx jest __tests__/biometricOnboarding.test.ts __tests__/homeOnboardingPriority.test.ts`
Expected: PASS — 5 tests in the first file, 7 in the second, all green.

- [ ] **Step 8: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint src/features/security/model/biometricOnboarding.ts src/features/security/services/biometricOnboardingService.ts src/features/dreams/model/homeOnboardingPriority.ts src/services/storage/keys.ts`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add __tests__/biometricOnboarding.test.ts __tests__/homeOnboardingPriority.test.ts \
  src/features/security/model/biometricOnboarding.ts \
  src/features/security/services/biometricOnboardingService.ts \
  src/features/dreams/model/homeOnboardingPriority.ts \
  src/services/storage/keys.ts
git commit -m "feat: add biometric onboarding seen-flag, decision logic, and modal priority function"
```

---

### Task 2: Copy, tracking, and the BiometricOnboardingModal component

**Files:**
- Modify: `src/constants/copy/settings.ts` (insert 5 keys after line 591 in `SETTINGS_COPY_EN`, 5 keys after line 1200 in `SETTINGS_COPY_UK`)
- Modify: `src/services/observability/events.ts` (insert one `OBS_EVENTS` entry after line 10, one function after line 98)
- Create: `src/features/security/components/BiometricOnboardingModal.tsx`

**Interfaces:**
- Consumes: nothing from Task 1 directly (this task's modal is self-contained UI; `HomeScreen.tsx` in Task 3 is what wires Task 1's functions to this task's modal).
- Produces: `BiometricOnboardingModal({visible, onClose, onDismiss}: {visible: boolean; onClose: () => void; onDismiss?: () => void})` — a React component with this exact prop shape (same as `ReminderOnboardingModal`'s). `trackBiometricLockToggled({enabled: boolean}): void`.

- [ ] **Step 1: Add the copy keys**

In `src/constants/copy/settings.ts`, in the `SETTINGS_COPY_EN` object, find this existing line (currently line 590-591):

```ts
  biometricLockEnableErrorFailed:
    'Biometric check failed. App lock was not enabled.',
```

Add immediately after it:

```ts
  biometricOnboardingEyebrow: 'Keep it private',
  biometricOnboardingTitle: 'Add a lock to your dreams',
  biometricOnboardingDescription:
    'Face ID, Touch ID, or a fingerprint keeps entries private if someone else picks up your phone — easy to turn off anytime.',
  biometricOnboardingPrimaryAction: 'Enable app lock',
  biometricOnboardingLaterAction: 'Not now',
```

In the `SETTINGS_COPY_UK` object, find this existing line (currently line 1199-1200):

```ts
  biometricLockEnableErrorFailed:
    'Біометрична перевірка не пройшла. Блокування не увімкнено.',
```

Add immediately after it:

```ts
  biometricOnboardingEyebrow: 'Захисти приватність',
  biometricOnboardingTitle: 'Додай блокування для своїх снів',
  biometricOnboardingDescription:
    'Face ID, Touch ID або відбиток пальця приховають записи від чужих очей — вимкнути можна будь-коли.',
  biometricOnboardingPrimaryAction: 'Увімкнути блокування',
  biometricOnboardingLaterAction: 'Не зараз',
```

`SETTINGS_COPY_UK: typeof SETTINGS_COPY_EN` enforces key parity at compile time — `npx tsc --noEmit` in Step 5 will fail if either block is missing a key or has one the other doesn't.

- [ ] **Step 2: Add the tracking function**

In `src/services/observability/events.ts`, in the `OBS_EVENTS` object, find this existing line (currently line 10):

```ts
  ReminderToggled: 'reminder_toggled',
```

Add immediately after it:

```ts
  BiometricLockToggled: 'biometric_lock_toggled',
```

Find this existing function (currently lines 94-98):

```ts
export function trackReminderToggled(input: { enabled: boolean }) {
  trackEvent(OBS_EVENTS.ReminderToggled, {
    enabled: input.enabled,
  });
}
```

Add immediately after it:

```ts

export function trackBiometricLockToggled(input: { enabled: boolean }) {
  trackEvent(OBS_EVENTS.BiometricLockToggled, {
    enabled: input.enabled,
  });
}
```

- [ ] **Step 3: Create the modal component**

Create `src/features/security/components/BiometricOnboardingModal.tsx`:

```tsx
import React from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { hexToRgba } from '../../../theme/color';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Text } from '../../../components/ui/Text';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { fontFamilies } from '../../../theme/fonts';
import {
  authenticateWithBiometrics,
  setBiometricLockEnabled,
} from '../../../services/security/biometricService';
import { trackBiometricLockToggled } from '../../../services/observability/events';

type BiometricOnboardingModalProps = {
  visible: boolean;
  onClose: () => void;
  onDismiss?: () => void;
};

/**
 * Owns its own enable flow end to end — trigger the OS biometric prompt,
 * persist the lock flag, track it — so `HomeScreen.tsx` only has to pass
 * `visible`/`onClose`/`onDismiss`, the same shape every other onboarding
 * modal in this codebase uses. `HomeScreen` only renders this modal once it
 * has already confirmed the device supports biometrics, so there is no
 * "unavailable" state to handle here — only the OS prompt succeeding or
 * being declined/failing.
 */
export function BiometricOnboardingModal({
  visible,
  onClose,
  onDismiss,
}: BiometricOnboardingModalProps) {
  const { locale } = useI18n();
  const copy = React.useMemo(() => getSettingsCopy(locale), [locale]);
  const theme = useTheme<Theme>();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(
    () => createStyles(theme, insets.bottom),
    [insets.bottom, theme],
  );

  const onEnable = React.useCallback(async () => {
    const authenticated = await authenticateWithBiometrics(
      copy.biometricLockPrompt,
    );
    if (!authenticated) {
      // Leave the modal open — the user dismisses it themselves via "Not
      // now", same rule as every other onboarding modal's failure path.
      Alert.alert(
        copy.biometricLockEnableErrorTitle,
        copy.biometricLockEnableErrorFailed,
      );
      return;
    }

    setBiometricLockEnabled(true);
    trackBiometricLockToggled({ enabled: true });
    onClose();
  }, [copy, onClose]);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
      onDismiss={onDismiss}
    >
      <View style={styles.root}>
        {/* The backdrop is a dismiss target, and without a label a screen
            reader announces an unnamed button covering the whole screen. */}
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={copy.biometricOnboardingLaterAction}
        />
        <Animated.View
          entering={FadeInDown.duration(220)}
          style={styles.sheetWrap}
        >
          <Card style={styles.card}>
            <View style={styles.handle} />

            <View style={styles.heroRow}>
              <View style={styles.heroIconWrap}>
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color={theme.colors.onPrimary}
                />
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.eyebrow}>
                  {copy.biometricOnboardingEyebrow}
                </Text>
                <Text style={styles.title}>
                  {copy.biometricOnboardingTitle}
                </Text>
                <Text style={styles.description}>
                  {copy.biometricOnboardingDescription}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Button
                title={copy.biometricOnboardingPrimaryAction}
                onPress={() => {
                  onEnable().catch(error => {
                    Alert.alert(
                      copy.biometricLockEnableErrorTitle,
                      error instanceof Error ? error.message : String(error),
                    );
                  });
                }}
                icon="lock-closed-outline"
                size="md"
              />
              <Button
                title={copy.biometricOnboardingLaterAction}
                onPress={onClose}
                variant="ghost"
                size="md"
              />
            </View>
          </Card>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(theme: Theme, bottomInset: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: hexToRgba(theme.colors.scrim, 0.58),
    },
    sheetWrap: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: bottomInset + theme.spacing.sm,
    },
    card: {
      gap: 14,
      paddingTop: theme.spacing.sm,
    },
    handle: {
      width: 44,
      height: 4,
      alignSelf: 'center',
      borderRadius: 999,
      backgroundColor: theme.colors.border,
      opacity: 0.9,
    },
    heroRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    heroIconWrap: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderWidth: 1,
      borderColor: hexToRgba(theme.colors.text, 0.12),
      shadowColor: theme.colors.glow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 14,
      elevation: 5,
    },
    heroCopy: {
      flex: 1,
      gap: 4,
    },
    eyebrow: {
      color: theme.colors.accent,
      fontFamily: fontFamilies.sans,
      fontSize: 12,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    title: {
      fontFamily: fontFamilies.display,
      fontSize: 28,
      lineHeight: 32,
    },
    description: {
      color: theme.colors.textDim,
      fontSize: 14,
      lineHeight: 20,
    },
    actions: {
      gap: 10,
    },
  });
}
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint src/constants/copy/settings.ts src/services/observability/events.ts src/features/security/components/BiometricOnboardingModal.tsx`
Expected: no errors.

- [ ] **Step 5: Run the full test suite for regressions**

Run: `npx jest`
Expected: PASS — same suite count as before this task, plus no new failures (this task adds no new test files; `settings.ts`'s type-parity constraint is checked by `tsc`, not by a runtime test).

- [ ] **Step 6: Commit**

```bash
git add src/constants/copy/settings.ts src/services/observability/events.ts \
  src/features/security/components/BiometricOnboardingModal.tsx
git commit -m "feat: add biometric onboarding copy, tracking, and modal"
```

---

### Task 3: Wire the three-way onboarding sequence into HomeScreen

**Files:**
- Modify: `src/features/dreams/screens/HomeScreen.tsx`

**Interfaces:**
- Consumes: `shouldShowBiometricOnboarding`, `hasSeenBiometricOnboarding`, `markBiometricOnboardingSeen` (Task 1); `pickActiveOnboardingModal`, `type HomeOnboardingModalKind` (Task 1); `BiometricOnboardingModal` (Task 2); `checkBiometricAvailability` (existing, `src/services/security/biometricService.ts`).
- Produces: nothing consumed by a later task — this is the final integration point.

This task replaces `HomeScreen.tsx`'s existing pairwise reminder→backup gate with a
single priority-function-driven state machine that also covers biometric. Six edits,
in file order.

- [ ] **Step 1: Add the new imports**

Find this existing block (currently lines 56-61):

```tsx
import { ReminderOnboardingModal } from '../../reminders/components/ReminderOnboardingModal';
import { shouldShowReminderOnboarding } from '../../reminders/model/reminderOnboarding';
import {
  hasSeenReminderOnboarding,
  markReminderOnboardingSeen,
} from '../../reminders/services/reminderOnboardingService';
```

Add immediately after it (still before the blank line and `function formatPreview`):

```tsx
import { BiometricOnboardingModal } from '../../security/components/BiometricOnboardingModal';
import { shouldShowBiometricOnboarding } from '../../security/model/biometricOnboarding';
import {
  hasSeenBiometricOnboarding,
  markBiometricOnboardingSeen,
} from '../../security/services/biometricOnboardingService';
import { checkBiometricAvailability } from '../../../services/security/biometricService';
import {
  pickActiveOnboardingModal,
  type HomeOnboardingModalKind,
} from '../model/homeOnboardingPriority';
```

- [ ] **Step 2: Replace the onboarding state block**

Find this existing block (currently lines 120-135):

```tsx
  const [hasSeenBackupOnboardingState, setHasSeenBackupOnboardingState] =
    React.useState(() => hasSeenBackupOnboarding());
  const [hasSeenReminderOnboardingState, setHasSeenReminderOnboardingState] =
    React.useState(() => hasSeenReminderOnboarding());
  // Gates the backup-onboarding handoff so it never mounts its <Modal> in
  // the same commit the reminder <Modal> is transitioning from visible to
  // hidden (iOS drops/garbles a Modal presented while another is still
  // animating out). Starts `true` (nothing to wait for); flips to `false`
  // once the reminder modal is shown, and back to `true` only once it has
  // actually finished dismissing — via native `onDismiss` on iOS, or
  // immediately in `closeReminderOnboarding` on Android, which never fires
  // `onDismiss` at all.
  const [
    reminderOnboardingReadyForHandoff,
    setReminderOnboardingReadyForHandoff,
  ] = React.useState(true);
```

Replace it entirely with:

```tsx
  const [hasSeenBackupOnboardingState, setHasSeenBackupOnboardingState] =
    React.useState(() => hasSeenBackupOnboarding());
  const [hasSeenReminderOnboardingState, setHasSeenReminderOnboardingState] =
    React.useState(() => hasSeenReminderOnboarding());
  const [hasSeenBiometricOnboardingState, setHasSeenBiometricOnboardingState] =
    React.useState(() => hasSeenBiometricOnboarding());
  const [biometricAvailable, setBiometricAvailable] = React.useState(false);
  // The onboarding modal actually mounted right now, as opposed to whichever
  // one the raw eligibility data says should be active (computed below as
  // `rawOnboardingCandidate`). Kept as separate state so a higher-priority
  // candidate becoming eligible mid-display (e.g. biometrics just got
  // enrolled while the reminder modal is up) can't stack a second <Modal> on
  // top of one that's still visible or still animating out — the handoff to
  // a new modal only happens once `onboardingHandoffReady` says the
  // previous one has actually finished dismissing.
  const [visibleOnboardingModal, setVisibleOnboardingModal] =
    React.useState<HomeOnboardingModalKind | null>(null);
  const [onboardingHandoffReady, setOnboardingHandoffReady] =
    React.useState(true);
```

- [ ] **Step 3: Refresh biometric state and availability alongside the existing onboarding refresh**

Find this existing block (currently lines 212-215):

```tsx
  const refreshOnboardingState = React.useCallback(() => {
    setHasSeenBackupOnboardingState(hasSeenBackupOnboarding());
    setHasSeenReminderOnboardingState(hasSeenReminderOnboarding());
  }, []);
```

Replace it entirely with:

```tsx
  const refreshOnboardingState = React.useCallback(() => {
    setHasSeenBackupOnboardingState(hasSeenBackupOnboarding());
    setHasSeenReminderOnboardingState(hasSeenReminderOnboarding());
    setHasSeenBiometricOnboardingState(hasSeenBiometricOnboarding());
    checkBiometricAvailability()
      .then(availability => setBiometricAvailable(availability.available))
      .catch(() => setBiometricAvailable(false));
  }, []);
```

- [ ] **Step 4: Replace the visibility computation with the priority-function-driven state machine**

Find this existing block (currently lines 221-251):

```tsx
  const isReminderOnboardingVisible = React.useMemo(
    () =>
      !loading &&
      shouldShowReminderOnboarding({
        dreamCount: dreams.length,
        hasSeen: hasSeenReminderOnboardingState,
      }),
    [dreams.length, hasSeenReminderOnboardingState, loading],
  );
  React.useEffect(() => {
    if (isReminderOnboardingVisible) {
      setReminderOnboardingReadyForHandoff(false);
    }
  }, [isReminderOnboardingVisible]);
  const isBackupOnboardingVisible = React.useMemo(
    () =>
      !loading &&
      !isReminderOnboardingVisible &&
      reminderOnboardingReadyForHandoff &&
      shouldShowBackupOnboarding({
        dreamCount: dreams.length,
        hasSeen: hasSeenBackupOnboardingState,
      }),
    [
      dreams.length,
      hasSeenBackupOnboardingState,
      isReminderOnboardingVisible,
      loading,
      reminderOnboardingReadyForHandoff,
    ],
  );
```

Replace it entirely with:

```tsx
  const rawOnboardingCandidate = React.useMemo<HomeOnboardingModalKind | null>(
    () =>
      loading
        ? null
        : pickActiveOnboardingModal({
            biometric:
              biometricAvailable &&
              shouldShowBiometricOnboarding({
                dreamCount: dreams.length,
                hasSeen: hasSeenBiometricOnboardingState,
              }),
            reminder: shouldShowReminderOnboarding({
              dreamCount: dreams.length,
              hasSeen: hasSeenReminderOnboardingState,
            }),
            backup: shouldShowBackupOnboarding({
              dreamCount: dreams.length,
              hasSeen: hasSeenBackupOnboardingState,
            }),
          }),
    [
      biometricAvailable,
      dreams.length,
      hasSeenBackupOnboardingState,
      hasSeenBiometricOnboardingState,
      hasSeenReminderOnboardingState,
      loading,
    ],
  );
  // The only place that ever promotes a new candidate into
  // `visibleOnboardingModal`. Runs after every render where the candidate and
  // the currently-mounted modal disagree; does nothing until
  // `onboardingHandoffReady` is true, so it naturally waits out an in-flight
  // dismiss animation before showing whatever should be active next.
  React.useEffect(() => {
    if (rawOnboardingCandidate === visibleOnboardingModal) {
      return;
    }
    if (rawOnboardingCandidate !== null && onboardingHandoffReady) {
      setVisibleOnboardingModal(rawOnboardingCandidate);
      setOnboardingHandoffReady(false);
    }
  }, [onboardingHandoffReady, rawOnboardingCandidate, visibleOnboardingModal]);
  const isBiometricOnboardingVisible = visibleOnboardingModal === 'biometric';
  const isReminderOnboardingVisible = visibleOnboardingModal === 'reminder';
  const isBackupOnboardingVisible = visibleOnboardingModal === 'backup';
```

- [ ] **Step 5: Replace the close/dismiss handlers**

Find this existing block (currently lines 285-306):

```tsx
  const closeBackupOnboarding = React.useCallback(() => {
    markBackupOnboardingSeen();
    setHasSeenBackupOnboardingState(true);
  }, []);
  const closeReminderOnboarding = React.useCallback(() => {
    markReminderOnboardingSeen();
    setHasSeenReminderOnboardingState(true);
    if (Platform.OS === 'android') {
      // Android's Modal never fires `onDismiss`, and there's no risk of two
      // <Modal>s overlapping there, so unblock the backup handoff right away.
      setReminderOnboardingReadyForHandoff(true);
    }
  }, []);
  const handleReminderOnboardingDismissed = React.useCallback(() => {
    // iOS-only: fires once the reminder modal's dismiss animation actually
    // completes, so the backup modal is safe to mount afterward.
    setReminderOnboardingReadyForHandoff(true);
  }, []);
  const openBackupFromOnboarding = React.useCallback(() => {
    closeBackupOnboarding();
    openBackupScreen();
  }, [closeBackupOnboarding]);
```

Replace it entirely with:

```tsx
  const closeBiometricOnboarding = React.useCallback(() => {
    markBiometricOnboardingSeen();
    setHasSeenBiometricOnboardingState(true);
    setVisibleOnboardingModal(null);
    if (Platform.OS === 'android') {
      // Android's Modal never fires `onDismiss`, and there's no risk of two
      // <Modal>s overlapping there, so unblock the next modal's handoff
      // right away.
      setOnboardingHandoffReady(true);
    }
  }, []);
  const handleBiometricOnboardingDismissed = React.useCallback(() => {
    // iOS-only: fires once the biometric modal's dismiss animation actually
    // completes, so the next onboarding modal is safe to mount afterward.
    setOnboardingHandoffReady(true);
  }, []);
  const closeBackupOnboarding = React.useCallback(() => {
    markBackupOnboardingSeen();
    setHasSeenBackupOnboardingState(true);
    setVisibleOnboardingModal(null);
  }, []);
  const closeReminderOnboarding = React.useCallback(() => {
    markReminderOnboardingSeen();
    setHasSeenReminderOnboardingState(true);
    setVisibleOnboardingModal(null);
    if (Platform.OS === 'android') {
      setOnboardingHandoffReady(true);
    }
  }, []);
  const handleReminderOnboardingDismissed = React.useCallback(() => {
    setOnboardingHandoffReady(true);
  }, []);
  const openBackupFromOnboarding = React.useCallback(() => {
    closeBackupOnboarding();
    openBackupScreen();
  }, [closeBackupOnboarding]);
```

(Backup does not get its own `onDismiss` handler — nothing currently follows it in
the priority order, so there is no next modal waiting on its handoff gate. Its close
handler still clears `visibleOnboardingModal` so the state stays consistent if a
future modal is ever added after it.)

- [ ] **Step 6: Render the new modal and update the `listHeader` dependency array**

Find this existing block (currently lines 336-346):

```tsx
        <BackupOnboardingModal
          visible={isBackupOnboardingVisible}
          dreamCount={dreams.length}
          onClose={closeBackupOnboarding}
          onOpenBackup={openBackupFromOnboarding}
        />
        <ReminderOnboardingModal
          visible={isReminderOnboardingVisible}
          onClose={closeReminderOnboarding}
          onDismiss={handleReminderOnboardingDismissed}
        />
```

Replace it entirely with:

```tsx
        <BiometricOnboardingModal
          visible={isBiometricOnboardingVisible}
          onClose={closeBiometricOnboarding}
          onDismiss={handleBiometricOnboardingDismissed}
        />
        <ReminderOnboardingModal
          visible={isReminderOnboardingVisible}
          onClose={closeReminderOnboarding}
          onDismiss={handleReminderOnboardingDismissed}
        />
        <BackupOnboardingModal
          visible={isBackupOnboardingVisible}
          dreamCount={dreams.length}
          onClose={closeBackupOnboarding}
          onOpenBackup={openBackupFromOnboarding}
        />
```

Find this existing dependency array (currently lines 349-366, the `listHeader`
`useMemo`'s second argument):

```tsx
    [
      closeBackupOnboarding,
      closeReminderOnboarding,
      copy,
      dreams.length,
      handleReminderOnboardingDismissed,
      homeFeedCopy.openArchiveAction,
      isBackupOnboardingVisible,
      isReminderOnboardingVisible,
      openArchive,
      openBackupFromOnboarding,
      openDreamDetail,
      heroPrompt,
      insets.top,
      styles,
      theme.spacing.sm,
      timeline,
    ],
```

Replace it entirely with:

```tsx
    [
      closeBackupOnboarding,
      closeBiometricOnboarding,
      closeReminderOnboarding,
      copy,
      dreams.length,
      handleBiometricOnboardingDismissed,
      handleReminderOnboardingDismissed,
      homeFeedCopy.openArchiveAction,
      isBackupOnboardingVisible,
      isBiometricOnboardingVisible,
      isReminderOnboardingVisible,
      openArchive,
      openBackupFromOnboarding,
      openDreamDetail,
      heroPrompt,
      insets.top,
      styles,
      theme.spacing.sm,
      timeline,
    ],
```

- [ ] **Step 7: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint src/features/dreams/screens/HomeScreen.tsx`
Expected: no errors, including no `react-hooks/exhaustive-deps` warnings on the
`listHeader` `useMemo` or the new `useEffect`.

- [ ] **Step 8: Run the full test suite for regressions**

Run: `npx jest`
Expected: PASS — same suite/test count as after Task 2 (this task changes no test
files; `HomeScreen.tsx` has no existing render test, per the reminder slice's final
review, so there's no direct-coverage regression to check here beyond compilation
and the full suite staying green).

- [ ] **Step 9: Commit**

```bash
git add src/features/dreams/screens/HomeScreen.tsx
git commit -m "feat: surface biometric onboarding on Home, ahead of reminder and backup"
```
