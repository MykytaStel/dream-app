import { Dream } from '../src/features/dreams/model/dream';
import {
  isValidSleepDate,
  normalizeTags,
  sanitizeDream,
  sortDreamsStable,
} from '../src/features/dreams/model/dreamRules';

describe('dreamRules', () => {
  test('validates sleep date format and calendar correctness', () => {
    expect(isValidSleepDate('2026-03-06')).toBe(true);
    expect(isValidSleepDate('2026-02-29')).toBe(false);
    expect(isValidSleepDate('2026-13-01')).toBe(false);
    expect(isValidSleepDate('06-03-2026')).toBe(false);
  });

  test('normalizes tags to lower-case, dash-separated unique list', () => {
    expect(
      normalizeTags(['  Blue Sky ', 'blue-sky', '  lucid   Dream ', '', 'Lucid Dream']),
    ).toEqual(['blue-sky', 'lucid-dream']);
  });

  test('sanitizes dream payload consistently', () => {
    const createdAt = new Date('2026-03-06T12:00:00.000Z').getTime();
    const dream: Dream = {
      id: 'dream-1',
      createdAt,
      sleepDate: '2026-02-31',
      title: '  Night Run  ',
      text: '  Text body  ',
      tags: ['  Portal ', 'portal', ' lucid dream '],
      mood: 'positive',
      sleepContext: {
        alcoholTaken: false,
        medications: '  melatonin  ',
        importantEvents: '   ',
      },
    };

    const sanitized = sanitizeDream(dream);
    expect(sanitized.title).toBe('Night Run');
    expect(sanitized.text).toBe('Text body');
    expect(sanitized.tags).toEqual(['portal', 'lucid-dream']);
    expect(sanitized.sleepDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(sanitized.sleepContext).toEqual({
      alcoholTaken: false,
      medications: 'melatonin',
      importantEvents: undefined,
      caffeineLate: undefined,
      healthNotes: undefined,
      stressLevel: undefined,
    });
  });

  test('sorts dreams by sleepDate desc, createdAt desc, id desc', () => {
    const dreams: Dream[] = [
      { id: 'a', createdAt: 100, sleepDate: '2026-03-06', tags: [] },
      { id: 'c', createdAt: 110, sleepDate: '2026-03-05', tags: [] },
      { id: 'b', createdAt: 120, sleepDate: '2026-03-06', tags: [] },
      { id: 'd', createdAt: 120, sleepDate: '2026-03-06', tags: [] },
    ];

    expect(sortDreamsStable(dreams).map(dream => dream.id)).toEqual(['d', 'b', 'a', 'c']);
  });
});
