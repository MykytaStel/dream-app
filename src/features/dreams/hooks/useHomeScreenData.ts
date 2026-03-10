import React from 'react';
import { DreamDraft, getDreamDraft } from '../services/dreamDraftService';
import { listDreams } from '../repository/dreamsRepository';
import { Dream } from '../model/dream';
import {
  getHomeSearchPresets,
  type HomeSearchPreset,
} from '../services/homeSearchPresetService';
import {
  clearLastViewedDream,
  getLastViewedDream,
} from '../services/lastViewedDreamService';
import { trackLocalSurfaceLoad } from '../../../services/observability/perf';

export type HomeRefreshMode = 'initial' | 'refresh' | 'silent';

type HomeScreenDataState = {
  dreams: Dream[];
  draft: DreamDraft | null;
  loading: boolean;
  refreshing: boolean;
  loadError: string | null;
  savedSearchPresets: HomeSearchPreset[];
  setSavedSearchPresets: React.Dispatch<React.SetStateAction<HomeSearchPreset[]>>;
  lastViewedDream: Dream | null;
  refreshDreams: (mode?: HomeRefreshMode) => void;
};

export function useHomeScreenData(): HomeScreenDataState {
  const [dreams, setDreams] = React.useState<Dream[]>([]);
  const [draft, setDraft] = React.useState<DreamDraft | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [savedSearchPresets, setSavedSearchPresets] = React.useState<HomeSearchPreset[]>(
    () => getHomeSearchPresets(),
  );
  const [lastViewedDream, setLastViewedDream] = React.useState<Dream | null>(null);

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
      const nextDreams = listDreams();
      const nextDraft = getDreamDraft();
      const nextPresets = getHomeSearchPresets();
      const lastViewed = getLastViewedDream();
      const nextLastViewedDream = lastViewed
        ? nextDreams.find(dream => dream.id === lastViewed.dreamId) ?? null
        : null;

      if (lastViewed && !nextLastViewedDream) {
        clearLastViewedDream(lastViewed.dreamId);
      }

      React.startTransition(() => {
        setDreams(nextDreams);
        setDraft(nextDraft);
        setSavedSearchPresets(nextPresets);
        setLastViewedDream(nextLastViewedDream);
      });

      trackLocalSurfaceLoad('home_refresh', startedAt, nextDreams.length);
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
  }, []);

  return {
    dreams,
    draft,
    loading,
    refreshing,
    loadError,
    savedSearchPresets,
    setSavedSearchPresets,
    lastViewedDream,
    refreshDreams,
  };
}
