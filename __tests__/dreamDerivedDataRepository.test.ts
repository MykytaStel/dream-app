jest.mock('../src/features/widgets/services/dreamWidgetSyncService', () => ({
  scheduleDreamWidgetSync: jest.fn(),
}));

jest.mock('../src/features/stats/services/reviewShelfStateService', () => ({
  reconcileDerivedReviewState: jest.fn(),
}));

jest.mock('../src/services/observability/errorReporting', () => ({
  reportError: jest.fn(),
}));

import type { Dream } from '../src/features/dreams/model/dream';
import {
  inspectDreamDerivedData,
  rebuildDreamDerivedData,
} from '../src/features/dreams/repository/dreamDerivedDataRepository';
import { replaceAllDreams } from '../src/features/dreams/repository/dreamsRepository';
import {
  DREAMS_INDEX_STORAGE_KEY,
  DREAMS_META_STORAGE_KEY,
  DREAMS_STORAGE_KEY,
} from '../src/services/storage/keys';
import { kv } from '../src/services/storage/mmkv';

function dreams(): Dream[] {
  return [
    {
      id: 'dream-newer',
      createdAt: 1_800_000_000_000,
      updatedAt: 1_800_000_100_000,
      title: '  Newer dream  ',
      text: 'Written content',
      sleepDate: '2027-01-02',
      archivedAt: undefined,
      starredAt: 1_800_000_200_000,
      audioUri: 'file:///audio/newer.m4a',
      mood: 'surreal',
      tags: ['sky'],
    },
    {
      id: 'dream-older',
      createdAt: 1_700_000_000_000,
      updatedAt: 1_900_000_100_000,
      transcript: 'Transcript only',
      sleepDate: '2023-11-14',
      archivedAt: 1_700_000_200_000,
      mood: 'peaceful',
      tags: [],
    },
  ];
}

describe('dream derived data repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    kv.clearAll();
  });

  test('writes the exact index/meta format produced by the primary repository', () => {
    const source = dreams();
    replaceAllDreams(source);

    const primaryIndex = kv.getString(DREAMS_INDEX_STORAGE_KEY);
    const primaryMeta = kv.getString(DREAMS_META_STORAGE_KEY);
    const primaryDreams = kv.getString(DREAMS_STORAGE_KEY);

    kv.remove(DREAMS_INDEX_STORAGE_KEY);
    kv.remove(DREAMS_META_STORAGE_KEY);
    rebuildDreamDerivedData(source);

    expect(kv.getString(DREAMS_INDEX_STORAGE_KEY)).toBe(primaryIndex);
    expect(kv.getString(DREAMS_META_STORAGE_KEY)).toBe(primaryMeta);
    expect(kv.getString(DREAMS_STORAGE_KEY)).toBe(primaryDreams);
  });

  test('classifies canonical sleep-date order and modern moods as current', () => {
    const source = dreams();
    rebuildDreamDerivedData(source);

    const storedIndex = JSON.parse(
      kv.getString(DREAMS_INDEX_STORAGE_KEY) ?? '[]',
    ) as Array<{ id: string; mood?: string }>;
    expect(storedIndex.map(item => item.id)).toEqual([
      'dream-newer',
      'dream-older',
    ]);
    expect(storedIndex.map(item => item.mood)).toEqual(['surreal', 'peaceful']);
    expect(inspectDreamDerivedData(source)).toMatchObject({
      indexStatus: 'current',
      metaStatus: 'current',
      expectedIndexCount: 2,
      expectedMonthCount: 2,
    });
  });

  test('classifies missing, invalid and stale stores without writes', () => {
    const source = dreams();
    rebuildDreamDerivedData(source);

    kv.remove(DREAMS_INDEX_STORAGE_KEY);
    kv.set(DREAMS_META_STORAGE_KEY, '{broken');
    expect(inspectDreamDerivedData(source)).toMatchObject({
      indexStatus: 'missing',
      metaStatus: 'invalid',
    });
    expect(kv.getString(DREAMS_INDEX_STORAGE_KEY)).toBeUndefined();
    expect(kv.getString(DREAMS_META_STORAGE_KEY)).toBe('{broken');

    kv.set(DREAMS_INDEX_STORAGE_KEY, '[]');
    kv.set(
      DREAMS_META_STORAGE_KEY,
      JSON.stringify({
        totalCount: 0,
        activeCount: 0,
        archivedCount: 0,
        starredCount: 0,
        audioOnlyCount: 0,
        monthKeys: [],
      }),
    );
    expect(inspectDreamDerivedData(source)).toMatchObject({
      indexStatus: 'stale',
      metaStatus: 'stale',
    });
  });

  test('rejects partially valid cached structures instead of normalizing them silently', () => {
    const source = dreams();
    kv.set(
      DREAMS_INDEX_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'dream-newer',
          createdAt: 1_800_000_000_000,
          hasAudio: true,
        },
        { id: '', createdAt: 1_700_000_000_000 },
      ]),
    );
    kv.set(
      DREAMS_META_STORAGE_KEY,
      JSON.stringify({
        totalCount: 2,
        monthKeys: ['2027-01', 2023],
      }),
    );

    expect(inspectDreamDerivedData(source)).toMatchObject({
      indexStatus: 'invalid',
      metaStatus: 'invalid',
    });
  });
});
