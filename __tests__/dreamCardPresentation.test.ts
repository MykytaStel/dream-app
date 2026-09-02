import type { Dream } from '../src/features/dreams/model/dream';
import { buildDreamCardData } from '../src/features/dreams/model/dreamCardPresentation';

const copy = { untitled: 'Untitled' };

function makeDream(overrides: Partial<Dream>): Dream {
  return {
    id: 'dream-1',
    createdAt: new Date('2026-03-06T08:00:00.000Z').getTime(),
    sleepDate: '2026-03-06',
    tags: [],
    ...overrides,
  };
}

describe('buildDreamCardData excerpt', () => {
  it('returns a short dream body untouched', () => {
    const data = buildDreamCardData(
      makeDream({ text: 'A short dream about a lantern' }),
      {},
      copy,
    );

    expect(data.excerpt).toBe('A short dream about a lantern');
  });

  it('truncates a long body without cutting an emoji into a lone surrogate', () => {
    const data = buildDreamCardData(
      makeDream({ text: `${'😀'.repeat(200)}` }),
      {},
      copy,
    );

    expect(Array.from(data.excerpt).length).toBeLessThanOrEqual(120);
    expect(data.excerpt).not.toMatch(/�/);
    expect(
      /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(
        data.excerpt,
      ),
    ).toBe(false);
    expect(data.excerpt.endsWith('…')).toBe(true);
  });

  it('falls back to the transcript when there is no body', () => {
    const data = buildDreamCardData(
      makeDream({ transcript: 'Spoken dream about water' }),
      {},
      copy,
    );

    expect(data.excerpt).toBe('Spoken dream about water');
  });
});
