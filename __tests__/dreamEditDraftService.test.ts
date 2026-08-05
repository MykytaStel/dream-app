import { kv } from '../src/services/storage/mmkv';
import {
  clearDreamEditDraft,
  getDreamEditDraft,
  getDreamDraft,
  saveDreamEditDraft,
} from '../src/features/dreams/services/dreamDraftService';

/**
 * The draft kept while someone edits a dream they already saved.
 *
 * Editing had no draft at all: the composer only wrote one in create mode, so
 * a call arriving mid-edit lost every change made since the screen opened.
 * The dream itself survived, which is why this went unnoticed — nothing was
 * corrupted, the work was simply gone.
 *
 * It cannot share the one draft key. That key feeds the widget and the home
 * screen's resume card, and an edit in progress showing up there would invite
 * someone to "continue" a dream they are already inside of.
 */

const DREAM_ID = 'dream-1';

function draft(overrides: Parameters<typeof saveDreamEditDraft>[1]) {
  return overrides;
}

const BASE = {
  title: 'The house with no stairs',
  text: 'Every door opened onto the same room.',
  sleepDate: '2026-08-02',
  medications: '',
  importantEvents: '',
  healthNotes: '',
  tags: [],
};

describe('the draft kept while editing a saved dream', () => {
  beforeEach(() => {
    kv.clearAll();
    jest.restoreAllMocks();
  });

  test('a saved edit comes back for the dream it belongs to', () => {
    saveDreamEditDraft(DREAM_ID, draft({ ...BASE, text: 'Half a sentence' }));

    expect(getDreamEditDraft(DREAM_ID)?.text).toBe('Half a sentence');
  });

  test('one dream cannot read another dream half-written', () => {
    saveDreamEditDraft(DREAM_ID, draft({ ...BASE, text: 'Mine' }));

    expect(getDreamEditDraft('dream-2')).toBeNull();
  });

  test('two dreams edited apart keep their own text', () => {
    saveDreamEditDraft(DREAM_ID, draft({ ...BASE, text: 'First' }));
    saveDreamEditDraft('dream-2', draft({ ...BASE, text: 'Second' }));

    expect(getDreamEditDraft(DREAM_ID)?.text).toBe('First');
    expect(getDreamEditDraft('dream-2')?.text).toBe('Second');
  });

  test('an edit never becomes the draft the home screen offers to resume', () => {
    saveDreamEditDraft(DREAM_ID, draft({ ...BASE, text: 'Mid-edit' }));

    // The whole reason for a separate key. Reading as an unfinished new dream
    // would put "continue where you left off" in front of someone who is
    // already inside the dream it means.
    expect(getDreamDraft()).toBeNull();
  });

  test('clearing one edit leaves the others alone', () => {
    saveDreamEditDraft(DREAM_ID, draft({ ...BASE, text: 'First' }));
    saveDreamEditDraft('dream-2', draft({ ...BASE, text: 'Second' }));

    clearDreamEditDraft(DREAM_ID);

    expect(getDreamEditDraft(DREAM_ID)).toBeNull();
    expect(getDreamEditDraft('dream-2')?.text).toBe('Second');
  });

  test('an edit that changed nothing is not worth keeping', () => {
    // Opening the editor and closing it should not leave a draft behind to be
    // restored later — there is nothing in it to restore.
    saveDreamEditDraft(
      DREAM_ID,
      draft({
        title: '',
        text: '',
        sleepDate: '',
        medications: '',
        importantEvents: '',
        healthNotes: '',
        tags: [],
      }),
    );

    expect(getDreamEditDraft(DREAM_ID)).toBeNull();
  });

  test('the draft records when it was written', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_762_361_234_567);

    saveDreamEditDraft(DREAM_ID, draft({ ...BASE }));

    // The composer compares this against the dream's own updatedAt, so a draft
    // older than the saved dream is never restored over it.
    expect(getDreamEditDraft(DREAM_ID)?.updatedAt).toBe(1_762_361_234_567);
  });

  test('does not rewrite an unchanged edit draft but persists real changes', () => {
    let now = 100;
    jest.spyOn(Date, 'now').mockImplementation(() => now);

    saveDreamEditDraft(DREAM_ID, draft({ ...BASE }));
    expect(getDreamEditDraft(DREAM_ID)?.updatedAt).toBe(100);

    now = 200;
    saveDreamEditDraft(DREAM_ID, draft({ ...BASE }));

    expect(getDreamEditDraft(DREAM_ID)?.updatedAt).toBe(100);

    saveDreamEditDraft(
      DREAM_ID,
      draft({ ...BASE, text: 'A newly remembered staircase.' }),
    );

    expect(getDreamEditDraft(DREAM_ID)?.updatedAt).toBe(200);
    expect(getDreamEditDraft(DREAM_ID)?.text).toBe(
      'A newly remembered staircase.',
    );
  });

  test('unreadable stored text answers null rather than throwing', () => {
    kv.set(`dream-edit-draft:${DREAM_ID}`, '{ not json');

    expect(getDreamEditDraft(DREAM_ID)).toBeNull();
  });
});
