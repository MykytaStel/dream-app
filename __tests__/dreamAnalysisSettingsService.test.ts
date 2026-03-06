import { kv } from '../src/services/storage/mmkv';
import { DREAM_ANALYSIS_SETTINGS_KEY } from '../src/services/storage/keys';
import {
  getDreamAnalysisSettings,
  saveDreamAnalysisSettings,
} from '../src/features/analysis/services/dreamAnalysisSettingsService';

describe('dreamAnalysisSettingsService', () => {
  beforeEach(() => {
    kv.clearAll();
  });

  test('returns default settings when nothing is stored', () => {
    expect(getDreamAnalysisSettings()).toEqual({
      enabled: false,
      provider: 'manual',
      allowNetwork: false,
    });
  });

  test('normalizes and persists settings', () => {
    const saved = saveDreamAnalysisSettings({
      enabled: true,
      provider: 'openai',
      allowNetwork: true,
    });

    expect(saved).toEqual({
      enabled: true,
      provider: 'openai',
      allowNetwork: true,
    });
    expect(JSON.parse(kv.getString(DREAM_ANALYSIS_SETTINGS_KEY) ?? '{}')).toEqual(saved);
  });

  test('falls back safely for invalid stored payloads', () => {
    kv.set(
      DREAM_ANALYSIS_SETTINGS_KEY,
      JSON.stringify({
        enabled: 1,
        provider: 'unknown',
        allowNetwork: 'yes',
      }),
    );

    expect(getDreamAnalysisSettings()).toEqual({
      enabled: true,
      provider: 'manual',
      allowNetwork: true,
    });
  });
});

