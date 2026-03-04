export type Mood = 'neutral' | 'positive' | 'negative';

export type Dream = {
  id: string;
  createdAt: number;      // epoch
  archivedAt?: number;    // epoch (soft archive)
  sleepDate?: string;     // YYYY-MM-DD
  title?: string;
  text?: string;
  audioUri?: string;
  tags: string[];
  mood?: Mood;
  lucidity?: 0 | 1 | 2 | 3;
  // later: embedding: number[];
};
