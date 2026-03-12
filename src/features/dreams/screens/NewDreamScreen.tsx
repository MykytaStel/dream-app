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

export default function NewDreamScreen() {
  const route = useRoute<RouteProp<TabParamList, typeof TAB_ROUTE_NAMES.New>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
    </>
  );
}
