import { kv } from '../src/services/storage/mmkv';
import {
  clearDreamDraft,
  getDreamDraft,
  saveDreamDraft,
} from '../src/features/dreams/services/dreamDraftService';

describe('dream draft service', () => {
  beforeEach(() => {
    kv.clearAll();
  });

  test('saves and restores normalized draft data', () => {
    saveDreamDraft({
      title: '  Unfinished title ',
      text: ' Raw note ',
      sleepDate: '2026-03-06',
      audioUri: 'file:///draft.m4a',
      mood: 'positive',
      stressLevel: 1,
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
      mood: 'positive',
      stressLevel: 1,
      alcoholTaken: false,
      caffeineLate: true,
      medications: '  magnesium ',
      importantEvents: '  travel ',
      healthNotes: '  tired ',
      tags: ['blue-sky', 'lucid-dream'],
    });
  });

  test('does not persist an empty draft and can clear existing draft', () => {
    saveDreamDraft({
      title: '   ',
      text: '   ',
      sleepDate: '',
      audioUri: undefined,
      mood: undefined,
      stressLevel: undefined,
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
      stressLevel: undefined,
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
});
