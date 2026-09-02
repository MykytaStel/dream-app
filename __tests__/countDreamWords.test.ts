import { countDreamWords } from '../src/features/dreams/model/dreamAnalytics';

describe('countDreamWords', () => {
  it('counts space-separated words', () => {
    expect(countDreamWords('a quiet room beside the sea')).toBe(6);
  });

  it('collapses runs of whitespace', () => {
    expect(countDreamWords('  two    words  ')).toBe(2);
  });

  it('returns 0 for nothing to count', () => {
    expect(countDreamWords()).toBe(0);
    expect(countDreamWords('')).toBe(0);
    expect(countDreamWords('   \n  ')).toBe(0);
  });

  it('counts each CJK character, not the whole spaceless run as one word', () => {
    // "I dreamed of the sea last night" with no spaces — 8 ideographs.
    expect(countDreamWords('我昨晚梦见了大海')).toBe(8);
  });

  it('counts kana characters individually too', () => {
    // 5 hiragana
    expect(countDreamWords('うみのゆめ')).toBe(5);
  });

  it('mixes scripts: latin words plus CJK characters', () => {
    // "I" (我) + "dreamed" + "of the sea" (大海) = 1 + 1 + 2
    expect(countDreamWords('我 dreamed of 大海')).toBe(5);
  });
});
