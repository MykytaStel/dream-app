import React from 'react';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { DREAM_COPY } from '../../../constants/copy/dreams';
import { ROOT_ROUTE_NAMES, type RootStackParamList } from '../../../app/navigation/routes';
import { DreamComposer } from '../components/DreamComposer';
import { getDream } from '../repository/dreamsRepository';

export default function EditDreamScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, typeof ROOT_ROUTE_NAMES.DreamEditor>>();
  const [dream, setDream] = React.useState(() => getDream(route.params.dreamId));

  useFocusEffect(
    React.useCallback(() => {
      setDream(getDream(route.params.dreamId));
    }, [route.params.dreamId]),
  );

  if (!dream) {
    return (
      <ScreenContainer scroll>
        <Card>
          <SectionHeader
            title={DREAM_COPY.detailMissingTitle}
            subtitle={DREAM_COPY.detailMissingDescription}
            large
          />
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <DreamComposer
      mode="edit"
      initialDream={dream}
      onSaved={() => navigation.goBack()}
    />
  );
}
