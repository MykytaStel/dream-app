import {
  getDreamCopy,
  getDreamMoodLabels,
} from '../src/constants/copy/dreams';
import type { DreamAnalysisSettings } from '../src/features/analysis/model/dreamAnalysis';
import type { Dream } from '../src/features/dreams/model/dream';
import { getRelatedDreams } from '../src/features/dreams/model/relatedDreams';
import { getDreamDetailViewModel } from '../src/features/dreams/model/dreamDetailPresentation';

describe('dreamDetailPresentation', () => {
  const copy = getDreamCopy('en');
  const moodLabels = getDreamMoodLabels('en');
  const analysisSettings: DreamAnalysisSettings = {
    enabled: true,
    provider: 'manual',
    allowNetwork: false,
  };

  test('builds reflection prompts from signals, mood, and related dreams', () => {
    const dream: Dream = {
      id: 'dream-1',
      createdAt: 1,
      sleepDate: '2026-03-11',
      text: 'I kept crossing the bridge over dark water.',
      tags: ['bridge', 'water'],
      mood: 'negative',
    };
    const olderDream: Dream = {
      id: 'dream-2',
      createdAt: 2,
      sleepDate: '2026-03-09',
      text: 'A bridge returned near the river again.',
      tags: ['bridge'],
    };

    const viewModel = getDreamDetailViewModel({
      dream,
      copy,
      moodLabels,
      analysisSettings,
      relatedDreams: getRelatedDreams(dream, [dream, olderDream]),
      isTranscribingAudio: false,
    });

    expect(viewModel.reflectionPrompts).toHaveLength(3);
    expect(viewModel.reflectionPrompts[0].body).toContain('bridge');
    expect(viewModel.reflectionPrompts[1].body).toContain(moodLabels.negative);
    expect(viewModel.reflectionPrompts[2].body).toContain('1 match');
  });

  test('falls back to a capture prompt when the dream is still sparse', () => {
    const dream: Dream = {
      id: 'dream-audio',
      createdAt: 3,
      sleepDate: '2026-03-11',
      audioUri: 'file:///dream.m4a',
      tags: [],
    };

    const viewModel = getDreamDetailViewModel({
      dream,
      copy,
      moodLabels,
      analysisSettings,
      relatedDreams: [],
      isTranscribingAudio: false,
    });

    expect(viewModel.followUpPrompt?.title).toBe(copy.postSaveFollowUpTranscriptTitle);
    expect(viewModel.followUpPrompt?.actionLabel).toBe(copy.detailTranscribeAudio);
  });

  test('surfaces transcript cleanup as the next step when generated text was not edited yet', () => {
    const dream: Dream = {
      id: 'dream-transcript',
      createdAt: new Date('2026-03-11T08:00:00Z').getTime(),
      sleepDate: '2026-03-11',
      audioUri: 'file:///dream.m4a',
      transcript: 'There was a station and a loud bell',
      transcriptSource: 'generated',
      tags: [],
    };

    const viewModel = getDreamDetailViewModel({
      dream,
      copy,
      moodLabels,
      analysisSettings,
      relatedDreams: [],
      isTranscribingAudio: false,
    });

    expect(viewModel.followUpPrompt).toEqual(
      expect.objectContaining({
        title: copy.detailReflectionTranscriptTitle,
        actionLabel: copy.detailGeneratedTranscriptEdit,
        actionKind: 'transcript',
      }),
    );
  });

  test('uses a resurfacing follow-up when the dream lands in a return window', () => {
    const dream: Dream = {
      id: 'dream-time',
      createdAt: new Date('2026-02-09T08:00:00Z').getTime(),
      sleepDate: '2026-02-09',
      title: 'Airport gate',
      text:
        'Walking toward a gate that kept moving while the hall stayed empty, and every announcement felt delayed by a few seconds as if the whole airport was trying to hold me in one place. I remember the cold blue light, the silent floor buffer, the repeating boarding calls, the paper ticket in my hand, and a strong sense that I was already late for something important.',
      tags: [],
    };

    const viewModel = getDreamDetailViewModel({
      dream,
      copy,
      moodLabels,
      analysisSettings,
      relatedDreams: [],
      isTranscribingAudio: false,
      now: new Date('2026-03-11T12:00:00Z').getTime(),
    });

    expect(viewModel.followUpPrompt).toEqual(
      expect.objectContaining({
        title: copy.detailReflectionResurfaceTitle,
        actionLabel: copy.detailReflectionActionEdit,
        actionKind: 'edit',
      }),
    );
    expect(viewModel.followUpPrompt?.body).toContain(copy.homeSpotlightRevisitTimeMonth);
  });

  test('surfaces a local-only audio sync hint when the voice note has not reached backup yet', () => {
    const dream: Dream = {
      id: 'dream-audio-sync',
      createdAt: Date.UTC(2026, 2, 11, 8, 0),
      sleepDate: '2026-03-11',
      audioUri: 'file:///dream.m4a',
      syncStatus: 'local',
      tags: [],
    };

    const viewModel = getDreamDetailViewModel({
      dream,
      copy,
      moodLabels,
      analysisSettings,
      relatedDreams: [],
      isTranscribingAudio: false,
    });

    expect(viewModel.audioSyncHint).toBe(copy.detailAudioSyncLocal);
  });

  test('surfaces a transcript sync hint when local transcript edits are newer than cloud', () => {
    const dream: Dream = {
      id: 'dream-transcript-sync',
      createdAt: Date.UTC(2026, 2, 11, 8, 0),
      sleepDate: '2026-03-11',
      transcript: 'A cleaned transcript',
      transcriptSource: 'edited',
      transcriptUpdatedAt: Date.UTC(2026, 2, 11, 8, 30),
      syncStatus: 'synced',
      lastSyncedAt: Date.UTC(2026, 2, 11, 8, 10),
      tags: [],
    };

    const viewModel = getDreamDetailViewModel({
      dream,
      copy,
      moodLabels,
      analysisSettings,
      relatedDreams: [],
      isTranscribingAudio: false,
    });

    expect(viewModel.transcriptSyncHint).toBe(copy.detailTranscriptSyncLocal);
  });
});
