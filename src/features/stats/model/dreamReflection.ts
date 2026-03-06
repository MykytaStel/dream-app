import { Dream } from '../../dreams/model/dream';

const MIN_TRANSCRIPT_TOKEN_LENGTH = 4;
const TRANSCRIPT_STOPWORDS = new Set([
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

export type DreamReflectionSignal = {
  label: string;
  dreamCount: number;
  tagHits: number;
  transcriptHits: number;
  source: 'tag' | 'transcript' | 'mixed';
};

export type TranscriptArchiveStats = {
  withTranscript: number;
  editedTranscript: number;
  generatedTranscript: number;
  audioOnly: number;
};

function formatTagLabel(tag: string) {
  return tag.replace(/-/g, ' ');
}

function normalizeSignalKey(value: string) {
  return value.trim().toLowerCase();
}

function tokenizeTranscript(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .map(token => token.replace(/^[-']+|[-']+$/g, ''))
    .filter(token => {
      if (token.length < MIN_TRANSCRIPT_TOKEN_LENGTH) {
        return false;
      }

      if (/^\d+$/.test(token)) {
        return false;
      }

      return !TRANSCRIPT_STOPWORDS.has(token);
    });
}

function buildSignalSource(tagHits: number, transcriptHits: number): DreamReflectionSignal['source'] {
  if (tagHits > 0 && transcriptHits > 0) {
    return 'mixed';
  }

  return tagHits > 0 ? 'tag' : 'transcript';
}

export function getTranscriptArchiveStats(dreams: Dream[]): TranscriptArchiveStats {
  return dreams.reduce<TranscriptArchiveStats>(
    (acc, dream) => {
      const hasAudio = Boolean(dream.audioUri?.trim());
      const hasTranscript = Boolean(dream.transcript?.trim());

      if (hasTranscript) {
        acc.withTranscript += 1;

        if (dream.transcriptSource === 'edited') {
          acc.editedTranscript += 1;
        } else {
          acc.generatedTranscript += 1;
        }
      }

      if (hasAudio && !hasTranscript && !dream.text?.trim()) {
        acc.audioOnly += 1;
      }

      return acc;
    },
    {
      withTranscript: 0,
      editedTranscript: 0,
      generatedTranscript: 0,
      audioOnly: 0,
    },
  );
}

export function getRecurringReflectionSignals(
  dreams: Dream[],
  options?: { limit?: number; transcriptOnly?: boolean },
) {
  const limit = options?.limit ?? 6;
  const includeTags = !options?.transcriptOnly;
  const signalMap = new Map<
    string,
    {
      label: string;
      dreamIds: Set<string>;
      tagHits: number;
      transcriptHits: number;
    }
  >();

  dreams.forEach(dream => {
    if (includeTags) {
      const uniqueTags = new Set(dream.tags.map(normalizeSignalKey));

      uniqueTags.forEach(tagKey => {
        if (!tagKey) {
          return;
        }

        const current = signalMap.get(tagKey) ?? {
          label: formatTagLabel(tagKey),
          dreamIds: new Set<string>(),
          tagHits: 0,
          transcriptHits: 0,
        };
        current.dreamIds.add(dream.id);
        current.tagHits += 1;
        signalMap.set(tagKey, current);
      });
    }

    const transcript = dream.transcript?.trim();
    if (!transcript) {
      return;
    }

    const uniqueTokens = new Set(tokenizeTranscript(transcript));
    uniqueTokens.forEach(token => {
      const current = signalMap.get(token) ?? {
        label: token,
        dreamIds: new Set<string>(),
        tagHits: 0,
        transcriptHits: 0,
      };
      current.dreamIds.add(dream.id);
      current.transcriptHits += 1;
      signalMap.set(token, current);
    });
  });

  return Array.from(signalMap.values())
    .map<DreamReflectionSignal>(entry => ({
      label: entry.label,
      dreamCount: entry.dreamIds.size,
      tagHits: entry.tagHits,
      transcriptHits: entry.transcriptHits,
      source: buildSignalSource(entry.tagHits, entry.transcriptHits),
    }))
    .filter(entry => entry.dreamCount >= 2)
    .sort((a, b) => {
      if (b.dreamCount !== a.dreamCount) {
        return b.dreamCount - a.dreamCount;
      }

      const hitDiff = b.tagHits + b.transcriptHits - (a.tagHits + a.transcriptHits);
      if (hitDiff !== 0) {
        return hitDiff;
      }

      if (b.transcriptHits !== a.transcriptHits) {
        return b.transcriptHits - a.transcriptHits;
      }

      return a.label.localeCompare(b.label);
    })
    .slice(0, limit);
}

