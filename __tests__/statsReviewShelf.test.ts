import { getDreamWakeEmotionLabels } from '../src/constants/copy/dreams';
import { getStatsCopy } from '../src/constants/copy/stats';
import type { Dream } from '../src/features/dreams/model/dream';
import { buildSavedMonthlyReviewItems } from '../src/features/stats/model/statsScreenModel';

describe('statsReviewShelf', () => {
  const copy = getStatsCopy('en');
  const wakeEmotionLabels = getDreamWakeEmotionLabels('en');

  test('builds saved monthly review items and filters months with no remaining dreams', () => {
    const dreams: Dream[] = [
      {
        id: 'march-1',
        createdAt: new Date('2026-03-10T08:00:00Z').getTime(),
        sleepDate: '2026-03-10',
        title: 'Bridge return',
        text: 'I crossed the bridge again.',
        transcript: 'A mirror flashed over the bridge.',
        transcriptSource: 'generated',
        tags: ['bridge'],
        wakeEmotions: ['heavy'],
      },
      {
        id: 'march-2',
        createdAt: new Date('2026-03-14T08:00:00Z').getTime(),
        sleepDate: '2026-03-14',
        title: 'Mirror hall',
        transcript: 'A mirror kept flashing in the station hall.',
        transcriptSource: 'generated',
        tags: ['bridge'],
      },
    ];

    const items = buildSavedMonthlyReviewItems({
      savedMonthKeys: ['2026-03', '2026-02'],
      dreams,
      locale: 'en',
      copy,
      wakeEmotionLabels,
    });

    expect(items).toEqual([
      {
        monthKey: '2026-03',
        title: 'March 2026',
        summary: 'bridge',
        meta: '2 entries · 5 words',
        signals: ['bridge', 'mirror', 'Heavy'],
      },
    ]);
  });
});
