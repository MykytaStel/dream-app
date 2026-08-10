# Reminder Contextual Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a one-time modal after the first saved dream offering to enable daily
reminders, using the exact same seen-flag/threshold pattern already proven by backup
onboarding, and the exact same permission-request-then-apply sequence already proven
by the Settings screen's manual reminder toggle.

**Architecture:** Three files mirror `backupOnboarding.ts` /
`backupOnboardingService.ts` / `BackupOnboardingModal.tsx` exactly: a pure decision
function, a storage-backed seen flag, and a self-contained modal that owns its own
enable flow (request permission → apply settings → close) rather than delegating that
back to `HomeScreen.tsx`. `HomeScreen.tsx` gains one more state/memo pair plus a
one-line change to `isBackupOnboardingVisible` so the two modals never render at once.

**Tech Stack:** React Native, TypeScript, `@shopify/restyle` theming,
`@notifee/react-native` (via the existing `dreamReminderService.ts`), Jest.

## Global Constraints

- Full design: `docs/superpowers/specs/2026-08-10-reminder-contextual-onboarding-design.md`.
- Threshold is **1 dream**, not backup's 3 — `REMINDER_ONBOARDING_DREAM_THRESHOLD = 1`.
- The modal's enable flow reuses `requestReminderPermission`,
  `applyDreamReminderSettings`, `DEFAULT_REMINDER_SETTINGS` from
  `src/features/reminders/services/dreamReminderService.ts` and
  `trackReminderToggled` from `src/services/observability/events.ts` — all four
  already exist and are unchanged by this plan. Do not write new permission-handling
  logic.
- Reuse the existing copy keys `reminderPermissionDeniedTitle` /
  `reminderPermissionDeniedDescription` (`src/constants/copy/settings.ts`) for the
  denial alert — do not add new ones for this.
- Enabling always uses `DEFAULT_REMINDER_SETTINGS` (7:30, `'balanced'` style) with
  `enabled: true` — no time/style picker in this modal.
- On permission denial: show the alert, leave the modal open (do not call `onClose`)
  so the user dismisses it themselves via "Not now" — do not auto-close.
- `HomeScreen.tsx`'s `isBackupOnboardingVisible` must gain
  `&& !isReminderOnboardingVisible` so the two modals never render simultaneously.
  Reminder's visibility is computed first; backup's memo depends on it.
- Do not build biometric or Whisper contextual onboarding, a preview/debug screen for
  this modal, or reminder time/style customization from the modal — all explicitly
  out of scope per the spec.
- Do not add `Co-Authored-By` trailers to commits.

---

## Task 1: Seen-flag storage, pure decision function, and their test

**Files:**
- Create: `src/features/reminders/model/reminderOnboarding.ts`
- Create: `src/features/reminders/services/reminderOnboardingService.ts`
- Modify: `src/services/storage/keys.ts` (add one constant near line 25)
- Test: `__tests__/reminderOnboarding.test.ts`

**Interfaces:**
- Produces: `REMINDER_ONBOARDING_DREAM_THRESHOLD = 1`,
  `shouldShowReminderOnboarding({ dreamCount: number; hasSeen: boolean; forceVisible?: boolean }): boolean`.
- Produces: `hasSeenReminderOnboarding(): boolean`,
  `markReminderOnboardingSeen(): void`, `resetReminderOnboardingSeen(): void`.
- Produces: `REMINDER_ONBOARDING_SEEN_KEY` constant, consumed only inside the new
  service file.
- Task 3 imports all of the above.

- [ ] **Step 1: Write the failing test**

Create `__tests__/reminderOnboarding.test.ts`:

```ts
import {
  REMINDER_ONBOARDING_DREAM_THRESHOLD,
  shouldShowReminderOnboarding,
} from '../src/features/reminders/model/reminderOnboarding';
import {
  hasSeenReminderOnboarding,
  markReminderOnboardingSeen,
  resetReminderOnboardingSeen,
} from '../src/features/reminders/services/reminderOnboardingService';

describe('reminder onboarding', () => {
  beforeEach(() => {
    resetReminderOnboardingSeen();
  });

  it('stays hidden below the threshold', () => {
    expect(
      shouldShowReminderOnboarding({
        dreamCount: REMINDER_ONBOARDING_DREAM_THRESHOLD - 1,
        hasSeen: false,
      }),
    ).toBe(false);
  });

  it('opens at the threshold when unseen', () => {
    expect(
      shouldShowReminderOnboarding({
        dreamCount: REMINDER_ONBOARDING_DREAM_THRESHOLD,
        hasSeen: false,
      }),
    ).toBe(true);
  });

  it('stays hidden after it was seen', () => {
    expect(
      shouldShowReminderOnboarding({
        dreamCount: REMINDER_ONBOARDING_DREAM_THRESHOLD + 4,
        hasSeen: true,
      }),
    ).toBe(false);
  });

  it('can be force-opened in preview mode', () => {
    expect(
      shouldShowReminderOnboarding({
        dreamCount: 0,
        hasSeen: true,
        forceVisible: true,
      }),
    ).toBe(true);
  });

  it('persists the seen flag', () => {
    expect(hasSeenReminderOnboarding()).toBe(false);

    markReminderOnboardingSeen();

    expect(hasSeenReminderOnboarding()).toBe(true);

    resetReminderOnboardingSeen();

    expect(hasSeenReminderOnboarding()).toBe(false);
  });
});
```

This is the same shape as the existing `__tests__/backupOnboarding.test.ts`, values
changed for a threshold of 1.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/reminderOnboarding.test.ts`
Expected: FAIL — both imported modules do not exist yet (`Cannot find module`).

- [ ] **Step 3: Add the storage key constant**

In `src/services/storage/keys.ts`, find this existing line (around line 25):

```ts
export const BACKUP_ONBOARDING_SEEN_KEY = 'backup-onboarding-seen';
```

Add immediately after it:

```ts
export const REMINDER_ONBOARDING_SEEN_KEY = 'reminder-onboarding-seen';
```

- [ ] **Step 4: Create the pure decision function**

Create `src/features/reminders/model/reminderOnboarding.ts`:

```ts
export const REMINDER_ONBOARDING_DREAM_THRESHOLD = 1;

type ShouldShowReminderOnboardingArgs = {
  dreamCount: number;
  hasSeen: boolean;
  forceVisible?: boolean;
};

export function shouldShowReminderOnboarding({
  dreamCount,
  hasSeen,
  forceVisible = false,
}: ShouldShowReminderOnboardingArgs) {
  if (forceVisible) {
    return true;
  }

  return !hasSeen && dreamCount >= REMINDER_ONBOARDING_DREAM_THRESHOLD;
}
```

- [ ] **Step 5: Create the storage service**

Create `src/features/reminders/services/reminderOnboardingService.ts`:

```ts
import { REMINDER_ONBOARDING_SEEN_KEY } from '../../../services/storage/keys';
import { kv } from '../../../services/storage/mmkv';

export function hasSeenReminderOnboarding() {
  return kv.getBoolean(REMINDER_ONBOARDING_SEEN_KEY) === true;
}

export function markReminderOnboardingSeen() {
  kv.set(REMINDER_ONBOARDING_SEEN_KEY, true);
}

export function resetReminderOnboardingSeen() {
  kv.remove(REMINDER_ONBOARDING_SEEN_KEY);
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx jest __tests__/reminderOnboarding.test.ts`
Expected: PASS — 5 tests.

- [ ] **Step 7: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint src/services/storage/keys.ts src/features/reminders/model/reminderOnboarding.ts src/features/reminders/services/reminderOnboardingService.ts __tests__/reminderOnboarding.test.ts`
Expected: no errors, no warnings.

- [ ] **Step 8: Commit**

```bash
git add src/services/storage/keys.ts src/features/reminders/model/reminderOnboarding.ts src/features/reminders/services/reminderOnboardingService.ts __tests__/reminderOnboarding.test.ts
git commit -m "feat: add reminder onboarding seen-flag and decision logic"
```

---

## Task 2: Copy and the `ReminderOnboardingModal` component

**Files:**
- Modify: `src/constants/copy/settings.ts` (five new keys, both `SETTINGS_COPY_EN`
  and `SETTINGS_COPY_UK`)
- Create: `src/features/reminders/components/ReminderOnboardingModal.tsx`

**Interfaces:**
- Consumes: `requestReminderPermission`, `applyDreamReminderSettings`,
  `DEFAULT_REMINDER_SETTINGS` from
  `src/features/reminders/services/dreamReminderService.ts` (existing, unchanged);
  `trackReminderToggled` from `src/services/observability/events.ts` (existing,
  unchanged); `SettingsCopy` type and `reminderPermissionDeniedTitle`/
  `reminderPermissionDeniedDescription` from `src/constants/copy/settings.ts`
  (existing, unchanged).
- Produces: `ReminderOnboardingModal({ visible, onClose }): JSX.Element` — a named
  export. Task 3 renders it from `HomeScreen.tsx`, passing
  `isReminderOnboardingVisible` as `visible` and `closeReminderOnboarding` as
  `onClose`.

This task has no dedicated unit test — matching this codebase's established
convention for presentational sheet/modal components (`BackupOnboardingModal.tsx`,
`ArchiveKeyStrandedModal.tsx` have none either); correctness is verified by
typecheck, lint, the repo-wide `__tests__/themeTokens.test.ts` (fails on any
hardcoded colour literal), and the manual check in Task 3's Step 6.

Visual note: this modal is intentionally leaner than `BackupOnboardingModal.tsx` —
no stat-row (dream count vs. threshold chips), no value-card, no ambient glow
decorations. Just the hero row (icon + eyebrow/title/description) and two actions,
per the spec's "leaner than backup" framing. Don't add these back in.

- [ ] **Step 1: Add the copy keys to `SETTINGS_COPY_EN`**

In `src/constants/copy/settings.ts`, find this existing line (around line 243-244):

```ts
  backupOnboardingPreviewFootnote:
    'In production this modal opens once after the archive reaches 3 saved dreams.',
```

Add immediately after it (before `backupScreenTitle:`):

```ts
  reminderOnboardingEyebrow: 'Build the habit',
  reminderOnboardingTitle: 'A nightly nudge to write it down',
  reminderOnboardingDescription:
    'A gentle reminder before your usual wake time — never demanding, and easy to turn off.',
  reminderOnboardingPrimaryAction: 'Enable reminders',
  reminderOnboardingLaterAction: 'Not now',
```

- [ ] **Step 2: Add the copy keys to `SETTINGS_COPY_UK`**

In the same file, find the uk equivalent (around line 842-843):

```ts
  backupOnboardingPreviewFootnote:
    'У production цей modal відкривається один раз після 3 збережених снів.',
```

Add immediately after it (before `backupScreenTitle:`):

```ts
  reminderOnboardingEyebrow: 'Формуй звичку',
  reminderOnboardingTitle: 'Нагадування записати сон',
  reminderOnboardingDescription:
    'М’яке нагадування перед звичним часом пробудження — ніколи не вимагає, і його легко вимкнути.',
  reminderOnboardingPrimaryAction: 'Увімкнути нагадування',
  reminderOnboardingLaterAction: 'Не зараз',
```

- [ ] **Step 3: Typecheck the copy change alone**

Run: `npx tsc --noEmit`
Expected: no errors. (`SETTINGS_COPY_UK` is typed `: typeof SETTINGS_COPY_EN`, so a
key mismatch between the two objects is a compile error here, before the component
that uses them exists.)

- [ ] **Step 4: Create the modal component**

Create `src/features/reminders/components/ReminderOnboardingModal.tsx`:

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
  applyDreamReminderSettings,
  DEFAULT_REMINDER_SETTINGS,
  requestReminderPermission,
} from '../services/dreamReminderService';
import { trackReminderToggled } from '../../../services/observability/events';

type ReminderOnboardingModalProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Owns its own enable flow end to end — request permission, apply the default
 * schedule, track it — so `HomeScreen.tsx` only has to pass `visible`/`onClose`,
 * the same shape every other onboarding modal in this codebase uses.
 */
export function ReminderOnboardingModal({
  visible,
  onClose,
}: ReminderOnboardingModalProps) {
  const { locale } = useI18n();
  const copy = React.useMemo(() => getSettingsCopy(locale), [locale]);
  const theme = useTheme<Theme>();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(
    () => createStyles(theme, insets.bottom),
    [insets.bottom, theme],
  );

  const onEnable = React.useCallback(async () => {
    const allowed = await requestReminderPermission();
    if (!allowed) {
      // Leave the modal open — the user dismisses it themselves via "Not
      // now". Auto-closing here would stack a modal-dismiss animation under
      // the OS alert the user hasn't dismissed yet.
      Alert.alert(
        copy.reminderPermissionDeniedTitle,
        copy.reminderPermissionDeniedDescription,
      );
      return;
    }

    await applyDreamReminderSettings({
      ...DEFAULT_REMINDER_SETTINGS,
      enabled: true,
    });
    trackReminderToggled({ enabled: true });
    onClose();
  }, [copy, onClose]);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* The backdrop is a dismiss target, and without a label a screen
            reader announces an unnamed button covering the whole screen. */}
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={copy.reminderOnboardingLaterAction}
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
                  name="notifications-outline"
                  size={22}
                  color={theme.colors.onPrimary}
                />
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.eyebrow}>
                  {copy.reminderOnboardingEyebrow}
                </Text>
                <Text style={styles.title}>
                  {copy.reminderOnboardingTitle}
                </Text>
                <Text style={styles.description}>
                  {copy.reminderOnboardingDescription}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Button
                title={copy.reminderOnboardingPrimaryAction}
                onPress={() => {
                  onEnable().catch(() => undefined);
                }}
                icon="notifications-outline"
                size="md"
              />
              <Button
                title={copy.reminderOnboardingLaterAction}
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

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint src/constants/copy/settings.ts src/features/reminders/components/ReminderOnboardingModal.tsx`
Expected: no errors, no warnings.

- [ ] **Step 6: Confirm the theme-tokens check still passes**

Run: `npx jest __tests__/themeTokens.test.ts`
Expected: PASS — all tests, confirming the new component has no hardcoded colour
literal (it uses `theme.colors.scrim`/`theme.colors.text`/etc. throughout, matching
the tokens this codebase's design-token work already established).

- [ ] **Step 7: Commit**

```bash
git add src/constants/copy/settings.ts src/features/reminders/components/ReminderOnboardingModal.tsx
git commit -m "feat: add reminder onboarding copy and modal"
```

---

## Task 3: Wire the modal into `HomeScreen`, sequenced against backup

**Files:**
- Modify: `src/features/dreams/screens/HomeScreen.tsx`

**Interfaces:**
- Consumes: `shouldShowReminderOnboarding`,
  `hasSeenReminderOnboarding`/`markReminderOnboardingSeen` from Task 1;
  `ReminderOnboardingModal` from Task 2.

- [ ] **Step 1: Add the imports**

In `src/features/dreams/screens/HomeScreen.tsx`, find these existing imports (around
line 44-49):

```ts
import { BackupOnboardingModal } from '../../settings/components/BackupOnboardingModal';
import { shouldShowBackupOnboarding } from '../../settings/model/backupOnboarding';
import {
  hasSeenBackupOnboarding,
  markBackupOnboardingSeen,
} from '../../settings/services/backupOnboardingService';
```

Add immediately after them:

```ts
import { ReminderOnboardingModal } from '../../reminders/components/ReminderOnboardingModal';
import { shouldShowReminderOnboarding } from '../../reminders/model/reminderOnboarding';
import {
  hasSeenReminderOnboarding,
  markReminderOnboardingSeen,
} from '../../reminders/services/reminderOnboardingService';
```

- [ ] **Step 2: Add the seen-state**

Find this existing line (around line 108-109):

```ts
  const [hasSeenBackupOnboardingState, setHasSeenBackupOnboardingState] =
    React.useState(() => hasSeenBackupOnboarding());
```

Add immediately after it:

```ts
  const [hasSeenReminderOnboardingState, setHasSeenReminderOnboardingState] =
    React.useState(() => hasSeenReminderOnboarding());
```

- [ ] **Step 3: Refresh reminder state alongside backup's**

Find this existing block (around line 186-188):

```ts
  const refreshOnboardingState = React.useCallback(() => {
    setHasSeenBackupOnboardingState(hasSeenBackupOnboarding());
  }, []);
```

Replace with:

```ts
  const refreshOnboardingState = React.useCallback(() => {
    setHasSeenBackupOnboardingState(hasSeenBackupOnboarding());
    setHasSeenReminderOnboardingState(hasSeenReminderOnboarding());
  }, []);
```

- [ ] **Step 4: Sequence the two visibility memos**

Find this existing block (around line 194-202):

```ts
  const isBackupOnboardingVisible = React.useMemo(
    () =>
      !loading &&
      shouldShowBackupOnboarding({
        dreamCount: dreams.length,
        hasSeen: hasSeenBackupOnboardingState,
      }),
    [dreams.length, hasSeenBackupOnboardingState, loading],
  );
```

Replace with (reminder's memo added first, backup's gains one more condition and one
more dependency):

```ts
  const isReminderOnboardingVisible = React.useMemo(
    () =>
      !loading &&
      shouldShowReminderOnboarding({
        dreamCount: dreams.length,
        hasSeen: hasSeenReminderOnboardingState,
      }),
    [dreams.length, hasSeenReminderOnboardingState, loading],
  );
  const isBackupOnboardingVisible = React.useMemo(
    () =>
      !loading &&
      !isReminderOnboardingVisible &&
      shouldShowBackupOnboarding({
        dreamCount: dreams.length,
        hasSeen: hasSeenBackupOnboardingState,
      }),
    [
      dreams.length,
      hasSeenBackupOnboardingState,
      isReminderOnboardingVisible,
      loading,
    ],
  );
```

- [ ] **Step 5: Add the close handler**

Find this existing block (around line 236-239):

```ts
  const closeBackupOnboarding = React.useCallback(() => {
    markBackupOnboardingSeen();
    setHasSeenBackupOnboardingState(true);
  }, []);
```

Add immediately after it:

```ts
  const closeReminderOnboarding = React.useCallback(() => {
    markReminderOnboardingSeen();
    setHasSeenReminderOnboardingState(true);
  }, []);
```

- [ ] **Step 6: Render the modal and update the `listHeader` memo's dependencies**

Find this existing JSX (around line 273-278):

```tsx
        <BackupOnboardingModal
          visible={isBackupOnboardingVisible}
          dreamCount={dreams.length}
          onClose={closeBackupOnboarding}
          onOpenBackup={openBackupFromOnboarding}
        />
```

Add immediately after it:

```tsx
        <ReminderOnboardingModal
          visible={isReminderOnboardingVisible}
          onClose={closeReminderOnboarding}
        />
```

Then find the `listHeader` `useMemo`'s dependency array, immediately after the JSX
above:

```ts
    [
      closeBackupOnboarding,
      copy,
      dreams.length,
      homeFeedCopy.openArchiveAction,
      isBackupOnboardingVisible,
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

Replace with (two entries added, alphabetical position next to their backup
counterparts, nothing else changed):

```ts
    [
      closeBackupOnboarding,
      closeReminderOnboarding,
      copy,
      dreams.length,
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

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. React's `exhaustive-deps` lint rule (next step) is the real
check on the dependency array edit above — a missing dependency is a lint warning,
not a type error, so don't skip Step 8 because this step is clean.

- [ ] **Step 8: Lint**

Run: `npx eslint src/features/dreams/screens/HomeScreen.tsx`
Expected: no errors, no warnings. If `react-hooks/exhaustive-deps` flags the
`listHeader` memo, it means Step 6's dependency-array edit missed an entry — add
whatever it names, don't disable the rule.

- [ ] **Step 9: Full test suite**

Run: `npx jest`
Expected: PASS — every suite, including the new `reminderOnboarding.test.ts` from
Task 1. No existing test references `isBackupOnboardingVisible` or
`BackupOnboardingModal` (checked while writing the design spec), so the sequencing
change has nothing existing to break.

- [ ] **Step 10: Manual verification**

1. Clear app storage (or reinstall) and launch the app.
2. Save one dream. Return to (or stay on) the Home tab. Confirm the reminder modal
   appears — not the backup one, since `dreams.length` is 1.
3. Tap "Enable reminders." Confirm the OS notification-permission prompt appears.
   Approve it. Confirm the modal closes and, in Settings → Reminders
   (`SettingsRemindersScreen.tsx`), reminders show enabled at 07:30, style
   "balanced."
4. Reinstall/clear storage again, save one dream, open the reminder modal, tap
   "Enable reminders," and this time deny the OS permission prompt. Confirm the
   in-app alert (`copy.reminderPermissionDeniedTitle`) appears and the modal is
   still open underneath afterward (not auto-closed) — dismiss it via "Not now" and
   confirm the app doesn't crash or get stuck.
5. Reinstall/clear storage again, save one dream, tap "Not now" (or tap the
   backdrop). Confirm the modal doesn't reappear on a later app open.
6. Reinstall/clear storage again, save one dream, and — without interacting with the
   reminder modal — background the app (or otherwise leave it un-dismissed), then
   save two more dreams to reach three total, and reopen Home. Confirm only the
   reminder modal is visible (not both modals stacked). Dismiss it via "Not now,"
   reopen Home again, and confirm the backup modal now appears on its own.
7. Repeat step 2-3 in `uk` locale and in both light and dark theme, confirming copy
   and contrast both hold.

- [ ] **Step 11: Commit**

```bash
git add src/features/dreams/screens/HomeScreen.tsx
git commit -m "feat: surface reminder onboarding on Home, sequenced ahead of backup"
```
