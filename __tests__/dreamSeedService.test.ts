import { kv } from '../src/services/storage/mmkv';
import { saveDream, listDreams } from '../src/features/dreams/repository/dreamsRepository';
import {
  clearSeedDreams,
  countSeedDreams,
  seedDreamSamples,
} from '../src/features/dreams/services/dreamSeedService';

describe('dream seed service', () => {
  beforeEach(() => {
    kv.clearAll();
  });

  test('adds deterministic sample dreams without removing user entries', () => {
    saveDream({
      id: 'real-dream',
      createdAt: new Date('2026-03-07T08:00:00.000Z').getTime(),
      sleepDate: '2026-03-07',
      text: 'Real entry',
      tags: ['real'],
    });

    expect(seedDreamSamples(250)).toBe(250);
    expect(countSeedDreams()).toBe(250);
    expect(listDreams().some(dream => dream.id === 'real-dream')).toBe(true);

    expect(seedDreamSamples(1000)).toBe(1000);
    expect(countSeedDreams()).toBe(1000);
    expect(listDreams().some(dream => dream.id === 'real-dream')).toBe(true);
  });

  test('clears only generated sample dreams', () => {
    saveDream({
      id: 'real-dream',
      createdAt: new Date('2026-03-07T08:00:00.000Z').getTime(),
      sleepDate: '2026-03-07',
      text: 'Real entry',
      tags: ['real'],
    });

    seedDreamSamples(250);
    clearSeedDreams();

    expect(countSeedDreams()).toBe(0);
    expect(listDreams().map(dream => dream.id)).toEqual(['real-dream']);
  });
});
