import React from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { listDreams } from '../repository/dreamsRepository';
import { Dream } from '../model/dream';
import { trackLocalSurfaceLoad } from '../../../services/observability/perf';

export function useArchiveScreenData() {
  const [dreams, setDreams] = React.useState<Dream[]>(() => listDreams());

  const refreshArchive = React.useCallback(() => {
    const startedAt = Date.now();
    const nextDreams = listDreams();
    React.startTransition(() => {
      setDreams(nextDreams);
    });
    trackLocalSurfaceLoad('archive_refresh', startedAt, nextDreams.length);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refreshArchive();
    }, [refreshArchive]),
  );

  return {
    dreams,
    refreshArchive,
  };
}
