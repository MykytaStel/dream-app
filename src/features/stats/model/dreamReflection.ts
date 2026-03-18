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
  firstSeenAt: number;
  latestSeenAt: number;
};

export type TranscriptArchiveStats = {
  withTranscript: number;
  editedTranscript: number;
  generatedTranscript: number;
  audioOnly: number;
};

export type DreamWordSignal = {
  label: string;
  dreamCount: number;
  hitCount: number;
  firstSeenAt: number;
  latestSeenAt: number;
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

function tokenizeNarrativeParts(dream: Dream) {
  return [dream.text, dream.transcript]
    .filter((value): value is string => Boolean(value?.trim()))
    .flatMap(tokenizeTranscript);
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
      firstSeenAt: number;
      latestSeenAt: number;
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
          firstSeenAt: dream.createdAt,
          latestSeenAt: dream.createdAt,
        };
        current.dreamIds.add(dream.id);
        current.tagHits += 1;
        current.firstSeenAt = Math.min(current.firstSeenAt, dream.createdAt);
        current.latestSeenAt = Math.max(current.latestSeenAt, dream.createdAt);
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
        firstSeenAt: dream.createdAt,
        latestSeenAt: dream.createdAt,
      };
      current.dreamIds.add(dream.id);
      current.transcriptHits += 1;
      current.firstSeenAt = Math.min(current.firstSeenAt, dream.createdAt);
      current.latestSeenAt = Math.max(current.latestSeenAt, dream.createdAt);
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
      firstSeenAt: entry.firstSeenAt,
      latestSeenAt: entry.latestSeenAt,
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

export function getRecurringWordSignals(dreams: Dream[], limit = 6) {
  const signalMap = new Map<
    string,
    {
      dreamIds: Set<string>;
      hitCount: number;
      firstSeenAt: number;
      latestSeenAt: number;
    }
  >();

  dreams.forEach(dream => {
    const tokens = tokenizeNarrativeParts(dream);

    // Single O(m) pass to build frequency map — avoids O(m²) .filter() scan per token
    const tokenFreq = new Map<string, number>();
    for (const token of tokens) {
      tokenFreq.set(token, (tokenFreq.get(token) ?? 0) + 1);
    }

    tokenFreq.forEach((count, token) => {
      const current = signalMap.get(token) ?? {
        dreamIds: new Set<string>(),
        hitCount: 0,
        firstSeenAt: dream.createdAt,
        latestSeenAt: dream.createdAt,
      };
      current.dreamIds.add(dream.id);
      current.hitCount += count;
      current.firstSeenAt = Math.min(current.firstSeenAt, dream.createdAt);
      current.latestSeenAt = Math.max(current.latestSeenAt, dream.createdAt);
      signalMap.set(token, current);
    });
  });

  return Array.from(signalMap.entries())
    .map<DreamWordSignal>(([label, entry]) => ({
      label,
      dreamCount: entry.dreamIds.size,
      hitCount: entry.hitCount,
      firstSeenAt: entry.firstSeenAt,
      latestSeenAt: entry.latestSeenAt,
    }))
    .filter(entry => entry.dreamCount >= 2)
    .sort((a, b) => {
      if (b.dreamCount !== a.dreamCount) {
        return b.dreamCount - a.dreamCount;
      }

      if (b.hitCount !== a.hitCount) {
        return b.hitCount - a.hitCount;
      }

      return a.label.localeCompare(b.label);
    })
    .slice(0, limit);
}
