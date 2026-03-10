import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useRoute } from '@react-navigation/native';
import {
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
  const [savedDream, setSavedDream] = React.useState<Dream | null>(null);
  const [isSavedSheetVisible, setIsSavedSheetVisible] = React.useState(false);
  const [autoStartRecordingKey, setAutoStartRecordingKey] = React.useState<number | undefined>(
    route.params?.entryMode === 'voice' ? route.params.launchKey ?? Date.now() : undefined,
  );

  React.useEffect(() => {
    if (route.params?.entryMode !== 'voice') {
      return;
    }

    const nextKey = route.params.launchKey ?? Date.now();
    setAutoStartRecordingKey(current => (current === nextKey ? current : nextKey));
  }, [route.params?.entryMode, route.params?.launchKey]);

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

  function handleOpenDetail() {
    if (!savedDream) {
      closeSavedSheet();
      return;
    }

    closeSavedSheet();
    navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
      dreamId: savedDream.id,
      justSaved: true,
    });
  }

  function handleReturnHome() {
    closeSavedSheet();
    navigation.navigate(ROOT_ROUTE_NAMES.Tabs, {
      screen: TAB_ROUTE_NAMES.Home,
    });
  }

  return (
    <>
      <DreamComposer
        mode="create"
        entryMode={route.params?.entryMode}
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
        onReturnHome={handleReturnHome}
      />
    </>
  );
}
