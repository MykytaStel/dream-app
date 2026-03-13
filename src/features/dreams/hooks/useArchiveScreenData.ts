import React from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  getDreamsMeta,
  listDreams,
  type DreamsMeta,
} from '../repository/dreamsRepository';
import { Dream } from '../model/dream';
import { trackLocalSurfaceLoad } from '../../../services/observability/perf';

type IdleCallbackHandle = number;
type IdleSchedulerShape = {
  requestIdleCallback?: (callback: () => void) => IdleCallbackHandle;
  cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
};

export function useArchiveScreenData() {
  const hydrationRequestRef = React.useRef(0);
  const [dreams, setDreams] = React.useState<Dream[]>([]);
  const [meta, setMeta] = React.useState<DreamsMeta>(() => getDreamsMeta());
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const hydrateArchiveDreams = React.useCallback((mode: 'initial' | 'silent' = 'silent') => {
    const requestId = ++hydrationRequestRef.current;

    const runHydration = () => {
      try {
        const nextDreams = listDreams();

        React.startTransition(() => {
          if (hydrationRequestRef.current !== requestId) {
            return;
          }

          setDreams(nextDreams);
          setLoading(false);
          setLoadError(null);
        });
      } catch (error) {
        if (hydrationRequestRef.current !== requestId) {
          return;
        }

        if (mode === 'initial') {
          setDreams([]);
        }
        setLoading(false);
        setLoadError(String(error));
      }
    };

    const scheduler = globalThis as typeof globalThis & IdleSchedulerShape;
    if (typeof scheduler.requestIdleCallback === 'function') {
      scheduler.requestIdleCallback(runHydration);
      return;
    }

    setTimeout(runHydration, 0);
  }, []);

  const refreshArchive = React.useCallback((mode: 'initial' | 'silent' = 'silent') => {
    const startedAt = Date.now();
    setLoadError(null);

    try {
      const nextMeta = getDreamsMeta();
      setMeta(nextMeta);

      if (mode === 'initial') {
        setLoading(true);
      }

      trackLocalSurfaceLoad('archive_refresh', startedAt, nextMeta.totalCount);
      hydrateArchiveDreams(mode);
    } catch (error) {
      setLoading(false);
      setLoadError(String(error));
    }
  }, [hydrateArchiveDreams]);

  React.useEffect(() => {
    const scheduler = globalThis as typeof globalThis & IdleSchedulerShape;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleHandle: IdleCallbackHandle | null = null;

    if (typeof scheduler.requestIdleCallback === 'function') {
      idleHandle = scheduler.requestIdleCallback(() => {
        refreshArchive('initial');
      });
    } else {
      timeoutId = setTimeout(() => {
        refreshArchive('initial');
      }, 0);
    }

    return () => {
      if (idleHandle !== null && typeof scheduler.cancelIdleCallback === 'function') {
        scheduler.cancelIdleCallback(idleHandle);
      }

      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [refreshArchive]);

  useFocusEffect(
    React.useCallback(() => {
      refreshArchive('silent');
    }, [refreshArchive]),
  );

  return {
    dreams,
    meta,
    loading,
    loadError,
    refreshArchive,
  };
}
