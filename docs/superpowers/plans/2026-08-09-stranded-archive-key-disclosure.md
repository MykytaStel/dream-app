# Stranded Archive Key Disclosure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make it impossible to miss, the first time it becomes true, that this
device's archive key cannot travel on its own — replacing a quiet Settings row with a
one-time modal on `BackupScreen`.

**Architecture:** A pure decision function (`shouldShowArchiveKeyStrandedDisclosure`) and
a storage-backed "seen" flag, both mirroring the existing `backupOnboarding` model/service
split exactly. `useArchiveKeyController` derives `showStrandedDisclosure` from the
existing `presentArchiveKey()` output plus that flag, and exposes one dismiss handler.
A new `ArchiveKeyStrandedModal` component, built the same way every other sheet in this
codebase is (its own `<Modal>`, no shared primitive), renders when that boolean is true
and fetches the recovery code itself.

**Tech Stack:** React Native, TypeScript, `@shopify/restyle` theming, MMKV (`kv`) for
storage, Jest + `@testing-library/react-native` for tests.

## Global Constraints

- Full design: `docs/superpowers/specs/2026-08-09-stranded-archive-key-disclosure-design.md`.
- Does **not** change `getKeySyncAvailability()`'s detection logic. Consumes
  `presentArchiveKey()`'s existing `tone: 'attention'` output as-is.
- Does **not** gate `onToggleCloudSync` or any part of the sync-enable flow. This is
  informational only, never blocks or delays anything.
- Scoped to `BackupScreen` only — no app-root or Home-level surface.
- Every dismissal path (button, backdrop, hardware back) marks the disclosure seen.
  There is no "remind me later."
- No hardcoded color literals — theme tokens only (`theme.colors.*`), enforced
  repo-wide by `__tests__/themeTokens.test.ts`.
- New copy keys go in both `SETTINGS_COPY_EN` and `SETTINGS_COPY_UK` in
  `src/constants/copy/settings.ts` — the uk object is typed `typeof SETTINGS_COPY_EN`,
  so a missing key is a compile error, not a runtime gap.
- Follow existing file patterns exactly: `src/features/settings/model/backupOnboarding.ts`
  + `src/features/settings/services/backupOnboardingService.ts` for the pure-logic/
  storage split, `src/features/dreams/components/archive/ArchiveFilterSheet.tsx` for the
  `<Modal>` structure.
- Do not add `Co-Authored-By` trailers to commits.
- 2-space indentation, single quotes, trailing commas — match surrounding code exactly.

---

## Task 1: Seen-flag storage key, pure decision function, storage service

**Files:**
- Modify: `src/services/storage/keys.ts` (add one constant near line 25)
- Create: `src/features/settings/model/archiveKeyStrandedDisclosure.ts`
- Create: `src/features/settings/services/archiveKeyStrandedDisclosureService.ts`
- Test: `__tests__/archiveKeyStrandedDisclosure.test.ts`

**Interfaces:**
- Produces: `ArchiveKeyStrandedDisclosureArgs = { tone: ArchiveKeyTone; hasSeen: boolean }`
  and `shouldShowArchiveKeyStrandedDisclosure(args): boolean` — `ArchiveKeyTone` is
  imported from `src/features/settings/model/archiveKeyPresentation.ts`, already exported
  there as `export type ArchiveKeyTone = 'quiet' | 'attention' | 'blocking'`.
- Produces: `hasSeenArchiveKeyStrandedDisclosure(): boolean`,
  `markArchiveKeyStrandedDisclosureSeen(): void`,
  `resetArchiveKeyStrandedDisclosureSeen(): void` — Task 2 and Task 3 both import from
  this service.
- Produces: `ARCHIVE_KEY_STRANDED_DISCLOSURE_SEEN_KEY` constant, consumed only inside
  the new service file.

- [ ] **Step 1: Write the failing test**

Create `__tests__/archiveKeyStrandedDisclosure.test.ts`:

```ts
import { shouldShowArchiveKeyStrandedDisclosure } from '../src/features/settings/model/archiveKeyStrandedDisclosure';
import {
  hasSeenArchiveKeyStrandedDisclosure,
  markArchiveKeyStrandedDisclosureSeen,
  resetArchiveKeyStrandedDisclosureSeen,
} from '../src/features/settings/services/archiveKeyStrandedDisclosureService';

describe('archive key stranded disclosure', () => {
  beforeEach(() => {
    resetArchiveKeyStrandedDisclosureSeen();
  });

  it('shows when the key is stranded and unseen', () => {
    expect(
      shouldShowArchiveKeyStrandedDisclosure({
        tone: 'attention',
        hasSeen: false,
      }),
    ).toBe(true);
  });

  it('stays hidden once seen', () => {
    expect(
      shouldShowArchiveKeyStrandedDisclosure({
        tone: 'attention',
        hasSeen: true,
      }),
    ).toBe(false);
  });

  it('stays hidden for every other tone, seen or not', () => {
    expect(
      shouldShowArchiveKeyStrandedDisclosure({ tone: 'quiet', hasSeen: false }),
    ).toBe(false);
    expect(
      shouldShowArchiveKeyStrandedDisclosure({
        tone: 'blocking',
        hasSeen: false,
      }),
    ).toBe(false);
  });

  it('persists the seen flag', () => {
    expect(hasSeenArchiveKeyStrandedDisclosure()).toBe(false);

    markArchiveKeyStrandedDisclosureSeen();

    expect(hasSeenArchiveKeyStrandedDisclosure()).toBe(true);

    resetArchiveKeyStrandedDisclosureSeen();

    expect(hasSeenArchiveKeyStrandedDisclosure()).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/archiveKeyStrandedDisclosure.test.ts`
Expected: FAIL — both imported modules do not exist yet (`Cannot find module`).

- [ ] **Step 3: Add the storage key constant**

In `src/services/storage/keys.ts`, find this existing line (around line 25):

```ts
export const BACKUP_ONBOARDING_SEEN_KEY = 'backup-onboarding-seen';
```

Add immediately after it:

```ts
export const ARCHIVE_KEY_STRANDED_DISCLOSURE_SEEN_KEY =
  'archive-key-stranded-disclosure-seen';
```

- [ ] **Step 4: Create the pure decision function**

Create `src/features/settings/model/archiveKeyStrandedDisclosure.ts`:

```ts
import type { ArchiveKeyTone } from './archiveKeyPresentation';

type ShouldShowArchiveKeyStrandedDisclosureArgs = {
  tone: ArchiveKeyTone;
  hasSeen: boolean;
};

export function shouldShowArchiveKeyStrandedDisclosure({
  tone,
  hasSeen,
}: ShouldShowArchiveKeyStrandedDisclosureArgs) {
  return tone === 'attention' && !hasSeen;
}
```

- [ ] **Step 5: Create the storage service**

Create `src/features/settings/services/archiveKeyStrandedDisclosureService.ts`:

```ts
import { ARCHIVE_KEY_STRANDED_DISCLOSURE_SEEN_KEY } from '../../../services/storage/keys';
import { kv } from '../../../services/storage/mmkv';

export function hasSeenArchiveKeyStrandedDisclosure() {
  return kv.getBoolean(ARCHIVE_KEY_STRANDED_DISCLOSURE_SEEN_KEY) === true;
}

export function markArchiveKeyStrandedDisclosureSeen() {
  kv.set(ARCHIVE_KEY_STRANDED_DISCLOSURE_SEEN_KEY, true);
}

export function resetArchiveKeyStrandedDisclosureSeen() {
  kv.remove(ARCHIVE_KEY_STRANDED_DISCLOSURE_SEEN_KEY);
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx jest __tests__/archiveKeyStrandedDisclosure.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 7: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint src/services/storage/keys.ts src/features/settings/model/archiveKeyStrandedDisclosure.ts src/features/settings/services/archiveKeyStrandedDisclosureService.ts __tests__/archiveKeyStrandedDisclosure.test.ts`
Expected: no errors, no warnings.

- [ ] **Step 8: Commit**

```bash
git add src/services/storage/keys.ts src/features/settings/model/archiveKeyStrandedDisclosure.ts src/features/settings/services/archiveKeyStrandedDisclosureService.ts __tests__/archiveKeyStrandedDisclosure.test.ts
git commit -m "feat: add stranded archive key disclosure seen-flag and decision logic"
```

---

## Task 2: Wire disclosure state into `useArchiveKeyController`

**Files:**
- Modify: `src/features/settings/hooks/useArchiveKeyController.ts`
- Test: `__tests__/useArchiveKeyController.behaviour.test.ts` (new)

**Interfaces:**
- Consumes: `shouldShowArchiveKeyStrandedDisclosure({ tone, hasSeen }): boolean` from
  Task 1's `src/features/settings/model/archiveKeyStrandedDisclosure.ts`;
  `hasSeenArchiveKeyStrandedDisclosure` and `markArchiveKeyStrandedDisclosureSeen` from
  Task 1's `src/features/settings/services/archiveKeyStrandedDisclosureService.ts`.
- Consumes: the hook's own existing `presentation` (type `ArchiveKeyPresentation`,
  already has a `tone: ArchiveKeyTone` field — no change needed to
  `archiveKeyPresentation.ts`).
- Produces: two new fields on the hook's return object —
  `showStrandedDisclosure: boolean` and `onDismissStrandedDisclosure: () => void`.
  Task 3's `ArchiveKeyStrandedModal` is driven by these; Task 4 wires them from
  `BackupScreen.tsx`.

The full current file (for reference — modify in place, do not rewrite unrelated
parts):

```ts
import React from 'react';
import {
  getArchiveKey,
  getArchiveRecoveryCode,
  importArchiveKeyFromRecoveryCode,
} from '../../../services/crypto/archiveKeyService';
import {
  getKeySyncAvailability,
  type KeySyncAvailability,
} from '../../../services/security/archiveKeyStorage';
import { isRecoveryCodeValid } from '../../../services/crypto/recoveryCode';
import { presentArchiveKey } from '../model/archiveKeyPresentation';
import { reportError } from '../../../services/observability/errorReporting';

const UNKNOWN_AVAILABILITY: KeySyncAvailability = {
  status: 'unavailable',
  reason: 'not-checked-yet',
};

export function useArchiveKeyController(lastSyncErrorMessage?: string) {
  const [availability, setAvailability] =
    React.useState<KeySyncAvailability>(UNKNOWN_AVAILABILITY);
  const [hasKey, setHasKey] = React.useState(false);
  const [recoveryCode, setRecoveryCode] = React.useState<string | null>(null);
  const [enteredCode, setEnteredCode] = React.useState('');
  const [entryFeedback, setEntryFeedback] = React.useState<
    'invalid' | 'accepted' | null
  >(null);
  const [isCheckingKey, setIsCheckingKey] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      const [nextAvailability, key] = await Promise.all([
        getKeySyncAvailability(),
        getArchiveKey(),
      ]);

      setAvailability(nextAvailability);
      setHasKey(Boolean(key));
    } catch (error) {
      reportError(error, { event: 'archive_key_status_failed' });
    } finally {
      setIsCheckingKey(false);
    }
  }, []);

  React.useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  // ...onToggleRecoveryCode, onSubmitRecoveryCode, onChangeEnteredCode unchanged...

  const presentation = React.useMemo(
    () => presentArchiveKey({ availability, hasKey, lastSyncErrorMessage }),
    [availability, hasKey, lastSyncErrorMessage],
  );

  return {
    presentation,
    isCheckingKey,
    recoveryCode,
    enteredCode,
    entryFeedback,
    onToggleRecoveryCode,
    onChangeEnteredCode,
    onSubmitRecoveryCode,
  };
}
```

- [ ] **Step 1: Write the failing test**

Create `__tests__/useArchiveKeyController.behaviour.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react-native';

const mockGetArchiveKey = jest.fn();
const mockGetArchiveRecoveryCode = jest.fn();
const mockImportArchiveKeyFromRecoveryCode = jest.fn();
const mockGetKeySyncAvailability = jest.fn();
const mockHasSeen = jest.fn();
const mockMarkSeen = jest.fn();

jest.mock('../src/services/crypto/archiveKeyService', () => ({
  // presentArchiveKey() imports this from the same module and compares it
  // against lastSyncErrorMessage; omitting it leaves both sides undefined,
  // which spuriously matches and forces tone 'blocking' in every test.
  ARCHIVE_KEY_REQUIRED: 'archive-key-required',
  getArchiveKey: (...args: unknown[]) => mockGetArchiveKey(...args),
  getArchiveRecoveryCode: (...args: unknown[]) =>
    mockGetArchiveRecoveryCode(...args),
  importArchiveKeyFromRecoveryCode: (...args: unknown[]) =>
    mockImportArchiveKeyFromRecoveryCode(...args),
}));

jest.mock('../src/services/security/archiveKeyStorage', () => ({
  getKeySyncAvailability: (...args: unknown[]) =>
    mockGetKeySyncAvailability(...args),
}));

jest.mock(
  '../src/features/settings/services/archiveKeyStrandedDisclosureService',
  () => ({
    hasSeenArchiveKeyStrandedDisclosure: () => mockHasSeen(),
    markArchiveKeyStrandedDisclosureSeen: () => mockMarkSeen(),
  }),
);

const {
  useArchiveKeyController,
} = require('../src/features/settings/hooks/useArchiveKeyController');

beforeEach(() => {
  mockGetArchiveKey.mockReset().mockResolvedValue(new Uint8Array([1]));
  mockGetArchiveRecoveryCode.mockReset();
  mockImportArchiveKeyFromRecoveryCode.mockReset();
  mockGetKeySyncAvailability
    .mockReset()
    .mockResolvedValue({ status: 'unavailable', reason: 'device-backup-off' });
  mockHasSeen.mockReset().mockReturnValue(false);
  mockMarkSeen.mockReset();
});

describe('useArchiveKeyController stranded disclosure', () => {
  test('shows once when the key is stranded and unseen', async () => {
    const { result } = await renderHook(() => useArchiveKeyController());

    await act(async () => {});

    expect(result.current.presentation.tone).toBe('attention');
    expect(result.current.showStrandedDisclosure).toBe(true);
  });

  test('dismissing marks it seen and hides it immediately', async () => {
    const { result } = await renderHook(() => useArchiveKeyController());

    await act(async () => {});
    expect(result.current.showStrandedDisclosure).toBe(true);

    // Awaited: an un-awaited act() here leaves the renderer mid-flush, which
    // both misses this state update and corrupts the next test in the file.
    await act(async () => {
      result.current.onDismissStrandedDisclosure();
    });

    expect(mockMarkSeen).toHaveBeenCalledTimes(1);
    expect(result.current.showStrandedDisclosure).toBe(false);
  });

  test('never shows when already seen', async () => {
    mockHasSeen.mockReturnValue(true);

    const { result } = await renderHook(() => useArchiveKeyController());

    await act(async () => {});

    expect(result.current.presentation.tone).toBe('attention');
    expect(result.current.showStrandedDisclosure).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/useArchiveKeyController.behaviour.test.ts`
Expected: FAIL — `result.current.showStrandedDisclosure` is `undefined`, not `true`
(the field does not exist on the hook yet).

- [ ] **Step 3: Add the import**

In `src/features/settings/hooks/useArchiveKeyController.ts`, add to the top imports:

```ts
import { shouldShowArchiveKeyStrandedDisclosure } from '../model/archiveKeyStrandedDisclosure';
import {
  hasSeenArchiveKeyStrandedDisclosure,
  markArchiveKeyStrandedDisclosureSeen,
} from '../services/archiveKeyStrandedDisclosureService';
```

- [ ] **Step 4: Add the dismissed-flag state**

Immediately after the existing `isCheckingKey` state declaration
(`const [isCheckingKey, setIsCheckingKey] = React.useState(true);`), add:

```ts
  const [strandedDisclosureDismissed, setStrandedDisclosureDismissed] =
    React.useState(() => hasSeenArchiveKeyStrandedDisclosure());
```

- [ ] **Step 5: Derive the boolean and add the dismiss handler**

Immediately after the existing `presentation` `useMemo` block, add:

```ts
  const showStrandedDisclosure = shouldShowArchiveKeyStrandedDisclosure({
    tone: presentation.tone,
    hasSeen: strandedDisclosureDismissed,
  });

  const onDismissStrandedDisclosure = React.useCallback(() => {
    markArchiveKeyStrandedDisclosureSeen();
    setStrandedDisclosureDismissed(true);
  }, []);
```

- [ ] **Step 6: Return the two new fields**

In the hook's return statement, add both new fields (order does not matter, keep
alphabetically near `presentation` for readability):

```ts
  return {
    presentation,
    isCheckingKey,
    recoveryCode,
    enteredCode,
    entryFeedback,
    showStrandedDisclosure,
    onDismissStrandedDisclosure,
    onToggleRecoveryCode,
    onChangeEnteredCode,
    onSubmitRecoveryCode,
  };
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx jest __tests__/useArchiveKeyController.behaviour.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 8: Run the existing presentation test to confirm no regression**

Run: `npx jest __tests__/archiveKeyPresentation.test.ts`
Expected: PASS, unchanged (this file tests `presentArchiveKey` directly, which this
task did not touch).

- [ ] **Step 9: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint src/features/settings/hooks/useArchiveKeyController.ts __tests__/useArchiveKeyController.behaviour.test.ts`
Expected: no errors, no warnings.

- [ ] **Step 10: Commit**

```bash
git add src/features/settings/hooks/useArchiveKeyController.ts __tests__/useArchiveKeyController.behaviour.test.ts
git commit -m "feat: derive stranded key disclosure visibility in useArchiveKeyController"
```

---

## Task 3: Copy and the `ArchiveKeyStrandedModal` component

**Files:**
- Modify: `src/constants/copy/settings.ts` (two new keys, both `SETTINGS_COPY_EN` and
  `SETTINGS_COPY_UK`)
- Create: `src/features/settings/components/ArchiveKeyStrandedModal.tsx`

**Interfaces:**
- Consumes: `getArchiveRecoveryCode` from `src/services/crypto/archiveKeyService.ts`
  (existing, unchanged); `reportError` from
  `src/services/observability/errorReporting.ts` (existing, unchanged); `SettingsCopy`
  type from `src/constants/copy/settings.ts`.
- Produces: `ArchiveKeyStrandedModal({ visible, copy, onDismiss }): JSX.Element | null`
  — a named export. Task 4 renders it from `BackupScreen.tsx`, passing
  `archiveKey.showStrandedDisclosure` as `visible` and
  `archiveKey.onDismissStrandedDisclosure` as `onDismiss`.

This task has no dedicated unit test — this codebase does not unit-test presentational
sheet/modal components directly (see `ArchiveFilterSheet.tsx`, which has none either);
correctness is verified by typecheck, lint, the repo-wide `themeTokens.test.ts` (which
would fail on any hardcoded color), and the manual check in Task 4's Step 5.

- [ ] **Step 1: Add the copy keys to `SETTINGS_COPY_EN`**

In `src/constants/copy/settings.ts`, find this existing line (around line 148):

```ts
  archiveKeyEntryAccepted: 'Key accepted. Sync again to read the archive.',
```

Add immediately after it:

```ts
  archiveKeyStrandedDisclosureTitle:
    'This key cannot leave this phone on its own',
  archiveKeyStrandedDisclosureAction: 'Got it',
```

- [ ] **Step 2: Add the copy keys to `SETTINGS_COPY_UK`**

In the same file, find the uk equivalent (around line 739):

```ts
  archiveKeyEntryAccepted:
    'Ключ прийнято. Синхронізуйте ще раз, щоб прочитати архів.',
```

Add immediately after it:

```ts
  archiveKeyStrandedDisclosureTitle:
    'Цей ключ не може сам покинути цей телефон',
  archiveKeyStrandedDisclosureAction: 'Зрозуміло',
```

- [ ] **Step 3: Typecheck the copy change alone**

Run: `npx tsc --noEmit`
Expected: no errors. (If the two objects' keys ever mismatch, `SETTINGS_COPY_UK`'s
`typeof SETTINGS_COPY_EN` annotation turns that into a compile error here — this step
exists specifically to catch that before writing the component.)

- [ ] **Step 4: Create the modal component**

Create `src/features/settings/components/ArchiveKeyStrandedModal.tsx`:

```tsx
import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Text } from '../../../components/ui/Text';
import { Button } from '../../../components/ui/Button';
import { getArchiveRecoveryCode } from '../../../services/crypto/archiveKeyService';
import { reportError } from '../../../services/observability/errorReporting';
import type { Theme } from '../../../theme/theme';
import type { SettingsCopy } from '../../../constants/copy/settings';

type ArchiveKeyStrandedModalProps = {
  visible: boolean;
  copy: SettingsCopy;
  onDismiss: () => void;
};

/**
 * A one-time, unmissable version of the "attention" row `SettingsArchiveKeySection`
 * already renders quietly. Shown once, the first time the archive key turns out
 * unable to travel on its own; dismissing it — any way — marks it seen for good.
 */
export function ArchiveKeyStrandedModal({
  visible,
  copy,
  onDismiss,
}: ArchiveKeyStrandedModalProps) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [code, setCode] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!visible) {
      return;
    }

    let cancelled = false;

    getArchiveRecoveryCode()
      .then(value => {
        if (!cancelled) {
          setCode(value);
        }
      })
      .catch(error => {
        reportError(error, {
          event: 'archive_key_stranded_disclosure_code_failed',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [visible]);

  if (!visible || !code) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop} accessibilityViewIsModal>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.archiveKeyStrandedDisclosureAction}
          style={StyleSheet.absoluteFill}
          onPress={onDismiss}
        />

        <View style={styles.sheet}>
          <Text style={styles.title}>
            {copy.archiveKeyStrandedDisclosureTitle}
          </Text>
          <Text style={styles.body}>{copy.archiveKeyStranded}</Text>

          <View style={styles.codeBlock}>
            <Text style={styles.codeIntro}>{copy.archiveKeyCodeIntro}</Text>
            <Text style={styles.code} selectable>
              {code}
            </Text>
          </View>

          <Button
            title={copy.archiveKeyStrandedDisclosureAction}
            onPress={onDismiss}
          />
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      backgroundColor: `${theme.colors.ink}8F`,
    },
    sheet: {
      width: '100%',
      maxWidth: 440,
      gap: 14,
      padding: 20,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceElevated,
    },
    title: {
      color: theme.colors.text,
      fontSize: 20,
      lineHeight: 25,
      fontWeight: '700',
    },
    body: {
      color: theme.colors.textDim,
      fontSize: 14,
      lineHeight: 20,
    },
    codeBlock: {
      gap: 6,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    codeIntro: {
      color: theme.colors.textDim,
      fontSize: 13,
      lineHeight: 19,
    },
    code: {
      color: theme.colors.text,
      fontSize: 15,
      lineHeight: 24,
      letterSpacing: 0.4,
    },
  });
}
```

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint src/constants/copy/settings.ts src/features/settings/components/ArchiveKeyStrandedModal.tsx`
Expected: no errors, no warnings.

- [ ] **Step 6: Confirm the theme-tokens check still passes**

Run: `npx jest __tests__/themeTokens.test.ts`
Expected: PASS — all 4 tests, confirming the new component has no hardcoded color
literal.

- [ ] **Step 7: Commit**

```bash
git add src/constants/copy/settings.ts src/features/settings/components/ArchiveKeyStrandedModal.tsx
git commit -m "feat: add stranded archive key disclosure copy and modal"
```

---

## Task 4: Render the modal from `BackupScreen`

**Files:**
- Modify: `src/features/settings/screens/BackupScreen.tsx`

**Interfaces:**
- Consumes: `ArchiveKeyStrandedModal` from Task 3;
  `archiveKey.showStrandedDisclosure` and `archiveKey.onDismissStrandedDisclosure`
  from Task 2's `useArchiveKeyController` return value (the screen already holds
  `archiveKey = useArchiveKeyController(...)` — no new hook call needed).

- [ ] **Step 1: Add the import**

In `src/features/settings/screens/BackupScreen.tsx`, add to the existing imports
(alongside the other component imports, e.g. right after the
`SettingsArchiveKeySection` import):

```ts
import { ArchiveKeyStrandedModal } from '../components/ArchiveKeyStrandedModal';
```

- [ ] **Step 2: Render the modal next to the existing archive key section**

Find this existing line:

```tsx
      <SettingsArchiveKeySection copy={copy} controller={archiveKey} />
```

Add immediately after it:

```tsx
      <ArchiveKeyStrandedModal
        visible={archiveKey.showStrandedDisclosure}
        copy={copy}
        onDismiss={archiveKey.onDismissStrandedDisclosure}
      />
```

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint src/features/settings/screens/BackupScreen.tsx`
Expected: no errors, no warnings.

- [ ] **Step 4: Run the full test suite**

Run: `npx jest`
Expected: PASS — every existing suite, plus the two new ones from Task 1 and Task 2.
`BackupScreen.tsx` has no dedicated test file and no structural test elsewhere
references it in a way this change would break (confirmed during design: only
`useBackupScreenController.ts` — untouched by this plan — is referenced by
`__tests__/archiveHealthIntegration.test.ts`).

- [ ] **Step 5: Manual verification**

This state (`getKeySyncAvailability` returning `unavailable`) is rare in production —
force it locally to see the modal:

1. Temporarily edit `src/services/security/archiveKeyStorage.ts`'s
   `getKeySyncAvailability` to `return { status: 'unavailable', reason: 'manual-test' };`
   as its first line (do not commit this).
2. Run the app, sign in and enable cloud sync so an archive key exists, then open
   Backup settings.
3. Confirm the modal appears once, showing the 24-word code immediately (no extra tap
   needed) and the "Got it" text in the active locale.
4. Dismiss it (try each path across runs: the button, then reinstall/clear app storage
   and try the backdrop tap instead) and confirm it does not reappear on returning to
   the screen or restarting the app.
5. Switch the OS/app theme (light and dark) and locale (en/uk) and repeat step 3 to
   confirm copy and contrast both hold.
6. Revert the temporary edit to `archiveKeyStorage.ts` before committing anything else.

- [ ] **Step 6: Commit**

```bash
git add src/features/settings/screens/BackupScreen.tsx
git commit -m "feat: surface the stranded archive key disclosure on BackupScreen"
```

---

## Post-implementation

- Update `docs/CAPABILITIES.md`'s new "Cloud archive recovery code" row (added
  2026-08-09) — it currently reads `partial`, noting the code "is a quiet Settings row
  ... not surfaced when sync is first turned on." After this plan lands, revise that
  note to describe the one-time modal instead, and reconsider whether the row should
  move to `works` (the row's other caveat — the toggle itself asking for nothing — is
  intentional per this design and is not a gap).
