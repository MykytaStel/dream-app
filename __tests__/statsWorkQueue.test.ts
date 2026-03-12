import { getStatsCopy } from '../src/constants/copy/stats';
import type { DreamAnalysisSettings } from '../src/features/analysis/model/dreamAnalysis';
import type { Dream } from '../src/features/dreams/model/dream';
import { getMemoryWorkQueue } from '../src/features/stats/model/statsScreenModel';

describe('statsWorkQueue', () => {
  const copy = getStatsCopy('en');
  const analysisSettings: DreamAnalysisSettings = {
    enabled: true,
    provider: 'manual',
    allowNetwork: false,
  };

  test('builds a local work queue for transcript generation, transcript cleanup, and analysis', () => {
    const dreams: Dream[] = [
      {
        id: 'audio-raw',
        createdAt: new Date('2026-03-11T08:00:00Z').getTime(),
        title: 'Raw voice note',
        audioUri: 'file:///raw.m4a',
        tags: [],
      },
      {
        id: 'audio-generated',
        createdAt: new Date('2026-03-10T08:00:00Z').getTime(),
        title: 'Generated transcript',
        audioUri: 'file:///generated.m4a',
        transcript: 'There was a station and a loud bell again',
        transcriptSource: 'generated',
        tags: [],
      },
      {
        id: 'analysis-ready',
        createdAt: new Date('2026-03-09T08:00:00Z').getTime(),
        title: 'Bridge over water',
        text:
          'I kept crossing the bridge over dark water while a distant crowd watched from the shore, and the same image returned several times before I woke up.',
        tags: ['bridge', 'water'],
        mood: 'negative',
      },
    ];

    expect(getMemoryWorkQueue(dreams, copy, analysisSettings)).toEqual([
      {
        dreamId: 'audio-raw',
        dreamTitle: 'Raw voice note',
        reason: copy.workQueueTranscriptGenerateReason,
        badgeLabel: copy.memoryNudgeTranscriptBadge,
        actionLabel: copy.workQueueTranscriptActionGenerate,
        focusSection: 'transcript',
        icon: 'document-text-outline',
      },
      {
        dreamId: 'audio-generated',
        dreamTitle: 'Generated transcript',
        reason: copy.workQueueTranscriptEditReason,
        badgeLabel: copy.memoryNudgeTranscriptBadge,
        actionLabel: copy.workQueueTranscriptActionEdit,
        focusSection: 'transcript',
        icon: 'create-outline',
      },
      {
        dreamId: 'analysis-ready',
        dreamTitle: 'Bridge over water',
        reason: copy.workQueueAnalysisReason,
        badgeLabel: copy.workQueueAnalysisBadge,
        actionLabel: copy.workQueueAnalysisActionGenerate,
        focusSection: 'analysis',
        icon: 'sparkles-outline',
      },
    ]);
  });

  test('does not duplicate the same dream across transcript and analysis tasks', () => {
    const dreams: Dream[] = [
      {
        id: 'same-dream',
        createdAt: new Date('2026-03-11T08:00:00Z').getTime(),
        title: 'One dream only',
        audioUri: 'file:///raw.m4a',
        transcript: 'Generated but not edited',
        transcriptSource: 'generated',
        tags: ['station'],
      },
    ];

    expect(getMemoryWorkQueue(dreams, copy, analysisSettings)).toEqual([
      {
        dreamId: 'same-dream',
        dreamTitle: 'One dream only',
        reason: copy.workQueueTranscriptEditReason,
        badgeLabel: copy.memoryNudgeTranscriptBadge,
        actionLabel: copy.workQueueTranscriptActionEdit,
        focusSection: 'transcript',
        icon: 'create-outline',
      },
    ]);
  });
});
