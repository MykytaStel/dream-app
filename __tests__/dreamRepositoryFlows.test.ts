import { kv } from '../src/services/storage/mmkv';
import {
  archiveDream,
  deleteDream,
  getDream,
  listDreams,
  saveDream,
  unarchiveDream,
} from '../src/features/dreams/repository/dreamsRepository';

describe('dream repository flows', () => {
  beforeEach(() => {
    kv.clearAll();
  });

  test('create and edit use same sanitize/update rules', () => {
    saveDream({
      id: 'dream-1',
      createdAt: 1710000000000,
      sleepDate: '2026-03-06',
      title: '  First title  ',
      text: '  initial text ',
      tags: ['  Blue Sky ', 'blue-sky', 'night walk'],
      mood: 'neutral',
      sleepContext: {
        stressLevel: 1,
        alcoholTaken: false,
        medications: '  Mg ',
      },
    });

    saveDream({
      id: 'dream-1',
      createdAt: 1710000000000,
      sleepDate: '2026-03-06',
      title: '  Updated title ',
      text: ' updated text  ',
      tags: [' lucid  dream ', 'LUCID dream'],
      mood: 'positive',
      sleepContext: {
        stressLevel: 2,
        alcoholTaken: true,
        medications: '  ',
        importantEvents: '  demo day  ',
      },
    });

    const all = listDreams();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('Updated title');
    expect(all[0].text).toBe('updated text');
    expect(all[0].tags).toEqual(['lucid-dream']);
    expect(all[0].sleepContext).toEqual({
      stressLevel: 2,
      alcoholTaken: true,
      importantEvents: 'demo day',
    });
  });

  test('archive, filter and delete flow is consistent', () => {
    saveDream({
      id: 'a',
      createdAt: 1710000000000,
      sleepDate: '2026-03-04',
      text: 'A',
      tags: [],
    });
    saveDream({
      id: 'b',
      createdAt: 1710001000000,
      sleepDate: '2026-03-05',
      text: 'B',
      tags: [],
    });

    archiveDream('a');
    let all = listDreams();
    expect(all.filter(dream => !dream.archivedAt)).toHaveLength(1);
    expect(all.filter(dream => Boolean(dream.archivedAt))).toHaveLength(1);
    expect(getDream('a')?.archivedAt).toBeDefined();

    unarchiveDream('a');
    all = listDreams();
    expect(all.filter(dream => !dream.archivedAt)).toHaveLength(2);
    expect(all.filter(dream => Boolean(dream.archivedAt))).toHaveLength(0);

    deleteDream('b');
    all = listDreams();
    expect(all.map(dream => dream.id)).toEqual(['a']);
  });

  test('keeps stable sort by sleepDate desc then createdAt desc', () => {
    saveDream({
      id: 'x',
      createdAt: 1710000000000,
      sleepDate: '2026-03-06',
      text: 'X',
      tags: [],
    });
    saveDream({
      id: 'y',
      createdAt: 1710002000000,
      sleepDate: '2026-03-05',
      text: 'Y',
      tags: [],
    });
    saveDream({
      id: 'z',
      createdAt: 1710001000000,
      sleepDate: '2026-03-06',
      text: 'Z',
      tags: [],
    });

    expect(listDreams().map(dream => dream.id)).toEqual(['z', 'x', 'y']);
  });

  test('preserves sleep context booleans and trims optional text', () => {
    saveDream({
      id: 'ctx',
      createdAt: 1710000000000,
      sleepDate: '2026-03-01',
      text: 'context',
      tags: [],
      sleepContext: {
        stressLevel: 0,
        alcoholTaken: false,
        caffeineLate: false,
        medications: '  melatonin ',
        importantEvents: '   ',
        healthNotes: '  headache ',
      },
    });

    expect(getDream('ctx')?.sleepContext).toEqual({
      stressLevel: 0,
      alcoholTaken: false,
      caffeineLate: false,
      medications: 'melatonin',
      healthNotes: 'headache',
    });
  });

  test('rejects invalid captures before writing to storage', () => {
    expect(() =>
      saveDream({
        id: 'invalid-title-only',
        createdAt: 1710000000000,
        sleepDate: '2026-03-06',
        title: 'Only title',
        tags: [],
      }),
    ).toThrow('missing-content');

    expect(() =>
      saveDream({
        id: 'invalid-date',
        createdAt: 1710000000000,
        sleepDate: '2026-02-30',
        text: 'body',
        tags: [],
      }),
    ).toThrow('invalid-sleep-date');

    expect(listDreams()).toEqual([]);
  });
});
