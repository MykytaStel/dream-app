import { DreamAnalysisRecord } from '../../analysis/model/dreamAnalysis';

export type Mood =
  // legacy values — still valid in storage, not shown in UI
  | 'neutral'
  | 'positive'
  | 'negative'
  // dream tone values
  | 'peaceful'
  | 'joyful'
  | 'mysterious'
  | 'nostalgic'
  | 'melancholic'
  | 'anxious'
  | 'dark'
  | 'surreal';

export type DreamIntensity = 1 | 2 | 3 | 4 | 5;
export type StressLevel = 0 | 1 | 2 | 3;
export type DreamTranscriptStatus = 'idle' | 'processing' | 'ready' | 'error';
export type DreamTranscriptSource = 'generated' | 'edited';
export type DreamSyncStatus = 'local' | 'syncing' | 'synced' | 'error';
export type LucidPracticeTechnique =
  | 'mild'
  | 'wbtb'
  | 'ssild'
  | 'reality_check'
  | 'intention';
export type LucidControlArea =
  | 'scene'
  | 'movement'
  | 'characters'
  | 'body'
  | 'emotion'
  | 'waking';
export type LucidStabilizationAction =
  | 'hands'
  | 'breathing'
  | 'spinning'
  | 'touch'
  | 'voice'
  | 'anchor';
export type LucidRecallScore = 1 | 2 | 3 | 4 | 5;
export type NightmareDistressLevel = 1 | 2 | 3 | 4 | 5;
export type NightmareAftereffect =
  | 'panic'
  | 'sweating'
  | 'racing-heart'
  | 'fear-to-sleep'
  | 'disoriented'
  | 'sadness';
export type NightmareGroundingAction =
  | 'light'
  | 'breathing'
  | 'water'
  | 'journal'
  | 'body-check'
  | 'safe-sound';
export type NightmareRescriptStatus = 'none' | 'drafted' | 'rehearsed';
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

export type LucidPractice = {
  technique?: LucidPracticeTechnique;
  dreamSigns?: string[];
  trigger?: string;
  controlAreas?: LucidControlArea[];
  stabilizationActions?: LucidStabilizationAction[];
  recallScore?: LucidRecallScore;
};

export type NightmareSupport = {
  explicit?: boolean;
  distress?: NightmareDistressLevel;
  recurring?: boolean;
  recurringKey?: string;
  wokeFromDream?: boolean;
  aftereffects?: NightmareAftereffect[];
  groundingUsed?: NightmareGroundingAction[];
  rewrittenEnding?: string;
  rescriptStatus?: NightmareRescriptStatus;
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
  dreamIntensity?: DreamIntensity;
  wakeEmotions?: WakeEmotion[];
  sleepContext?: SleepContext;
  lucidity?: 0 | 1 | 2 | 3;
  lucidPractice?: LucidPractice;
  nightmare?: NightmareSupport;
  // later: embedding: number[];
};
