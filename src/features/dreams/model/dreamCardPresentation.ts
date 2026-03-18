import type { Dream } from './dream';
import { getMoodValence } from './dreamAnalytics';
import { getDreamDate } from './dreamAnalytics';

export type DreamCardValence = 'positive' | 'neutral' | 'negative';

export type DreamCardData = {
  title: string;
  dateLabel: string;
  moodLabel: string | null;
  moodValence: DreamCardValence;
  tags: string[];
  excerpt: string;
  gradient: [string, string, string];
};

// Static palette — not theme-dynamic so capture works off-screen
const GRADIENT_BY_VALENCE: Record<DreamCardValence, [string, string, string]> = {
  positive: ['#63D9FF', '#8D7CFF', '#3D6B9F'],
  neutral: ['#8D7CFF', '#C57EFF', '#2D1F5F'],
  negative: ['#5F1F3D', '#C57EFF', '#8D7CFF'],
};

export function buildDreamCardData(
  dream: Dream,
  moodLabels: Record<string, string>,
  copy: { untitled: string },
): DreamCardData {
  const valence: DreamCardValence = dream.mood ? getMoodValence(dream.mood) : 'neutral';
  const moodLabel = dream.mood ? (moodLabels[dream.mood] ?? null) : null;

  const date = getDreamDate(dream);
  const dateLabel = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const rawText = dream.text ?? dream.transcript ?? '';
  const excerpt = rawText.length > 120 ? rawText.slice(0, 117).trimEnd() + '…' : rawText;

  return {
    title: dream.title || copy.untitled,
    dateLabel,
    moodLabel,
    moodValence: valence,
    tags: dream.tags.slice(0, 5),
    excerpt,
    gradient: GRADIENT_BY_VALENCE[valence],
  };
}

export function buildDreamShareText(
  card: DreamCardData,
  watermark: string,
  shareMessage: string,
): string {
  const parts: string[] = [];

  parts.push(card.title);
  parts.push(card.dateLabel);

  if (card.moodLabel) {
    parts.push(card.moodLabel);
  }

  if (card.excerpt) {
    parts.push('');
    parts.push(card.excerpt);
  }

  if (card.tags.length > 0) {
    parts.push('');
    parts.push(card.tags.map(t => `#${t}`).join('  '));
  }

  parts.push('');
  parts.push(`— ${watermark}`);
  parts.push(shareMessage);

  return parts.join('\n');
}
