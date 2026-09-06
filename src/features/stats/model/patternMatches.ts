import { Dream } from '../../dreams/model/dream';

const MIN_TOKEN_LENGTH = 4;
// Structural words plus the verbs and adverbs dream narration leans on
// ("the whole dream *felt* quiet", "I *kept* walking") — none of them is a
// recurring symbol, and surfacing one as a "possible pattern" reads as noise.
// Concrete nouns (water, stairs, door, mother…) are deliberately absent: those
// are the signal.
const STOPWORDS = new Set([
  'about',
  'after',
  'again',
  'always',
  'another',
  'around',
  'because',
  'before',
  'behind',
  'being',
  'below',
  'between',
  'could',
  'came',
  'does',
  'done',
  'down',
  'dream',
  'dreams',
  'even',
  'every',
  'feel',
  'feeling',
  'felt',
  'from',
  'gave',
  'gone',
  'have',
  'held',
  'here',
  'into',
  'just',
  'kept',
  'knew',
  'know',
  'known',
  'like',
  'looked',
  'made',
  'many',
  'more',
  'most',
  'moved',
  'much',
  'never',
  'once',
  'only',
  'over',
  'same',
  'seemed',
  'seen',
  'some',
  'something',
  'still',
  'stood',
  'than',
  'that',
  'them',
  'then',
  'there',
  'they',
  'this',
  'through',
  'told',
  'took',
  'toward',
  'tried',
  'turned',
  'under',
  'very',
  'wanted',
  'went',
  'were',
  'what',
  'when',
  'where',
  'while',
  'with',
  'without',
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

export function normalizePatternSignal(value: string) {
  return normalizeValue(value).replace(/-/g, ' ');
}

function tokenizeText(value?: string) {
  return (
    value
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
      }) ?? []
  );
}

function hasMatchingTag(dream: Dream, signal: string) {
  return dream.tags.some(tag => normalizePatternSignal(tag) === signal);
}

function hasMatchingToken(value: string | undefined, signal: string) {
  return tokenizeText(value).includes(signal);
}

export function getPatternDreamMatches(
  dreams: Dream[],
  signalLabel: string,
  kind: PatternMatchKind,
): PatternDreamMatch[] {
  const normalizedSignal = normalizePatternSignal(signalLabel);

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
    .sort((a, b) => b.dream.createdAt - a.dream.createdAt);
}
