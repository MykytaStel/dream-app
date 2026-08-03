import { kv } from '../src/services/storage/mmkv';
import {
  DREAM_DRAFT_STORAGE_KEY,
  DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX,
} from '../src/services/storage/keys';
import {
  getDreamDraft,
  getDreamDraftSnapshot,
  getDreamEditDraft,
} from '../src/features/dreams/services/dreamDraftService';

/**
 * A draft that survived a crash mid-write, an interrupted migration, or a
 * version of this app that stored a field differently.
 *
 * The composer reads a draft before it can render, so a throw here is not a
 * lost draft — it is a screen that will not open, on the one path the whole
 * product depends on. Losing the draft is acceptable; losing the composer is
 * not, and the difference is entirely in whether the read is defensive.
 *
 * Broken JSON is the obvious case and was already handled. These are the ones
 * that are harder to see: text that parses perfectly and is the wrong shape.
 */
const MALFORMED: Array<[string, string]> = [
  ['truncated mid-write', '{"title":"Half a dr'],
  ['not an object', '"just a string"'],
  ['null', 'null'],
  ['an array', '[1,2,3]'],
  ['a number where text belongs', '{"text":42}'],
  ['a string where tags belong', '{"tags":"forest"}'],
  ['a number where the audio path belongs', '{"audioUri":99}'],
  ['nested nonsense', '{"tags":[{"deep":true}],"mood":{"not":"a mood"}}'],
  ['empty', ''],
];

describe('a draft that cannot be trusted', () => {
  beforeEach(() => {
    kv.clearAll();
  });

  test.each(MALFORMED)('the new-dream draft survives %s', (_label, stored) => {
    kv.set(DREAM_DRAFT_STORAGE_KEY, stored);

    // Null is a fine answer. Throwing is not: the composer reads this on the
    // way to its first render.
    expect(() => getDreamDraft()).not.toThrow();
  });

  test.each(MALFORMED)('an edit draft survives %s', (_label, stored) => {
    kv.set(`${DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX}dream-1`, stored);

    expect(() => getDreamEditDraft('dream-1')).not.toThrow();
  });

  test('the widget snapshot survives a draft it cannot read', () => {
    kv.set(DREAM_DRAFT_STORAGE_KEY, '{"tags":"forest"}');

    // The snapshot feeds a home-screen widget, which is rendered by the OS
    // outside this app's error handling.
    expect(() => getDreamDraftSnapshot()).not.toThrow();
  });

  test('a readable draft is still read', () => {
    // The guard must not be a blanket "return null on anything unexpected".
    kv.set(
      DREAM_DRAFT_STORAGE_KEY,
      JSON.stringify({
        title: 'The long corridor',
        text: 'It kept going',
        sleepDate: '2026-08-03',
        medications: '',
        importantEvents: '',
        healthNotes: '',
        tags: ['corridor'],
        updatedAt: 1_762_000_000_000,
      }),
    );

    expect(getDreamDraft()?.text).toBe('It kept going');
  });
});
