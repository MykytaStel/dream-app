import { Dream } from '../src/features/dreams/model/dream';
import {
  DREAM_SAVE_VALIDATION,
  hasDreamContent,
  isValidSleepDate,
  normalizeTags,
  sanitizeDream,
  sortDreamsStable,
  validateDreamForSave,
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

  test('sanitizes analysis payload and removes unusable analysis states', () => {
    const createdAt = new Date('2026-03-06T12:00:00.000Z').getTime();
    const sanitized = sanitizeDream({
      id: 'dream-analysis',
      createdAt,
      sleepDate: '2026-03-06',
      text: 'Dream body',
      tags: [],
      analysis: {
        provider: 'openai',
        status: 'ready',
        summary: '  A recurring fear of missed exits  ',
        themes: ['  missed exits ', 'Missed Exits', ' commuting '],
        generatedAt: createdAt + 1000,
      },
    });

    expect(sanitized.analysis).toEqual({
      provider: 'openai',
      status: 'ready',
      summary: 'A recurring fear of missed exits',
      themes: ['missed exits', 'commuting'],
      generatedAt: createdAt + 1000,
      errorMessage: undefined,
    });

    expect(
      sanitizeDream({
        id: 'dream-analysis-empty',
        createdAt,
        sleepDate: '2026-03-06',
        text: 'Dream body',
        tags: [],
        analysis: {
          provider: 'manual',
          status: 'ready',
        },
      }).analysis,
    ).toBeUndefined();
  });

  test('accepts text-only, audio-only, and mixed dream captures', () => {
    expect(hasDreamContent({ text: '  remembered hallway  ', audioUri: undefined })).toBe(true);
    expect(hasDreamContent({ text: '   ', audioUri: 'file:///dream.m4a' })).toBe(true);
    expect(
      validateDreamForSave({
        text: 'remembered hallway',
        audioUri: undefined,
        sleepDate: '2026-03-06',
      }),
    ).toBeNull();
    expect(
      validateDreamForSave({
        text: '   ',
        audioUri: 'file:///dream.m4a',
        sleepDate: '2026-03-06',
      }),
    ).toBeNull();
    expect(
      validateDreamForSave({
        text: 'remembered hallway',
        audioUri: 'file:///dream.m4a',
        sleepDate: '2026-03-06',
      }),
    ).toBeNull();
  });

  test('rejects save when there is no text or audio, or sleep date is invalid', () => {
    expect(
      validateDreamForSave({
        text: '   ',
        audioUri: undefined,
        sleepDate: '2026-03-06',
      }),
    ).toBe(DREAM_SAVE_VALIDATION.missingContent);

    expect(
      validateDreamForSave({
        text: 'has body',
        audioUri: undefined,
        sleepDate: '2026-02-30',
      }),
    ).toBe(DREAM_SAVE_VALIDATION.invalidSleepDate);
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
