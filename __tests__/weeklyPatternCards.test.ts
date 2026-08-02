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

  test('one repetition is enough to bring it back', () => {
    // The other half of the rule. Hiding the section must not become "never
    // show it": the moment a signal appears in two dreams there is something
    // to read, and the count regains its meaning beside it.
    const dreams: Dream[] = [
      {
        id: 'first',
        createdAt: new Date('2026-03-10T08:00:00Z').getTime(),
        title: 'Glass hallway',
        text: 'A hallway of glass.',
        tags: ['glass'],
      },
      {
        id: 'second',
        createdAt: new Date('2026-03-11T08:00:00Z').getTime(),
        title: 'Glass again',
        text: 'The glass hallway once more.',
        tags: ['glass'],
      },
    ];

    const cards = buildWeeklyPatternCards({
      dreams,
      locale: 'en',
      copy,
      moodLabels,
      now,
    });

    expect(cards.length).toBeGreaterThan(0);
    expect(cards[0].key).toBe('rhythm');
  });

  test('a week with nothing to say says nothing', () => {
    // This used to assert the opposite: that a single dream still produced two
    // cards. It did — "1 entry this week" beside "a pattern is still forming",
    // under a heading promising a calm read of the last seven days. Three ways
    // of saying "you wrote once", directly above a timeline showing the entry.
    //
    // The rhythm card is a count and the lead card is a placeholder, so when
    // neither a signal, a tone, a context nor a capture habit has anything in
    // it, there is no pattern to read and the section hides itself.
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
      buildWeeklyPatternCards({ dreams, locale: 'en', copy, moodLabels, now }),
    ).toEqual([]);
  });
});
