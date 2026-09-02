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
import { DreamComposerWithRecovery } from '../components/DreamComposerWithRecovery';
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
import { startCaptureSession } from '../../../services/analytics/captureSession';
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
  // Bumped after every save so the next capture gets a fresh composer rather
  // than the one that just wrote a dream — otherwise its already-cleared fields
  // and the "Continue draft" affordance linger on a dream that is safely saved.
  const [savedNonce, setSavedNonce] = React.useState(0);
  const composerKey = React.useMemo(
    () =>
      `${entryMode}:${route.params?.source ?? 'none'}:${route.params?.launchKey ?? 'initial'}:${
        shouldAutoStartRecording ? 'autostart' : 'manual'
      }:${savedNonce}`,
    [
      entryMode,
      route.params?.launchKey,
      route.params?.source,
      savedNonce,
      shouldAutoStartRecording,
    ],
  );
  const [streakToast, setStreakToast] =
    React.useState<StreakMilestoneToastData | null>(null);
  const [showWidgetPinToast, setShowWidgetPinToast] = React.useState(false);
  // Queued during onSaved, shown only once the "Capture saved" sheet closes —
  // otherwise the widget nag covers the save confirmation on the first dream.
  const widgetPromptPendingRef = React.useRef(false);
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

  const savedSheetVisible = Boolean(
    pendingSavedDream && !streakToast && !showWidgetPinToast,
  );

  const releaseWidgetPromptIfPending = React.useCallback(() => {
    if (!widgetPromptPendingRef.current) {
      return;
    }
    widgetPromptPendingRef.current = false;
    setShowWidgetPinToast(true);
    isPinNativelySupported()
      .then(setCanPinNatively)
      .catch(() => setCanPinNatively(false));
  }, []);

  const closeSavedSheet = React.useCallback(() => {
    setPendingSavedDream(null);
    releaseWidgetPromptIfPending();
  }, [releaseWidgetPromptIfPending]);

  const openSavedDreamDetail = React.useCallback(
    (focusSection?: DreamDetailFocusSection) => {
      const saved = pendingSavedDream;
      if (!saved) {
        return;
      }

      setPendingSavedDream(null);
      widgetPromptPendingRef.current = false;
      navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
        source: 'other',
        dreamId: saved.dream.id,
        justSaved: true,
        focusSection: focusSection ?? saved.focusSection,
      });
    },
    [navigation, pendingSavedDream],
  );

  const openSavedDreamEditor = React.useCallback(() => {
    const saved = pendingSavedDream;
    if (!saved) {
      return;
    }

    setPendingSavedDream(null);
    widgetPromptPendingRef.current = false;
    navigation.navigate(ROOT_ROUTE_NAMES.DreamEditor, {
      dreamId: saved.dream.id,
    });
  }, [navigation, pendingSavedDream]);

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
      captureId: startCaptureSession(),
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
      <DreamComposerWithRecovery
        key={composerKey}
        mode="create"
        entryMode={entryMode}
        onSaved={dream => {
          setPendingSavedDream({
            dream,
            focusSection: getPostSaveFocusSection(dream),
          });
          setSavedNonce(current => current + 1);

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

            if (allDreams.length >= 3 && !hasWidgetPinPromptBeenSeen()) {
              // Queued — released when the saved sheet closes, not stacked on it.
              widgetPromptPendingRef.current = true;
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
        onOpenEditor={openSavedDreamEditor}
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
