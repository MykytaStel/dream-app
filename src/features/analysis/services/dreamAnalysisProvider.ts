import { Dream } from '../../dreams/model/dream';
import {
  DreamAnalysisProvider,
  DreamAnalysisResult,
  DreamAnalysisSettings,
} from '../model/dreamAnalysis';
import { analyzeDreamLocally } from './manualDreamAnalysisProvider';

export type DreamAnalysisProviderDefinition = {
  id: DreamAnalysisProvider;
  transport: 'local' | 'network';
  enabledByDefault: boolean;
  canRun: (settings: DreamAnalysisSettings) => boolean;
  analyze: (_dream: Dream) => Promise<DreamAnalysisResult>;
};

const manualProvider: DreamAnalysisProviderDefinition = {
  id: 'manual',
  transport: 'local',
  enabledByDefault: true,
  canRun: settings => settings.enabled && settings.provider === 'manual',
  analyze: async dream => analyzeDreamLocally(dream),
};

const openAiProvider: DreamAnalysisProviderDefinition = {
  id: 'openai',
  transport: 'network',
  enabledByDefault: false,
  canRun: settings =>
    settings.enabled && settings.provider === 'openai' && settings.allowNetwork,
  analyze: async () => {
    throw new Error('openai-analysis-provider-not-implemented');
  },
};

export const DREAM_ANALYSIS_PROVIDERS: DreamAnalysisProviderDefinition[] = [
  manualProvider,
  openAiProvider,
];

export function getDreamAnalysisProvider(providerId: DreamAnalysisProvider) {
  return DREAM_ANALYSIS_PROVIDERS.find(provider => provider.id === providerId) ?? manualProvider;
}
