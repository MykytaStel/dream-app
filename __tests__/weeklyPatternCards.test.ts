import { getDreamMoodLabels } from '../src/constants/copy/dreams';
import { getStatsCopy } from '../src/constants/copy/stats';
import type { Dream } from '../src/features/dreams/model/dream';
import { buildWeeklyPatternCards } from '../src/features/stats/model/weeklyPatternCards';

describe('weeklyPatternCards', () => {
  const copy = getStatsCopy('en');
  const moodLabels = getDreamMoodLabels('en');
  const now = new Date('2026-03-11T12:00:00Z').getTime();

  test('highlights the strongest repeated signal from the last seven days', () => {
    const dreams: Dream[] = [
      {
        id: 'bridge-1',
        createdAt: new Date('2026-03-11T08:00:00Z').getTime(),
        title: 'Bridge again',
        text: 'The bridge returned over dark water',
        tags: ['bridge'],
      },
      {
        id: 'bridge-2',
        createdAt: new Date('2026-03-10T08:00:00Z').getTime(),
        title: 'Station and bridge',
        text: 'Another bridge near the station',
        tags: ['bridge'],
      },
      {
        id: 'other-recent',
        createdAt: new Date('2026-03-09T08:00:00Z').getTime(),
        title: 'Kitchen light',
        text: 'A softer dream with no repeat',
        tags: ['light'],
      },
      {
        id: 'previous-week',
        createdAt: new Date('2026-03-04T08:00:00Z').getTime(),
        title: 'Older dream',
        text: 'Outside the recent window',
        tags: ['gate'],
      },
    ];

    expect(
      buildWeeklyPatternCards({
        dreams,
        locale: 'en',
        copy,
        moodLabels,
        now,
      }),
    ).toEqual([
      {
        key: 'rhythm',
        label: copy.weeklyPatternRhythmLabel,
        title: '3 entries this week',
        hint: '+2 vs previous 7 days',
      },
      {
        key: 'signal',
        label: copy.weeklyPatternSignalLabel,
        title: 'Bridge',
        hint: '2 dreams this week',
        signal: 'bridge',
        signalKind: 'theme',
        accent: true,
      },
    ]);
  });

  test('falls back to recent tone when no recurring weekly signal is ready', () => {
    const dreams: Dream[] = [
      {
        id: 'tone-1',
        createdAt: new Date('2026-03-11T08:00:00Z').getTime(),
        title: 'Running late',
        text: 'Late for something without a repeated symbol',
        tags: ['late'],
        mood: 'anxious',
      },
      {
        id: 'tone-2',
        createdAt: new Date('2026-03-10T08:00:00Z').getTime(),
        title: 'Small room',
        text: 'A different scene but the same feeling',
        tags: ['room'],
        mood: 'anxious',
      },
    ];

    const cards = buildWeeklyPatternCards({
      dreams,
      locale: 'en',
      copy,
      moodLabels,
      now,
    });

    expect(cards[1]).toEqual({
      key: 'tone',
      label: copy.weeklyPatternToneLabel,
      title: moodLabels.anxious,
      hint: '2 entries',
    });
  });

  test('stays readable with a single recent dream', () => {
    const dreams: Dream[] = [
      {
        id: 'single',
        createdAt: new Date('2026-03-11T08:00:00Z').getTime(),
        title: 'Single note',
        text: 'Not enough to form a clear pattern yet',
        tags: [],
      },
    ];

    expect(
      buildWeeklyPatternCards({
        dreams,
        locale: 'en',
        copy,
        moodLabels,
        now,
      }),
    ).toEqual([
      {
        key: 'rhythm',
        label: copy.weeklyPatternRhythmLabel,
        title: '1 entry this week',
        hint: '+1 vs previous 7 days',
      },
      {
        key: 'signal',
        label: copy.weeklyPatternSignalLabel,
        title: copy.weeklyPatternStillFormingTitle,
        hint: copy.weeklyPatternStillFormingHint,
      },
    ]);
  });
});
