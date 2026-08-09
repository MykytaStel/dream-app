# Onboarding Redesign Part A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the onboarding screen's four information slides with one promise
and three actions that each land the user directly in capture, instead of on the
Home tab.

**Architecture:** A full-file rewrite of `OnboardingScreen.tsx` (273 lines → about a
third of that, once the slide carousel, dot indicator, and skip button are gone) and
its copy file. One cohesive change — the screen and its copy are too tightly coupled
to review as separate tasks.

**Tech Stack:** React Native, TypeScript, `@shopify/restyle` theming,
`@react-navigation/native-stack`.

## Global Constraints

- Full design: `docs/superpowers/specs/2026-08-09-onboarding-redesign-design.md`.
- Do **not** build the "optional main goal" step, the goal-based reordering it would
  drive, or any part of Part B (reminder/backup/biometric/Whisper contextual
  prompts) — both explicitly out of scope, see the spec's "Explicitly out of scope"
  section.
- The "I don't remember" action must be `entryMode: 'default'` — the same
  technical path as the text action, differing only in button copy. No new composer
  logic, placeholder text, or special-cased behavior for it.
- Every action must call `markOnboardingSeen()` (existing,
  `src/features/onboarding/services/onboardingService.ts`, unchanged) then navigate
  with `navigation.replace(ROOT_ROUTE_NAMES.Tabs, { screen: TAB_ROUTE_NAMES.New,
  params: { entryMode, autoStartRecording } })` — the same nested-navigation shape
  `openNewDreamTab` already uses in `src/app/navigation/navigationRef.ts`.
- Voice action: `entryMode: 'voice', autoStartRecording: true`. Text and
  no-memory actions: `entryMode: 'default'` (`autoStartRecording` only matters when
  `entryMode === 'voice'` — see `NewDreamScreen.tsx`'s
  `shouldAutoStartRecording` check — so it can be omitted or `false` for these two).
- Both locales (`en`, `uk`) required for every copy key — `ONBOARDING_COPY_UK` is
  typed `: OnboardingCopy` against `typeof ONBOARDING_COPY_EN`, so a missing key is a
  compile error.
- Do not add `Co-Authored-By` trailers to commits.

---

## Task 1: Rewrite the onboarding screen and its copy

**Files:**
- Modify: `src/features/onboarding/screens/OnboardingScreen.tsx` (full rewrite)
- Modify: `src/constants/copy/onboarding.ts` (full rewrite)

**Interfaces:**
- Consumes: `markOnboardingSeen` from `../services/onboardingService` (unchanged,
  no edits needed there); `ROOT_ROUTE_NAMES`, `TAB_ROUTE_NAMES`, `RootStackParamList`
  from `../../../app/navigation/routes` (unchanged — `TabParamList[typeof
  TAB_ROUTE_NAMES.New]` already accepts `{ entryMode?: 'default' | 'voice' | 'wake';
  autoStartRecording?: boolean; ... }`, verified in that file before this plan was
  written).
- Produces: nothing new for other files to consume — this is a leaf screen reached
  only from `RootNavigator.tsx`'s existing route registration, which does not change.

This task has no natural TDD red/green step — it is a UI screen with no existing
test coverage to extend (checked: no test in `__tests__/` references
`OnboardingScreen` or any `slideN*` copy key) and no new pure logic to unit-test
separately from the render. Verification is typecheck, lint, the full suite (to
confirm nothing elsewhere depended on the removed copy keys), and a manual pass.

- [ ] **Step 1: Replace the copy file**

Replace the full contents of `src/constants/copy/onboarding.ts` with:

```ts
import { AppLocale } from '../../i18n/types';

const ONBOARDING_COPY_EN = {
  promiseEyebrow: 'Kaleidoscope',
  promiseTitle: 'Write before it fades',
  promiseDescription:
    'Dreams disappear in minutes. See what keeps coming back — privately, without your journal leaving the device.',
  voiceAction: 'Record a voice memo',
  textAction: 'Write it down',
  noMemoryAction: "I don't remember, but I want to start",
};

type OnboardingCopy = typeof ONBOARDING_COPY_EN;

const ONBOARDING_COPY_UK: OnboardingCopy = {
  promiseEyebrow: 'Калейдоскоп',
  promiseTitle: 'Запиши, поки не забув',
  promiseDescription:
    'Сни зникають за лічені хвилини. Побач, що повертається у твоїх снах — приватно, без хмари.',
  voiceAction: 'Записати голосом',
  textAction: 'Написати текстом',
  noMemoryAction: 'Не пам’ятаю сон, але хочу почати',
};

export function getOnboardingCopy(locale: AppLocale): OnboardingCopy {
  return locale === 'uk' ? ONBOARDING_COPY_UK : ONBOARDING_COPY_EN;
}
```

- [ ] **Step 2: Replace the screen file**

Replace the full contents of `src/features/onboarding/screens/OnboardingScreen.tsx`
with:

```tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Button } from '../../../components/ui/Button';
import { Text } from '../../../components/ui/Text';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { fontFamilies } from '../../../theme/fonts';
import { getOnboardingCopy } from '../../../constants/copy/onboarding';
import { markOnboardingSeen } from '../services/onboardingService';
import {
  ROOT_ROUTE_NAMES,
  TAB_ROUTE_NAMES,
  type RootStackParamList,
} from '../../../app/navigation/routes';

type CaptureEntryMode = 'default' | 'voice';

export default function OnboardingScreen() {
  const theme = useTheme<Theme>();
  const insets = useSafeAreaInsets();
  const { locale } = useI18n();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const copy = React.useMemo(() => getOnboardingCopy(locale), [locale]);
  const styles = React.useMemo(
    () => createStyles(theme, insets.top, insets.bottom),
    [theme, insets.top, insets.bottom],
  );

  const finish = React.useCallback(
    (entryMode: CaptureEntryMode) => {
      markOnboardingSeen();
      navigation.replace(ROOT_ROUTE_NAMES.Tabs, {
        screen: TAB_ROUTE_NAMES.New,
        params: {
          entryMode,
          autoStartRecording: entryMode === 'voice',
        },
      });
    },
    [navigation],
  );

  return (
    <View style={styles.root}>
      <Animated.View entering={FadeIn.duration(260)} style={styles.content}>
        <View style={styles.iconArea}>
          <View style={styles.glowOuter} />
          <View style={styles.glowInner} />
          <View style={styles.iconWrap}>
            <Ionicons
              name="moon-outline"
              size={32}
              color={theme.colors.primary}
            />
          </View>
        </View>

        <Text style={styles.eyebrow}>{copy.promiseEyebrow}</Text>
        <Text style={styles.title}>{copy.promiseTitle}</Text>
        <Text style={styles.description}>{copy.promiseDescription}</Text>
      </Animated.View>

      <View style={styles.bottom}>
        <Button
          title={copy.voiceAction}
          onPress={() => finish('voice')}
          size="lg"
          icon="mic-outline"
        />
        <Button
          title={copy.textAction}
          onPress={() => finish('default')}
          variant="ghost"
          size="lg"
          icon="create-outline"
        />
        <Button
          title={copy.noMemoryAction}
          onPress={() => finish('default')}
          variant="ghost"
          size="sm"
        />
      </View>
    </View>
  );
}

function createStyles(theme: Theme, topInset: number, bottomInset: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.xl,
      paddingTop: topInset + theme.spacing.lg,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      gap: 16,
    },
    iconArea: {
      width: 96,
      height: 96,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    glowOuter: {
      position: 'absolute',
      width: 96,
      height: 96,
      borderRadius: 999,
      backgroundColor: theme.colors.primaryAlt,
      opacity: 0.1,
    },
    glowInner: {
      position: 'absolute',
      width: 64,
      height: 64,
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
      opacity: 0.12,
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.glow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.22,
      shadowRadius: 18,
      elevation: 6,
    },
    eyebrow: {
      color: theme.colors.accent,
      fontFamily: fontFamilies.sans,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    title: {
      fontFamily: fontFamilies.display,
      fontSize: 34,
      lineHeight: 40,
      color: theme.colors.text,
      letterSpacing: -0.3,
    },
    description: {
      color: theme.colors.textDim,
      fontFamily: fontFamilies.sans,
      fontSize: 16,
      lineHeight: 24,
    },
    bottom: {
      paddingBottom: bottomInset + theme.spacing.xl,
      gap: theme.spacing.sm,
    },
  });
}
```

Note what this drops from the original: the `Pressable`-based skip button and its
`topBar` styles, the `Slide` type and four-item `slides` array, the `index`/`isLast`
state and dot-pagination styles (`dots`, `dot`, `dotActive`, `dotInactive`), and the
`skipButton`/`skipButtonPressed`/`skipLabel` styles. Everything else in the visual
chrome (`iconArea`, `glowOuter`, `glowInner`, `iconWrap`, `eyebrow`, `title`,
`description`) is unchanged from the original file.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. This is the completeness check for the copy rewrite (a missing
key in either locale object is a compile error against the `OnboardingCopy` type) and
for the navigation call (the nested `{ screen, params }` shape is checked against
`RootStackParamList[typeof ROOT_ROUTE_NAMES.Tabs]`).

- [ ] **Step 4: Lint**

Run: `npx eslint src/features/onboarding/screens/OnboardingScreen.tsx src/constants/copy/onboarding.ts`
Expected: no errors, no warnings.

- [ ] **Step 5: Full test suite**

Run: `npx jest`
Expected: PASS — every suite, same total count as before this change (no test
targets the removed slide copy or the old carousel behavior).

- [ ] **Step 6: Manual verification**

The app only shows onboarding when `hasSeenOnboarding()` is false, so seeing it
again requires either a clean install or clearing the app's local storage (there is
no `resetOnboardingSeen` helper to call instead). On a simulator or device:

1. Clear app storage (or reinstall) and launch the app.
2. Confirm the onboarding screen shows one promise (no slide carousel, no dots, no
   skip button) and three actions.
3. Tap the voice action — confirm it lands in the composer with recording already
   started.
4. Repeat from a clean state, tap the text action — confirm it lands in the composer
   in text mode, ready to type, not recording.
5. Repeat from a clean state, tap "I don't remember" — confirm it also lands in the
   composer in the same text mode as step 4 (this is intentionally identical
   behavior to the text action — confirming it, not looking for a difference).
6. Repeat the full pass in `uk` locale (device language or the app's locale
   setting) and in both light and dark theme, confirming copy and contrast both
   hold.

- [ ] **Step 7: Commit**

```bash
git add src/features/onboarding/screens/OnboardingScreen.tsx src/constants/copy/onboarding.ts
git commit -m "feat: replace onboarding slides with a single promise and immediate capture"
```
