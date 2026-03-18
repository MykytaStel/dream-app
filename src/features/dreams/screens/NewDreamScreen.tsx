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
import { CaptureSavedSheet } from '../components/CaptureSavedSheet';
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
  const [savedDream, setSavedDream] = React.useState<Dream | null>(null);
  const [isSavedSheetVisible, setIsSavedSheetVisible] = React.useState(false);
  const [streakToast, setStreakToast] = React.useState<StreakMilestoneToastData | null>(null);
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

  const prefersVoiceCapture = route.params?.entryMode === 'voice';

  function closeSavedSheet() {
    setIsSavedSheetVisible(false);
  }

  function handleCaptureAnother() {
    closeSavedSheet();
    if (prefersVoiceCapture) {
      setAutoStartRecordingKey(current => (current ?? Date.now()) + 1);
    }
  }

  function handleOpenDetail(focusSection?: DreamDetailFocusSection) {
    if (!savedDream) {
      closeSavedSheet();
      return;
    }

    closeSavedSheet();
    navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
      dreamId: savedDream.id,
      justSaved: true,
      focusSection,
    });
  }

  return (
    <>
      <DreamComposer
        key={composerKey}
        mode="create"
        entryMode={entryMode}
        onSaved={dream => {
          setSavedDream(dream);
          setIsSavedSheetVisible(true);

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
      <CaptureSavedSheet
        visible={isSavedSheetVisible}
        dream={savedDream}
        prefersVoiceCapture={prefersVoiceCapture}
        onClose={closeSavedSheet}
        onCaptureAnother={handleCaptureAnother}
        onOpenDetail={handleOpenDetail}
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
