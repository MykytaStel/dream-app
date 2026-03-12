import React from 'react';
import { type DreamDraft, getDreamDraft } from '../services/dreamDraftService';
import {
  listDreams,
  listDreamListItems,
  type DreamListItem,
} from '../repository/dreamsRepository';
import { trackLocalSurfaceLoad } from '../../../services/observability/perf';
import { type Dream } from '../model/dream';
import {
  getLastViewedDream,
  isLastViewedDreamFresh,
} from '../services/lastViewedDreamService';
import {
  getHomeSearchPresets,
  type HomeSearchPreset,
} from '../services/homeSearchPresetService';

export type HomeRefreshMode = 'initial' | 'refresh' | 'silent';

type HomeScreenDataState = {
  dreamListItems: DreamListItem[];
  dreams: Dream[];
  draft: DreamDraft | null;
  savedSearchPresets: HomeSearchPreset[];
  setSavedSearchPresets: React.Dispatch<React.SetStateAction<HomeSearchPreset[]>>;
  lastViewedDream: DreamListItem | Dream | null;
  detailsReady: boolean;
  loading: boolean;
  refreshing: boolean;
  loadError: string | null;
  refreshDreams: (mode?: HomeRefreshMode) => void;
};

type IdleCallbackHandle = number;
type IdleSchedulerShape = {
  requestIdleCallback?: (callback: () => void) => IdleCallbackHandle;
  cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
};

export function useHomeScreenData(): HomeScreenDataState {
  const hydrationRequestRef = React.useRef(0);
  const [dreams, setDreams] = React.useState<Dream[]>([]);
  const [dreamListItems, setDreamListItems] = React.useState<DreamListItem[]>([]);
  const [draft, setDraft] = React.useState<DreamDraft | null>(null);
  const [savedSearchPresets, setSavedSearchPresets] = React.useState<HomeSearchPreset[]>([]);
  const [lastViewedDream, setLastViewedDream] = React.useState<DreamListItem | Dream | null>(null);
  const [detailsReady, setDetailsReady] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const hydrateDreamDetails = React.useCallback(() => {
    const requestId = ++hydrationRequestRef.current;

    const runHydration = () => {
      try {
        const fullDreams = listDreams();
        const nextLastViewedDreamRecord = getLastViewedDream();
        const nextLastViewedDream =
          isLastViewedDreamFresh(nextLastViewedDreamRecord) && nextLastViewedDreamRecord
            ? fullDreams.find(dream => dream.id === nextLastViewedDreamRecord.dreamId) ?? null
            : null;

        React.startTransition(() => {
          if (hydrationRequestRef.current !== requestId) {
            return;
          }

          setDreams(fullDreams);
          setLastViewedDream(nextLastViewedDream);
          setDetailsReady(true);
          setLoadError(null);
        });
      } catch (error) {
        if (hydrationRequestRef.current !== requestId) {
          return;
        }

        setDreams([]);
        setDetailsReady(false);
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

  const refreshDreams = React.useCallback((mode: HomeRefreshMode = 'initial') => {
    const startedAt = Date.now();
    if (mode === 'initial') {
      setLoading(true);
    }

    if (mode === 'refresh') {
      setRefreshing(true);
    }

    setLoadError(null);

    try {
      hydrationRequestRef.current += 1;
      const nextDreamListItems = listDreamListItems();
      const nextDraft = getDreamDraft();
      const nextSavedSearchPresets = getHomeSearchPresets();
      const nextLastViewedDreamRecord = getLastViewedDream();
      const nextLastViewedDream =
        isLastViewedDreamFresh(nextLastViewedDreamRecord) && nextLastViewedDreamRecord
          ? nextDreamListItems.find(dream => dream.id === nextLastViewedDreamRecord.dreamId) ?? null
          : null;
      setDreamListItems(nextDreamListItems);
      setDreams([]);
      setDraft(nextDraft);
      setSavedSearchPresets(nextSavedSearchPresets);
      setLastViewedDream(nextLastViewedDream);
      setDetailsReady(false);
      trackLocalSurfaceLoad('home_refresh', startedAt, nextDreamListItems.length);
      hydrateDreamDetails();
    } catch (error) {
      setLoadError(String(error));
    } finally {
      if (mode === 'initial') {
        setLoading(false);
      }

      if (mode === 'refresh') {
        setRefreshing(false);
      }
    }
  }, [hydrateDreamDetails]);

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

  return {
    dreamListItems,
    dreams,
    draft,
    savedSearchPresets,
    setSavedSearchPresets,
    lastViewedDream,
    detailsReady,
    loading,
    refreshing,
    loadError,
    refreshDreams,
  };
}
