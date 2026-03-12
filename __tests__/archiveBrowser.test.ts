import { getDreamCopy } from '../src/constants/copy/dreams';
import { getArchiveRevisitCue } from '../src/features/dreams/model/archiveBrowser';
import type { Dream } from '../src/features/dreams/model/dream';

describe('archiveBrowser', () => {
  const copy = getDreamCopy('en');

  test('prefers an important older dream for archive revisit cue', () => {
    const now = new Date('2026-03-11T12:00:00Z').getTime();
    const dreams: Dream[] = [
      {
        id: 'important-dream',
        createdAt: now - 24 * 60 * 60 * 1000,
        title: 'Train station',
        starredAt: now - 23 * 60 * 60 * 1000,
        tags: [],
      },
      {
        id: 'analysis-dream',
        createdAt: now - 36 * 60 * 60 * 1000,
        title: 'Quiet hall',
        analysis: {
          provider: 'manual',
          status: 'ready',
          summary: 'A hall dream',
        },
        tags: [],
      },
    ];

    expect(getArchiveRevisitCue(dreams, copy, now)).toEqual({
      dreamId: 'important-dream',
      title: 'Train station',
      reason: copy.archiveRevisitReasonImportant,
      contextLabel: copy.archiveRevisitContextImportant,
      actionLabel: copy.archiveRevisitAction,
      icon: 'star-outline',
    });
  });

  test('ignores dreams that are still too fresh to revisit', () => {
    const now = new Date('2026-03-11T12:00:00Z').getTime();
    const dreams: Dream[] = [
      {
        id: 'fresh',
        createdAt: now - 2 * 60 * 60 * 1000,
        title: 'Too fresh',
        starredAt: now - 90 * 60 * 1000,
        tags: [],
      },
    ];

    expect(getArchiveRevisitCue(dreams, copy, now)).toBeNull();
  });
});
