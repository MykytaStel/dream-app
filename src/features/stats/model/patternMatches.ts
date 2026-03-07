import { Dream } from '../../dreams/model/dream';

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
  'blue',
]);

export type PatternMatchKind = 'word' | 'theme' | 'symbol';
export type PatternMatchSource = 'tag' | 'title' | 'text' | 'transcript';

export type PatternDreamMatch = {
  dream: Dream;
  sources: PatternMatchSource[];
};

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

function normalizeTag(value: string) {
  return normalizeValue(value).replace(/-/g, ' ');
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

function hasMatchingTag(dream: Dream, signal: string) {
  return dream.tags.some(tag => normalizeTag(tag) === signal);
}

function hasMatchingToken(value: string | undefined, signal: string) {
  return tokenizeText(value).includes(signal);
}

export function getPatternDreamMatches(
  dreams: Dream[],
  signalLabel: string,
  kind: PatternMatchKind,
): PatternDreamMatch[] {
  const normalizedSignal = normalizeTag(signalLabel);

  if (!normalizedSignal) {
    return [];
  }

  return dreams
    .map<PatternDreamMatch | null>(dream => {
      const sources: PatternMatchSource[] = [];

      if (kind === 'word') {
        if (hasMatchingToken(dream.title, normalizedSignal)) {
          sources.push('title');
        }

        if (hasMatchingToken(dream.text, normalizedSignal)) {
          sources.push('text');
        }

        if (hasMatchingToken(dream.transcript, normalizedSignal)) {
          sources.push('transcript');
        }
      } else {
        if (kind === 'theme' && hasMatchingTag(dream, normalizedSignal)) {
          sources.push('tag');
        }

        if (hasMatchingToken(dream.transcript, normalizedSignal)) {
          sources.push('transcript');
        }
      }

      if (!sources.length) {
        return null;
      }

      return {
        dream,
        sources,
      };
    })
    .filter((entry): entry is PatternDreamMatch => Boolean(entry))
    .sort((a, b) => {
      if (b.sources.length !== a.sources.length) {
        return b.sources.length - a.sources.length;
      }

      return b.dream.createdAt - a.dream.createdAt;
    });
}
