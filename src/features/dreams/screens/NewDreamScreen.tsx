import React from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { TAB_ROUTE_NAMES, type TabParamList } from '../../../app/navigation/routes';
import { DreamComposer } from '../components/DreamComposer';

export default function NewDreamScreen() {
  const route = useRoute<RouteProp<TabParamList, typeof TAB_ROUTE_NAMES.New>>();

  return (
    <DreamComposer
      mode="create"
      autoStartRecordingKey={
        route.params?.entryMode === 'voice' ? route.params.launchKey : undefined
      }
    />
  );
}
