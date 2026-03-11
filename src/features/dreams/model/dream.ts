import { DreamAnalysisRecord } from '../../analysis/model/dreamAnalysis';

export type Mood = 'neutral' | 'positive' | 'negative';
export type StressLevel = 0 | 1 | 2 | 3;
export type DreamTranscriptStatus = 'idle' | 'processing' | 'ready' | 'error';
export type DreamTranscriptSource = 'generated' | 'edited';
export type DreamSyncStatus = 'local' | 'syncing' | 'synced' | 'error';
export type WakeEmotion =
  | 'calm'
  | 'uneasy'
  | 'curious'
  | 'heavy'
  | 'inspired'
  | 'disoriented';
export type PreSleepEmotion =
  | 'peaceful'
  | 'anxious'
  | 'restless'
  | 'hopeful'
  | 'drained'
  | 'lonely';

export type SleepContext = {
  stressLevel?: StressLevel;
  preSleepEmotions?: PreSleepEmotion[];
  alcoholTaken?: boolean;
  caffeineLate?: boolean;
  medications?: string;
  importantEvents?: string;
  healthNotes?: string;
};

export type Dream = {
  id: string;
  createdAt: number;      // epoch
  updatedAt?: number;     // epoch
  archivedAt?: number;    // epoch (soft archive)
  starredAt?: number;     // epoch
  sleepDate?: string;     // YYYY-MM-DD
  title?: string;
  text?: string;
  audioUri?: string;
  audioRemotePath?: string;
  transcript?: string;
  transcriptStatus?: DreamTranscriptStatus;
  transcriptSource?: DreamTranscriptSource;
  transcriptUpdatedAt?: number;
  syncStatus?: DreamSyncStatus;
  lastSyncedAt?: number;
  syncError?: string;
  analysis?: DreamAnalysisRecord;
  tags: string[];
  mood?: Mood;
  wakeEmotions?: WakeEmotion[];
  sleepContext?: SleepContext;
  lucidity?: 0 | 1 | 2 | 3;
  // later: embedding: number[];
};
