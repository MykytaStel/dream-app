import {
  DREAM_DRAFT_STORAGE_KEY,
  DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX,
} from '../src/services/storage/keys';
import { kv } from '../src/services/storage/mmkv';
import {
  readDreamDraftForRecovery,
  readDreamEditDraftForRecovery,
} from '../src/features/dreams/services/dreamDraftRecoveryService';
import {
  saveDreamDraft,
  saveDreamEditDraft,
} from '../src/features/dreams/services/dreamDraftService';

const MALFORMED: Array<[string, string]> = [
  ['truncated JSON', '{"title":"Half a dr'],
  ['a string instead of an object', '"just a string"'],
  ['null', 'null'],
  ['an array', '[1,2,3]'],
  ['a number where text belongs', '{"text":42}'],
  ['a string where tags belong', '{"tags":"forest"}'],
  ['a number where audio belongs', '{"audioUri":99}'],
  ['nested invalid values', '{"tags":[{"deep":true}],"mood":{"bad":true}}'],
  ['an empty string', ''],
];

const VALID_DRAFT = {
  title: '',
  text: 'A corridor with blue doors',
  sleepDate: '2026-08-05',
  stressLevel: 2 as const,
  medications: '',
  importantEvents: '',
  healthNotes: '',
  tags: ['corridor'],
};

describe('dream draft recovery boundary', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    kv.clearAll();
  });

  test('reports a missing create draft without changing storage', () => {
    expect(readDreamDraftForRecovery()).toEqual({
      status: 'missing',
      draft: null,
    });
  });

  test.each(MALFORMED)(
    'discards a corrupt create draft stored as %s exactly once',
    (_label, stored) => {
      kv.set(DREAM_DRAFT_STORAGE_KEY, stored);

      expect(readDreamDraftForRecovery()).toEqual({
        status: 'discarded-corrupt',
        draft: null,
      });
      expect(kv.getString(DREAM_DRAFT_STORAGE_KEY)).toBeUndefined();

      expect(readDreamDraftForRecovery()).toEqual({
        status: 'missing',
        draft: null,
      });
    },
  );

  test.each(MALFORMED)(
    'discards a corrupt edit draft stored as %s without touching other keys',
    (_label, stored) => {
      const corruptKey = `${DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX}dream-1`;
      const safeKey = `${DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX}dream-2`;
      kv.set(corruptKey, stored);
      saveDreamEditDraft('dream-2', VALID_DRAFT);

      expect(readDreamEditDraftForRecovery('dream-1')).toEqual({
        status: 'discarded-corrupt',
        draft: null,
      });
      expect(kv.getString(corruptKey)).toBeUndefined();
      expect(kv.getString(safeKey)).toBeDefined();
    },
  );

  test('returns a normalized create draft when stored data is valid', () => {
    saveDreamDraft(VALID_DRAFT);

    const result = readDreamDraftForRecovery();

    expect(result.status).toBe('ready');
    expect(result.draft?.text).toBe('A corridor with blue doors');
    expect(result.draft?.stressLevel).toBe(2);
  });

  test('returns the edit draft for the requested dream only', () => {
    saveDreamEditDraft('dream-1', VALID_DRAFT);
    saveDreamEditDraft('dream-2', {
      ...VALID_DRAFT,
      text: 'A quiet train platform',
    });

    const result = readDreamEditDraftForRecovery('dream-2');

    expect(result.status).toBe('ready');
    expect(result.draft?.text).toBe('A quiet train platform');
  });

  test('discards an edit draft that is not newer than the saved dream', () => {
    jest.spyOn(Date, 'now').mockReturnValue(100);
    saveDreamEditDraft('dream-1', VALID_DRAFT);

    const result = readDreamEditDraftForRecovery('dream-1', 100);

    expect(result).toEqual({
      status: 'discarded-stale',
      draft: null,
    });
    expect(
      kv.getString(`${DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX}dream-1`),
    ).toBeUndefined();
  });

  test('keeps an edit draft that is newer than the saved dream', () => {
    jest.spyOn(Date, 'now').mockReturnValue(200);
    saveDreamEditDraft('dream-1', VALID_DRAFT);

    const result = readDreamEditDraftForRecovery('dream-1', 100);

    expect(result.status).toBe('ready');
    expect(result.draft?.updatedAt).toBe(200);
  });
});
