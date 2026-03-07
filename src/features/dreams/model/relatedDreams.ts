import { Dream } from './dream';

const MIN_TOKEN_LENGTH = 4;
const STOPWORDS = new Set([
  'about',
  'after',
  'again',
  'around',
  'because',
  'before',
  'being',
  'below',
  'between',
  'could',
  'dream',
  'dreams',
  'from',
  'have',
  'into',
  'just',
  'like',
  'over',
  'same',
  'some',
  'than',
  'that',
  'them',
  'then',
  'there',
  'they',
  'this',
  'through',
  'under',
  'very',
  'what',
  'when',
  'where',
  'while',
  'with',
  'would',
  'your',
]);

export type RelatedDream = {
  dream: Dream;
  score: number;
  sharedSignals: string[];
};

function tokenizeText(value?: string) {
  return value
    ?.toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .map(token => token.replace(/^[-']+|[-']+$/g, ''))
    .filter(token => {
      if (!token || token.length < MIN_TOKEN_LENGTH) {
        return false;
      }

      if (/^\d+$/.test(token)) {
        return false;
      }

      return !STOPWORDS.has(token);
    }) ?? [];
}

function getDreamSignalSet(dream: Dream) {
  return new Set([
    ...dream.tags.map(tag => tag.toLowerCase()),
    ...tokenizeText(dream.title),
    ...tokenizeText(dream.text),
    ...tokenizeText(dream.transcript),
  ]);
}

function formatSignal(signal: string) {
  return signal.replace(/-/g, ' ');
}

export function getRelatedDreams(targetDream: Dream, dreams: Dream[], limit = 3): RelatedDream[] {
  const targetTags = new Set(targetDream.tags.map(tag => tag.toLowerCase()));
  const targetSignals = getDreamSignalSet(targetDream);

  return dreams
    .filter(candidate => candidate.id !== targetDream.id)
    .map(candidate => {
      const candidateTags = new Set(candidate.tags.map(tag => tag.toLowerCase()));
      const candidateSignals = getDreamSignalSet(candidate);
      const sharedTags = Array.from(targetTags).filter(tag => candidateTags.has(tag));
      const sharedWords = Array.from(targetSignals).filter(
        signal => !sharedTags.includes(signal) && candidateSignals.has(signal),
      );
      const sharedSignals = [
        ...sharedTags.map(formatSignal),
        ...sharedWords.map(formatSignal),
      ].slice(0, 4);
      const score =
        sharedTags.length * 8 +
        sharedWords.length * 3 +
        (targetDream.mood && candidate.mood && targetDream.mood === candidate.mood ? 1 : 0);

      return {
        dream: candidate,
        score,
        sharedSignals,
      };
    })
    .filter(entry => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return b.dream.createdAt - a.dream.createdAt;
    })
    .slice(0, limit);
}
