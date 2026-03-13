import { kv } from '../src/services/storage/mmkv';
import { saveDream } from '../src/features/dreams/repository/dreamsRepository';
import { toggleSavedMonthlyReportMonth } from '../src/features/stats/services/monthlyReportShelfService';
import { reconcileDerivedReviewState } from '../src/features/stats/services/reviewShelfStateService';
import { markSavedReviewStateSynced } from '../src/features/stats/services/reviewStateStorageService';

describe('review shelf state service', () => {
  beforeEach(() => {
    kv.clearAll();
  });

  test('returns fresh metadata after reconciliation updates storage', () => {
    saveDream({
      id: 'march-dream',
      createdAt: new Date('2026-03-04T08:00:00Z').getTime(),
      sleepDate: '2026-03-04',
      text: 'March dream',
      tags: [],
    });
    toggleSavedMonthlyReportMonth('2026-03');
    markSavedReviewStateSynced(100);

    const reconciled = reconcileDerivedReviewState([]);

    expect(reconciled).toMatchObject({
      savedMonths: [],
      syncStatus: 'local',
    });
    expect(reconciled.updatedAt).toBeGreaterThan(100);
  });
});
