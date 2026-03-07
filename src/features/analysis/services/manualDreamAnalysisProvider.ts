import { Dream } from '../../dreams/model/dream';
import { DreamAnalysisResult } from '../model/dreamAnalysis';

const STOPWORDS = new Set([
  'about',
  'after',
  'again',
  'around',
  'because',
  'before',
  'being',
  'could',
  'dream',
  'dreams',
  'from',
  'have',
  'into',
  'just',
  'like',
  'maybe',
  'there',
  'these',
  'they',
  'this',
  'through',
  'under',
  'until',
  'very',
  'what',
  'when',
  'where',
  'while',
  'with',
  'would',
  'your',
]);

function firstSentence(value?: string) {
  const text = value?.trim();
  if (!text) {
    return undefined;
  }

  const match = text.match(/(.+?[.!?])(\s|$)/);
  const sentence = match ? match[1] : text;
  return sentence.length > 180 ? `${sentence.slice(0, 177)}...` : sentence;
}

function collectTokens(value?: string) {
  if (!value?.trim()) {
    return [];
  }

  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .map(token => token.replace(/^[-']+|[-']+$/g, ''))
    .filter(token => token.length >= 4 && !STOPWORDS.has(token) && !/^\d+$/.test(token));
}

function extractThemes(dream: Dream) {
  const themeMap = new Map<string, number>();

  dream.tags.forEach(tag => {
    themeMap.set(tag.replace(/-/g, ' '), (themeMap.get(tag.replace(/-/g, ' ')) ?? 0) + 3);
  });

  const transcriptTokens = collectTokens(dream.transcript);
  transcriptTokens.forEach(token => {
    themeMap.set(token, (themeMap.get(token) ?? 0) + 1);
  });

  if (themeMap.size === 0) {
    collectTokens(dream.text).forEach(token => {
      themeMap.set(token, (themeMap.get(token) ?? 0) + 1);
    });
  }

  return Array.from(themeMap.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 4)
    .map(([theme]) => theme);
}

function describeContext(dream: Dream) {
  const context = dream.sleepContext;
  if (!context) {
    return undefined;
  }

  const bits: string[] = [];
  if (typeof context.stressLevel === 'number') {
    bits.push(`stress ${context.stressLevel}/3`);
  }
  if (context.alcoholTaken) {
    bits.push('alcohol before sleep');
  }
  if (context.caffeineLate) {
    bits.push('late caffeine');
  }
  if (context.importantEvents?.trim()) {
    bits.push(context.importantEvents.trim());
  }

  return bits.length ? bits.slice(0, 3).join(', ') : undefined;
}

export function analyzeDreamLocally(dream: Dream): DreamAnalysisResult {
  const themes = extractThemes(dream);
  const opener =
    firstSentence(dream.transcript) ??
    firstSentence(dream.text) ??
    'This entry is anchored more by tags and metadata than by a long written description.';
  const themeFragment = themes.length
    ? `Likely themes: ${themes.join(', ')}.`
    : 'No strong recurring themes were extracted yet.';
  const moodFragment = dream.mood ? `Mood after waking was marked as ${dream.mood}.` : undefined;
  const contextFragment = describeContext(dream)
    ? `Pre-sleep context noted: ${describeContext(dream)}.`
    : undefined;
  const audioFragment = dream.audioUri
    ? dream.transcript?.trim()
      ? 'An original voice note and transcript are both attached.'
      : 'An original voice note is attached, but transcript detail is still limited.'
    : undefined;

  const summary = [opener, themeFragment, moodFragment, contextFragment, audioFragment]
    .filter(Boolean)
    .join(' ');

  return {
    summary,
    themes,
  };
}

