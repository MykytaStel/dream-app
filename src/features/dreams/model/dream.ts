export type Mood = 'neutral' | 'positive' | 'negative';
export type StressLevel = 0 | 1 | 2 | 3;
export type DreamTranscriptStatus = 'idle' | 'processing' | 'ready' | 'error';

export type SleepContext = {
  stressLevel?: StressLevel;
  alcoholTaken?: boolean;
  caffeineLate?: boolean;
  medications?: string;
  importantEvents?: string;
  healthNotes?: string;
};

export type Dream = {
  id: string;
  createdAt: number;      // epoch
  archivedAt?: number;    // epoch (soft archive)
  sleepDate?: string;     // YYYY-MM-DD
  title?: string;
  text?: string;
  audioUri?: string;
  transcript?: string;
  transcriptStatus?: DreamTranscriptStatus;
  transcriptUpdatedAt?: number;
  tags: string[];
  mood?: Mood;
  sleepContext?: SleepContext;
  lucidity?: 0 | 1 | 2 | 3;
  // later: embedding: number[];
};
