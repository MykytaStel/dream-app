import React from 'react';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useRoute } from '@react-navigation/native';
import {
  type DreamDetailFocusSection,
  ROOT_ROUTE_NAMES,
  TAB_ROUTE_NAMES,
  type RootStackParamList,
  type TabParamList,
} from '../../../app/navigation/routes';
import type { Dream } from '../model/dream';
import { DreamComposer } from '../components/DreamComposer';
import { CaptureSavedSheet } from '../components/CaptureSavedSheet';
import { listDreamListItems } from '../repository/dreamsRepository';
import { getCurrentStreak } from '../model/dreamAnalytics';
import {
  getStreakMilestoneToast,
  type StreakMilestoneToast as StreakMilestoneToastData,
} from '../../stats/model/achievements';
import {
  getLastStreakCelebrated,
  saveLastStreakCelebrated,
} from '../../stats/services/streakMilestoneService';
import { StreakMilestoneToast } from '../../stats/components/StreakMilestoneToast';
import { getStatsCopy } from '../../../constants/copy/stats';
import { getWidgetCopy } from '../../../constants/copy/widgets';
import { useI18n } from '../../../i18n/I18nProvider';
import {
  trackCaptureStarted,
  trackDraftResumed,
} from '../../../services/observability/events';
import {
  getDreamDraft,
  getDreamDraftSnapshot,
} from '../services/dreamDraftService';
import { WidgetPinToast } from '../../widgets/components/WidgetPinToast';
import {
  hasWidgetPinPromptBeenSeen,
  markWidgetPinPromptSeen,
  isPinNativelySupported,
  requestPinWidget,
} from '../../widgets/services/dreamWidgetPinService';

function getPostSaveFocusSection(dream: Dream): DreamDetailFocusSection {
  if (dream.audioUri?.trim() && !dream.text?.trim()) {
    return 'transcript';
  }

  if (dream.text?.trim()) {
    return 'written';
  }

  return 'reflection';
}

export default function NewDreamScreen() {
  const route = useRoute<RouteProp<TabParamList, typeof TAB_ROUTE_NAMES.New>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { locale } = useI18n();
  const statsCopy = React.useMemo(() => getStatsCopy(locale), [locale]);
  const widgetCopy = React.useMemo(() => getWidgetCopy(locale), [locale]);
  const entryMode = route.params?.entryMode ?? 'default';
  const shouldAutoStartRecording =
    route.params?.entryMode === 'voice' &&
    route.params?.autoStartRecording === true;
  const composerKey = React.useMemo(
    () =>
      `${entryMode}:${route.params?.source ?? 'none'}:${route.params?.launchKey ?? 'initial'}:${
        shouldAutoStartRecording ? 'autostart' : 'manual'
      }`,
    [
      entryMode,
      route.params?.launchKey,
      route.params?.source,
      shouldAutoStartRecording,
    ],
  );
  const [streakToast, setStreakToast] =
    React.useState<StreakMilestoneToastData | null>(null);
  const [showWidgetPinToast, setShowWidgetPinToast] = React.useState(false);
  const [canPinNatively, setCanPinNatively] = React.useState(false);
  const [pendingSavedDream, setPendingSavedDream] = React.useState<{
    dream: Dream;
    focusSection: DreamDetailFocusSection;
  } | null>(null);
  const [autoStartRecordingKey, setAutoStartRecordingKey] = React.useState<
    number | undefined
  >(
    shouldAutoStartRecording
      ? (route.params?.launchKey ?? Date.now())
      : undefined,
  );

  React.useEffect(() => {
    if (!shouldAutoStartRecording) {
      setAutoStartRecordingKey(undefined);
      return;
    }

    const nextKey = route.params?.launchKey ?? Date.now();
    setAutoStartRecordingKey(current =>
      current === nextKey ? current : nextKey,
    );
  }, [route.params?.launchKey, shouldAutoStartRecording]);
  /**
   * Saving used to navigate on its own.
   *
   * The dream was written and the app moved to the detail screen, focused on
   * a section, without being asked. At six in the morning that is the opposite
   * of what a person wants to hear: they wanted "it is safe, go back to bed",
   * and got a new screen with more to read.
   *
   * The sheet says the dream is saved and offers the three things someone
   * might actually want next — add detail, write another, or nothing. Doing
   * nothing is the default and costs one tap on the backdrop.
   *
   * It still waits for both toasts. The widget prompt used to be left out of
   * that condition, so a prompt rendered behind the user on a tab they had
   * already left.
   */
  const savedSheetVisible = Boolean(
    pendingSavedDream && !streakToast && !showWidgetPinToast,
  );

  const closeSavedSheet = React.useCallback(() => {
    setPendingSavedDream(null);
  }, []);

  const openSavedDreamDetail = React.useCallback(
    (focusSection?: DreamDetailFocusSection) => {
      const saved = pendingSavedDream;
      if (!saved) {
        return;
      }

      setPendingSavedDream(null);
      navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
        dreamId: saved.dream.id,
        justSaved: true,
        focusSection: focusSection ?? saved.focusSection,
      });
    },
    [navigation, pendingSavedDream],
  );

  const handleWidgetPinAction = React.useCallback(async () => {
    if (Platform.OS === 'android') {
      await requestPinWidget();
    }
    markWidgetPinPromptSeen();
    setShowWidgetPinToast(false);
  }, []);

  const handleWidgetPinDismiss = React.useCallback(() => {
    markWidgetPinPromptSeen();
    setShowWidgetPinToast(false);
  }, []);

  React.useEffect(() => {
    const source = route.params?.source ?? 'manual';
    const draftSnapshot = getDreamDraftSnapshot(getDreamDraft());

    trackCaptureStarted({
      entryMode,
      autoStartedRecording: shouldAutoStartRecording,
      source,
    });

    if (!draftSnapshot) {
      return;
    }

    trackDraftResumed({
      resumeMode: draftSnapshot.resumeMode,
      hasAudio: draftSnapshot.hasAudio,
      hasText: draftSnapshot.hasText,
      source,
    });
  }, [entryMode, route.params?.source, shouldAutoStartRecording, composerKey]);

  return (
    <>
      <DreamComposer
        key={composerKey}
        mode="create"
        entryMode={entryMode}
        onSaved={dream => {
          setPendingSavedDream({
            dream,
            focusSection: getPostSaveFocusSection(dream),
          });

          // Check streak milestones and widget pin prompt (fire-and-forget, non-blocking)
          try {
            const allDreams = listDreamListItems();
            const streak = getCurrentStreak(allDreams);
            const lastCelebrated = getLastStreakCelebrated();
            const toast = getStreakMilestoneToast(
              streak,
              lastCelebrated,
              statsCopy,
            );
            if (toast) {
              saveLastStreakCelebrated(streak);
              setStreakToast(toast);
            }

            // Show widget pin prompt after first dream, if not seen before.
            //
            // Shown synchronously, because whether to show it is a synchronous
            // question — one dream, prompt not seen. Only the button's label
            // depends on `isPinNativelySupported`, and waiting for that answer
            // before deciding is what let the navigation below win the race.
            if (allDreams.length === 1 && !hasWidgetPinPromptBeenSeen()) {
              setShowWidgetPinToast(true);
              isPinNativelySupported()
                .then(setCanPinNatively)
                .catch(() => setCanPinNatively(false));
            }
          } catch {
            // Non-critical: ignore errors
          }
        }}
        autoStartRecordingKey={autoStartRecordingKey}
      />
      <CaptureSavedSheet
        visible={savedSheetVisible}
        dream={pendingSavedDream?.dream ?? null}
        prefersVoiceCapture={entryMode === 'voice'}
        onClose={closeSavedSheet}
        onCaptureAnother={closeSavedSheet}
        onOpenDetail={openSavedDreamDetail}
      />
      {streakToast ? (
        <StreakMilestoneToast
          title={streakToast.title}
          subtitle={streakToast.subtitle}
          onDismiss={() => setStreakToast(null)}
        />
      ) : null}
      {showWidgetPinToast && !streakToast ? (
        <WidgetPinToast
          canPinNatively={canPinNatively}
          title={widgetCopy.pinPromptTitle}
          subtitle={
            Platform.OS === 'ios'
              ? widgetCopy.pinPromptSubtitleIos
              : widgetCopy.pinPromptSubtitleAndroid
          }
          actionLabel={
            Platform.OS === 'ios'
              ? widgetCopy.pinPromptGotIt
              : widgetCopy.pinPromptAction
          }
          dismissLabel={widgetCopy.pinPromptDismiss}
          onAddWidget={handleWidgetPinAction}
          onDismiss={handleWidgetPinDismiss}
        />
      ) : null}
    </>
  );
}
