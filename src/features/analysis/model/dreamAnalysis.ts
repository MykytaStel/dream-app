export type DreamAnalysisProvider = 'manual' | 'openai';
export type DreamAnalysisStatus = 'idle' | 'ready' | 'error';

export type DreamAnalysisRecord = {
  provider: DreamAnalysisProvider;
  status: DreamAnalysisStatus;
  summary?: string;
  themes?: string[];
  generatedAt?: number;
  errorMessage?: string;
};

export type DreamAnalysisSettings = {
  enabled: boolean;
  provider: DreamAnalysisProvider;
  allowNetwork: boolean;
};

export const DEFAULT_DREAM_ANALYSIS_SETTINGS: DreamAnalysisSettings = {
  enabled: false,
  provider: 'manual',
  allowNetwork: false,
};

