import { kv } from '../src/services/storage/mmkv';
import { saveDream, getDream } from '../src/features/dreams/repository/dreamsRepository';
import { saveDreamAnalysisSettings } from '../src/features/analysis/services/dreamAnalysisSettingsService';
import { generateDreamAnalysis } from '../src/features/analysis/services/dreamAnalysisService';

describe('dreamAnalysisService', () => {
  beforeEach(() => {
    kv.clearAll();
  });

  test('generates and persists local manual analysis for a dream', async () => {
    saveDreamAnalysisSettings({
      enabled: true,
      provider: 'manual',
      allowNetwork: false,
    });
    saveDream({
      id: 'analysis-dream-1',
      createdAt: 1,
      sleepDate: '2026-03-07',
      text: 'I kept missing the train and running through a flooded hallway.',
      transcript: 'I kept missing the train and running through a flooded hallway.',
      tags: ['train', 'water'],
      mood: 'negative',
    });

    const result = await generateDreamAnalysis('analysis-dream-1');

    expect(result.analysis).toMatchObject({
      provider: 'manual',
      status: 'ready',
    });
    expect(result.analysis?.themes).toEqual(expect.arrayContaining(['train', 'water']));
    expect(result.analysis?.summary).toContain('Likely themes');
    expect(getDream('analysis-dream-1')?.analysis?.status).toBe('ready');
  });

  test('fails cleanly when analysis layer is disabled', async () => {
    saveDream({
      id: 'analysis-dream-2',
      createdAt: 2,
      sleepDate: '2026-03-07',
      text: 'Short note',
      tags: [],
    });

    await expect(generateDreamAnalysis('analysis-dream-2')).rejects.toThrow('analysis-disabled');
  });

  test('stores an error analysis record for unavailable network providers', async () => {
    saveDreamAnalysisSettings({
      enabled: true,
      provider: 'openai',
      allowNetwork: false,
    });
    saveDream({
      id: 'analysis-dream-3',
      createdAt: 3,
      sleepDate: '2026-03-07',
      text: 'Another dream',
      tags: [],
    });

    await expect(generateDreamAnalysis('analysis-dream-3')).rejects.toThrow(
      'analysis-provider-not-available',
    );
    expect(getDream('analysis-dream-3')?.analysis).toBeUndefined();
  });
});
