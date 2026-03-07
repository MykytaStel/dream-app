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
import { DreamComposer } from '../components/DreamComposer';

export default function NewDreamScreen() {
  const route = useRoute<RouteProp<TabParamList, typeof TAB_ROUTE_NAMES.New>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <DreamComposer
      mode="create"
      onSaved={dream =>
        navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
          dreamId: dream.id,
          justSaved: true,
        })
      }
      autoStartRecordingKey={
        route.params?.entryMode === 'voice' ? route.params.launchKey : undefined
      }
    />
  );
}
