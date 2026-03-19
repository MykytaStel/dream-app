import { buildDreamWidgetSnapshot } from '../src/features/widgets/model/dreamWidget';
import type { Dream } from '../src/features/dreams/model/dream';

describe('dreamWidget', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-19T12:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test('prioritizes an unfinished draft over other widget states', () => {
    const snapshot = buildDreamWidgetSnapshot({
      dreams: [],
      locale: 'en',
      now: new Date('2026-03-19T07:00:00Z').getTime(),
      draftSnapshot: {
        resumeMode: 'voice',
        hasAudio: true,
        hasText: false,
        wordCount: 0,
        hasWakeSignals: false,
        hasContext: false,
        hasTags: false,
      },
    });

    expect(snapshot).toMatchObject({
      state: 'draft',
      privacyMode: 'redacted',
      title: 'Continue draft',
      subtitle: 'Your unfinished capture is waiting.',
      primaryAction: {
        label: 'Continue draft',
        url: 'dreamapp://draft',
      },
      secondaryAction: {
        label: 'Wake capture',
        url: 'dreamapp://capture',
      },
    });
  });

  test('builds a redacted revisit widget when an older dream is worth reopening', () => {
    const now = new Date('2026-03-19T12:00:00Z').getTime();
    const dreams: Dream[] = [
      {
        id: 'bridge-thread',
        createdAt: now - 24 * 60 * 60 * 1000,
        title: 'Bridge again',
        text: 'Bridge over water',
        tags: ['bridge', 'water'],
      },
      {
        id: 'older-match',
        createdAt: now - 72 * 60 * 60 * 1000,
        title: 'Water returned',
        text: 'Water and bridge again',
        tags: ['bridge'],
      },
    ];

    const snapshot = buildDreamWidgetSnapshot({
      dreams,
      locale: 'en',
      now,
    });

    expect(snapshot).toMatchObject({
      state: 'revisit',
      privacyMode: 'redacted',
      title: 'Revisit now',
      meta: 'Thread nearby',
      primaryAction: {
        label: 'Open thread',
        url: 'dreamapp://dream/bridge-thread',
      },
      secondaryAction: {
        label: 'Wake capture',
        url: 'dreamapp://capture',
      },
    });
    expect(snapshot.subtitle).toContain('Thread with 1 nearby dreams');
    expect(snapshot.subtitle).not.toContain('Bridge again');
  });

  test('falls back to a light insight state when there is no draft or revisit cue', () => {
    const now = new Date('2026-03-19T12:00:00Z').getTime();
    const dreams: Dream[] = [
      {
        id: 'today',
        createdAt: now - 60 * 60 * 1000,
        sleepDate: '2026-03-19',
        title: 'Short fragment',
        tags: [],
      },
    ];

    const snapshot = buildDreamWidgetSnapshot({
      dreams,
      locale: 'en',
      now,
    });

    expect(snapshot).toMatchObject({
      state: 'insight',
      title: '1 day streak',
      subtitle: 'A small local read from the dreams you already saved.',
      meta: '1 entry this week',
      primaryAction: {
        label: 'Wake capture',
        url: 'dreamapp://capture',
      },
      secondaryAction: {
        label: 'Memory',
        url: 'dreamapp://memory',
      },
    });
  });

  test('starts from capture when the archive is empty', () => {
    const snapshot = buildDreamWidgetSnapshot({
      dreams: [],
      locale: 'en',
      now: new Date('2026-03-19T07:00:00Z').getTime(),
    });

    expect(snapshot).toMatchObject({
      state: 'empty',
      title: 'Wake capture',
      subtitle: 'Start with a fragment, feeling, or image before it fades.',
      meta: 'Private on device',
      primaryAction: {
        label: 'Wake capture',
        url: 'dreamapp://capture',
      },
      secondaryAction: {
        label: 'Memory',
        url: 'dreamapp://memory',
      },
    });
  });
});
