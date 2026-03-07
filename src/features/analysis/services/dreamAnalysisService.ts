import { getDream, saveDreamAnalysis } from '../../dreams/repository/dreamsRepository';
import { getDreamAnalysisProvider } from './dreamAnalysisProvider';
import { getDreamAnalysisSettings } from './dreamAnalysisSettingsService';

export async function generateDreamAnalysis(dreamId: string) {
  const dream = getDream(dreamId);
  if (!dream) {
    throw new Error('dream-not-found');
  }

  const settings = getDreamAnalysisSettings();
  if (!settings.enabled) {
    throw new Error('analysis-disabled');
  }

  const provider = getDreamAnalysisProvider(settings.provider);
  if (!provider.canRun(settings)) {
    throw new Error(
      settings.provider === 'openai'
        ? 'analysis-provider-not-available'
        : 'analysis-provider-blocked',
    );
  }

  try {
    const result = await provider.analyze(dream);
    return saveDreamAnalysis(dreamId, {
      provider: provider.id,
      status: 'ready',
      summary: result.summary,
      themes: result.themes,
      generatedAt: Date.now(),
    });
  } catch (error) {
    saveDreamAnalysis(dreamId, {
      provider: provider.id,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : String(error),
      generatedAt: Date.now(),
    });
    throw error;
  }
}

