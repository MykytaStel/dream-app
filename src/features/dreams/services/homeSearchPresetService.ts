import { kv } from '../../../services/storage/mmkv';
import { HOME_SEARCH_PRESETS_STORAGE_KEY } from '../../../services/storage/keys';
import {
  getHomeTimelineFiltersSignature,
  normalizeHomeTimelineFilters,
  type HomeTimelineFilters,
} from '../model/homeTimeline';

const MAX_HOME_SEARCH_PRESETS = 6;

export type HomeSearchPreset = {
  id: string;
  label: string;
  filters: HomeTimelineFilters;
  createdAt: number;
};

function normalizePreset(raw?: Partial<HomeSearchPreset>): HomeSearchPreset | null {
  if (!raw?.id || !raw.label?.trim() || !raw.filters) {
    return null;
  }

  return {
    id: raw.id,
    label: raw.label.trim(),
    filters: normalizeHomeTimelineFilters(raw.filters),
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
  };
}

export function getHomeSearchPresets() {
  const raw = kv.getString(HOME_SEARCH_PRESETS_STORAGE_KEY);
  if (!raw) {
    return [] as HomeSearchPreset[];
  }

  try {
    const parsed = JSON.parse(raw) as Array<Partial<HomeSearchPreset>>;
    return parsed
      .map(normalizePreset)
      .filter((preset): preset is HomeSearchPreset => Boolean(preset))
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [] as HomeSearchPreset[];
  }
}

function persistHomeSearchPresets(presets: HomeSearchPreset[]) {
  kv.set(HOME_SEARCH_PRESETS_STORAGE_KEY, JSON.stringify(presets.slice(0, MAX_HOME_SEARCH_PRESETS)));
}

export function saveHomeSearchPreset(input: {
  label: string;
  filters: HomeTimelineFilters;
}) {
  const normalizedFilters = normalizeHomeTimelineFilters(input.filters);
  const nextLabel = input.label.trim();
  if (!nextLabel) {
    return getHomeSearchPresets();
  }

  const current = getHomeSearchPresets();
  const nextSignature = getHomeTimelineFiltersSignature(normalizedFilters);
  const existing = current.find(
    preset => getHomeTimelineFiltersSignature(preset.filters) === nextSignature,
  );

  if (existing) {
    const nextPresets = [existing, ...current.filter(preset => preset.id !== existing.id)];
    persistHomeSearchPresets(nextPresets);
    return nextPresets;
  }

  const nextPreset: HomeSearchPreset = {
    id: `home-search-preset-${Date.now()}`,
    label: nextLabel,
    filters: normalizedFilters,
    createdAt: Date.now(),
  };
  const nextPresets = [nextPreset, ...current].slice(0, MAX_HOME_SEARCH_PRESETS);
  persistHomeSearchPresets(nextPresets);
  return nextPresets;
}

export function removeHomeSearchPreset(id: string) {
  const nextPresets = getHomeSearchPresets().filter(preset => preset.id !== id);
  persistHomeSearchPresets(nextPresets);
  return nextPresets;
}
