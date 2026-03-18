import React from 'react';
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
import { listDreamListItems } from '../repository/dreamsRepository';
import { getCurrentStreak } from '../model/dreamAnalytics';
import { getStreakMilestoneToast, type StreakMilestoneToast as StreakMilestoneToastData } from '../../stats/model/achievements';
import {
  getLastStreakCelebrated,
  saveLastStreakCelebrated,
} from '../../stats/services/streakMilestoneService';
import { StreakMilestoneToast } from '../../stats/components/StreakMilestoneToast';
import { getStatsCopy } from '../../../constants/copy/stats';
import { useI18n } from '../../../i18n/I18nProvider';
import {
  trackCaptureStarted,
  trackDraftResumed,
} from '../../../services/observability/events';
import {
  getDreamDraft,
  getDreamDraftSnapshot,
} from '../services/dreamDraftService';

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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { locale } = useI18n();
  const statsCopy = React.useMemo(() => getStatsCopy(locale), [locale]);
  const entryMode = route.params?.entryMode ?? 'default';
  const shouldAutoStartRecording =
    route.params?.entryMode === 'voice' && route.params?.autoStartRecording === true;
  const composerKey = React.useMemo(
    () =>
      `${entryMode}:${route.params?.source ?? 'none'}:${route.params?.launchKey ?? 'initial'}:${
        shouldAutoStartRecording ? 'autostart' : 'manual'
      }`,
    [entryMode, route.params?.launchKey, route.params?.source, shouldAutoStartRecording],
  );
  const [streakToast, setStreakToast] = React.useState<StreakMilestoneToastData | null>(null);
  const [pendingSavedDream, setPendingSavedDream] = React.useState<{
    dreamId: string;
    focusSection: DreamDetailFocusSection;
  } | null>(null);
  const [autoStartRecordingKey, setAutoStartRecordingKey] = React.useState<number | undefined>(
    shouldAutoStartRecording ? route.params?.launchKey ?? Date.now() : undefined,
  );

  React.useEffect(() => {
    if (!shouldAutoStartRecording) {
      setAutoStartRecordingKey(undefined);
      return;
    }

    const nextKey = route.params?.launchKey ?? Date.now();
    setAutoStartRecordingKey(current => (current === nextKey ? current : nextKey));
  }, [route.params?.launchKey, shouldAutoStartRecording]);
  React.useEffect(() => {
    if (!pendingSavedDream || streakToast) {
      return;
    }

    navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
      dreamId: pendingSavedDream.dreamId,
      justSaved: true,
      focusSection: pendingSavedDream.focusSection,
    });
    setPendingSavedDream(null);
  }, [navigation, pendingSavedDream, streakToast]);

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
            dreamId: dream.id,
            focusSection: getPostSaveFocusSection(dream),
          });

          // Check streak milestones (fire-and-forget, non-blocking)
          try {
            const allDreams = listDreamListItems();
            const streak = getCurrentStreak(allDreams);
            const lastCelebrated = getLastStreakCelebrated();
            const toast = getStreakMilestoneToast(streak, lastCelebrated, statsCopy);
            if (toast) {
              saveLastStreakCelebrated(streak);
              setStreakToast(toast);
            }
          } catch {
            // Non-critical: ignore errors
          }
        }}
        autoStartRecordingKey={autoStartRecordingKey}
      />
      {streakToast ? (
        <StreakMilestoneToast
          title={streakToast.title}
          subtitle={streakToast.subtitle}
          onDismiss={() => setStreakToast(null)}
        />
      ) : null}
    </>
  );
}
