import React from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getDreamAnalysisSettings } from '../../analysis/services/dreamAnalysisSettingsService';
import {
  getDreamsMeta,
  listDreams,
  type DreamsMeta,
} from '../../dreams/repository/dreamsRepository';
import { getSavedMonthlyReportMonths } from '../services/monthlyReportShelfService';
import { getSavedDreamThreads } from '../services/dreamThreadShelfService';
import { trackLocalSurfaceLoad } from '../../../services/observability/perf';

type IdleCallbackHandle = number;
type IdleSchedulerShape = {
  requestIdleCallback?: (callback: () => void) => IdleCallbackHandle;
  cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
};

export function useStatsCatalogState() {
  const hydrationRequestRef = React.useRef(0);
  const [meta, setMeta] = React.useState<DreamsMeta>(() => getDreamsMeta());
  const [dreams, setDreams] = React.useState(() => [] as ReturnType<typeof listDreams>);
  const [analysisSettings, setAnalysisSettings] = React.useState(() => getDreamAnalysisSettings());
  const [savedThreadRecords, setSavedThreadRecords] = React.useState(() => getSavedDreamThreads());
  const [savedMonths, setSavedMonths] = React.useState(() => getSavedMonthlyReportMonths());
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const refreshDreams = React.useCallback(
    (mode: 'initial' | 'silent' = 'silent') => {
      const startedAt = Date.now();
      setLoadError(null);

      try {
        const requestId = ++hydrationRequestRef.current;
        const nextMeta = getDreamsMeta();
        setMeta(nextMeta);
        setAnalysisSettings(getDreamAnalysisSettings());
        setSavedThreadRecords(getSavedDreamThreads());
        setSavedMonths(getSavedMonthlyReportMonths());

        if (mode === 'initial') {
          setLoading(true);
        }

        trackLocalSurfaceLoad('memory_refresh', startedAt, nextMeta.totalCount);

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
      } catch (error) {
        setLoading(false);
        setLoadError(String(error));
      }
    },
    [],
  );

  React.useEffect(() => {
    const scheduler = globalThis as typeof globalThis & IdleSchedulerShape;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleHandle: IdleCallbackHandle | null = null;

    if (typeof scheduler.requestIdleCallback === 'function') {
      idleHandle = scheduler.requestIdleCallback(() => {
        refreshDreams('initial');
      });
    } else {
      timeoutId = setTimeout(() => {
        refreshDreams('initial');
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
  }, [refreshDreams]);

  useFocusEffect(
    React.useCallback(() => {
      refreshDreams('silent');
    }, [refreshDreams]),
  );

  return {
    analysisSettings,
    dreams,
    loadError,
    loading,
    meta,
    savedMonths,
    savedThreadRecords,
  };
}
