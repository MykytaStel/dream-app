import { DreamAnalysisSettings, DEFAULT_DREAM_ANALYSIS_SETTINGS } from '../model/dreamAnalysis';
import { kv } from '../../../services/storage/mmkv';
import { DREAM_ANALYSIS_SETTINGS_KEY } from '../../../services/storage/keys';

function normalizeDreamAnalysisSettings(
  input?: Partial<DreamAnalysisSettings> | DreamAnalysisSettings,
): DreamAnalysisSettings {
  const provider = input?.provider === 'openai' ? 'openai' : 'manual';

  return {
    enabled: Boolean(input?.enabled),
    provider,
    allowNetwork: Boolean(input?.allowNetwork),
  };
}

export function getDreamAnalysisSettings() {
  const raw = kv.getString(DREAM_ANALYSIS_SETTINGS_KEY);
  if (!raw) {
    return DEFAULT_DREAM_ANALYSIS_SETTINGS;
  }

  try {
    return normalizeDreamAnalysisSettings(JSON.parse(raw) as Partial<DreamAnalysisSettings>);
  } catch {
    return DEFAULT_DREAM_ANALYSIS_SETTINGS;
  }
}

export function saveDreamAnalysisSettings(settings: DreamAnalysisSettings) {
  const normalized = normalizeDreamAnalysisSettings(settings);
  kv.set(DREAM_ANALYSIS_SETTINGS_KEY, JSON.stringify(normalized));
  return normalized;
}

