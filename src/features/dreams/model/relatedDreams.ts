import { Dream } from './dream';

const MIN_TOKEN_LENGTH = 4;
const SIGNAL_WEIGHT = {
  tag: 8,
  theme: 6,
  emotion: 4,
  text: 3,
} as const;

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
  'kept',
]);

export type RelatedDream = {
  dream: Dream;
  score: number;
  sharedSignals: string[];
};

export type RelatedSignalSummary = {
  label: string;
  count: number;
  totalScore: number;
};

function normalizeSignal(value: string) {
  return value.trim().toLowerCase();
}

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

function formatSignal(signal: string) {
  return signal.replace(/-/g, ' ');
}

function addWeightedSignals(
  signalMap: Map<string, number>,
  values: ReadonlyArray<string>,
  weight: number,
) {
  values.forEach(value => {
    const normalized = normalizeSignal(value);
    if (!normalized) {
      return;
    }

    const currentWeight = signalMap.get(normalized) ?? 0;
    if (weight > currentWeight) {
      signalMap.set(normalized, weight);
    }
  });
}

function getDreamSignalWeights(dream: Dream) {
  const signalWeights = new Map<string, number>();

  addWeightedSignals(signalWeights, dream.tags, SIGNAL_WEIGHT.tag);
  addWeightedSignals(signalWeights, dream.analysis?.themes ?? [], SIGNAL_WEIGHT.theme);
  addWeightedSignals(
    signalWeights,
    [...(dream.wakeEmotions ?? []), ...(dream.sleepContext?.preSleepEmotions ?? [])],
    SIGNAL_WEIGHT.emotion,
  );
  addWeightedSignals(
    signalWeights,
    [
      ...tokenizeText(dream.title),
      ...tokenizeText(dream.text),
      ...tokenizeText(dream.transcript),
      ...tokenizeText(dream.sleepContext?.importantEvents),
      ...tokenizeText(dream.sleepContext?.healthNotes),
    ],
    SIGNAL_WEIGHT.text,
  );

  return signalWeights;
}

export function getRelatedDreams(targetDream: Dream, dreams: Dream[], limit = 3): RelatedDream[] {
  const targetSignals = getDreamSignalWeights(targetDream);

  return dreams
    .filter(candidate => candidate.id !== targetDream.id)
    .map(candidate => {
      const candidateSignals = getDreamSignalWeights(candidate);
      const sharedSignalEntries = Array.from(targetSignals.entries())
        .filter(([signal]) => candidateSignals.has(signal))
        .map(([signal, targetWeight]) => {
          const candidateWeight = candidateSignals.get(signal) ?? SIGNAL_WEIGHT.text;

          return {
            signal,
            score: Math.min(targetWeight, candidateWeight),
            combinedWeight: targetWeight + candidateWeight,
          };
        })
        .sort((left, right) => {
          if (right.combinedWeight !== left.combinedWeight) {
            return right.combinedWeight - left.combinedWeight;
          }

          return left.signal.localeCompare(right.signal);
        });
      const sharedSignals = sharedSignalEntries
        .map(entry => formatSignal(entry.signal))
        .slice(0, 4);
      const score =
        sharedSignalEntries.reduce((total, entry) => total + entry.score, 0) +
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

export function getRelatedSignalSummaries(
  relatedDreams: RelatedDream[],
  limit = 4,
): RelatedSignalSummary[] {
  const aggregatedSignals = new Map<string, RelatedSignalSummary>();

  relatedDreams.forEach(item => {
    item.sharedSignals.forEach((signal, index) => {
      const normalized = normalizeSignal(signal);
      const rankScore = item.sharedSignals.length - index;
      const current = aggregatedSignals.get(normalized);

      if (current) {
        current.count += 1;
        current.totalScore += rankScore;
        return;
      }

      aggregatedSignals.set(normalized, {
        label: signal,
        count: 1,
        totalScore: rankScore,
      });
    });
  });

  return Array.from(aggregatedSignals.values())
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      if (right.totalScore !== left.totalScore) {
        return right.totalScore - left.totalScore;
      }

      return left.label.localeCompare(right.label);
    })
    .slice(0, limit);
}
