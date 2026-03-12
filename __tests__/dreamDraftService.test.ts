import { kv } from '../src/services/storage/mmkv';
import {
  clearDreamDraft,
  getDreamDraft,
  getDreamDraftSnapshot,
  saveDreamDraft,
} from '../src/features/dreams/services/dreamDraftService';

describe('dream draft service', () => {
  beforeEach(() => {
    kv.clearAll();
  });

  test('saves and restores normalized draft data', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_762_361_234_567);

    saveDreamDraft({
      title: '  Unfinished title ',
      text: ' Raw note ',
      sleepDate: '2026-03-06',
      audioUri: 'file:///draft.m4a',
      entryMode: 'wake',
      mood: 'positive',
      wakeEmotions: ['calm', 'curious', 'calm'],
      stressLevel: 1,
      preSleepEmotions: ['restless', 'hopeful', 'restless'],
      alcoholTaken: false,
      caffeineLate: true,
      medications: '  magnesium ',
      importantEvents: '  travel ',
      healthNotes: '  tired ',
      tags: [' Blue Sky ', 'blue-sky', ' lucid dream '],
    });

    expect(getDreamDraft()).toEqual({
      title: '  Unfinished title ',
      text: ' Raw note ',
      sleepDate: '2026-03-06',
      audioUri: 'file:///draft.m4a',
      entryMode: 'wake',
      updatedAt: 1_762_361_234_567,
      mood: 'positive',
      wakeEmotions: ['calm', 'curious'],
      stressLevel: 1,
      preSleepEmotions: ['restless', 'hopeful'],
      alcoholTaken: false,
      caffeineLate: true,
      medications: '  magnesium ',
      importantEvents: '  travel ',
      healthNotes: '  tired ',
      tags: ['blue-sky', 'lucid-dream'],
    });

    expect(getDreamDraftSnapshot(getDreamDraft())).toEqual({
      resumeMode: 'wake',
      hasAudio: true,
      hasText: true,
      wordCount: 2,
      hasWakeSignals: true,
      hasContext: true,
      hasTags: true,
      updatedAt: 1_762_361_234_567,
    });
  });

  test('does not persist an empty draft and can clear existing draft', () => {
    saveDreamDraft({
      title: '   ',
      text: '   ',
      sleepDate: '',
      audioUri: undefined,
      mood: undefined,
      wakeEmotions: undefined,
      stressLevel: undefined,
      preSleepEmotions: undefined,
      alcoholTaken: undefined,
      caffeineLate: undefined,
      medications: '   ',
      importantEvents: '   ',
      healthNotes: '   ',
      tags: [],
    });

    expect(getDreamDraft()).toBeNull();

    saveDreamDraft({
      title: '',
      text: 'has content',
      sleepDate: '2026-03-06',
      audioUri: undefined,
      mood: undefined,
      wakeEmotions: undefined,
      stressLevel: undefined,
      preSleepEmotions: undefined,
      alcoholTaken: undefined,
      caffeineLate: undefined,
      medications: '',
      importantEvents: '',
      healthNotes: '',
      tags: [],
    });

    clearDreamDraft();
    expect(getDreamDraft()).toBeNull();
  });

  test('infers a safe resume mode for older drafts without stored entry mode', () => {
    saveDreamDraft({
      title: '',
      text: '',
      sleepDate: '2026-03-06',
      audioUri: 'file:///draft.m4a',
      mood: undefined,
      wakeEmotions: undefined,
      stressLevel: undefined,
      preSleepEmotions: undefined,
      alcoholTaken: undefined,
      caffeineLate: undefined,
      medications: '',
      importantEvents: '',
      healthNotes: '',
      tags: [],
      updatedAt: 123,
    });

    const draft = getDreamDraft();
    expect(draft?.entryMode).toBeUndefined();
    expect(getDreamDraftSnapshot(draft)?.resumeMode).toBe('voice');
  });
});
