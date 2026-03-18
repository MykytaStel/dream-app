import { getStatsCopy } from '../src/constants/copy/stats';
import { getMemoryNudge } from '../src/features/stats/model/statsScreenModel';
import type { Dream } from '../src/features/dreams/model/dream';
import type {
  DreamReflectionSignal,
  DreamWordSignal,
} from '../src/features/stats/model/dreamReflection';

describe('statsMemoryNudge', () => {
  const copy = getStatsCopy('en');

  test('prefers reopening a dream tied to the top recurring theme', () => {
    const dreams: Dream[] = [
      {
        id: 'theme-dream',
        createdAt: new Date('2026-03-10T08:00:00Z').getTime(),
        title: 'Bridge over dark water',
        tags: ['bridge'],
        transcript: 'Crossing the bridge again',
      },
      {
        id: 'other-dream',
        createdAt: new Date('2026-03-09T08:00:00Z').getTime(),
        title: 'Hallway',
        tags: ['hallway'],
      },
    ];
    const recurringThemes: DreamReflectionSignal[] = [
      {
        label: 'bridge',
        dreamCount: 2,
        tagHits: 2,
        transcriptHits: 1,
        source: 'mixed',
        firstSeenAt: new Date('2026-03-09T08:00:00Z').getTime(),
        latestSeenAt: new Date('2026-03-10T08:00:00Z').getTime(),
      },
    ];
    const recurringWords: DreamWordSignal[] = [];
    const recurringSymbols: DreamReflectionSignal[] = [];

    expect(
      getMemoryNudge(dreams, copy, recurringThemes, recurringWords, recurringSymbols),
    ).toEqual({
      dreamId: 'theme-dream',
      dreamTitle: 'Bridge over dark water',
      reason: `${copy.memoryNudgeThemeReasonPrefix}bridge${copy.memoryNudgeThemeReasonSuffix}`,
      badgeLabel: copy.memoryNudgeThemeBadge,
      actionLabel: copy.memoryNudgeActionReflection,
      focusSection: 'reflection',
      icon: 'sparkles-outline',
    });
  });

  test('falls back to transcript cleanup when no recurring signal is ready', () => {
    const now = new Date('2026-03-11T12:00:00Z').getTime();
    const dreams: Dream[] = [
      {
        id: 'audio-dream',
        createdAt: new Date('2026-03-11T08:00:00Z').getTime(),
        title: 'Voice capture only',
        audioUri: 'file:///dream.m4a',
        tags: [],
      },
    ];

    expect(getMemoryNudge(dreams, copy, [], [], [], now)).toEqual({
      dreamId: 'audio-dream',
      dreamTitle: 'Voice capture only',
      reason: copy.memoryNudgeTranscriptReason,
      badgeLabel: copy.memoryNudgeTranscriptBadge,
      actionLabel: copy.memoryNudgeActionTranscript,
      focusSection: 'transcript',
      icon: 'document-text-outline',
    });
  });

  test('uses a time-based nudge before transcript cleanup when a resurfacing window matches', () => {
    const now = new Date('2026-03-11T12:00:00Z').getTime();
    const dreams: Dream[] = [
      {
        id: 'time-capsule',
        createdAt: new Date('2026-02-09T08:00:00Z').getTime(),
        title: 'Airport gate',
        text: 'Walking toward a gate that kept moving',
        tags: [],
      },
      {
        id: 'audio-dream',
        createdAt: new Date('2026-03-11T08:00:00Z').getTime(),
        title: 'Voice capture only',
        audioUri: 'file:///dream.m4a',
        tags: [],
      },
    ];

    expect(getMemoryNudge(dreams, copy, [], [], [], now)).toEqual({
      dreamId: 'time-capsule',
      dreamTitle: 'Airport gate',
      reason: `${copy.memoryNudgeTimeReasonPrefix}${copy.memoryNudgeTimeMonth}${copy.memoryNudgeTimeReasonSuffix}`,
      badgeLabel: copy.memoryNudgeTimeBadge,
      actionLabel: copy.memoryNudgeActionTime,
      focusSection: 'written',
      icon: 'time-outline',
    });
  });
});
