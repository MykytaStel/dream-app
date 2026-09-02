import {
  getMemoryDisclosureCopy,
  getMemoryDisclosureState,
  isMemoryModeAvailable,
} from '../src/features/stats/model/memoryDisclosure';

describe('memoryDisclosure', () => {
  test.each([
    [0, 'foundation', ['overview'], 3],
    [2, 'foundation', ['overview'], 1],
    [3, 'signals', ['overview'], 3],
    [5, 'signals', ['overview'], 1],
    [6, 'connections', ['overview'], 5],
    [10, 'connections', ['overview'], 1],
    [11, 'threads', ['overview', 'threads'], 9],
    [19, 'threads', ['overview', 'threads'], 1],
    [20, 'deep', ['overview', 'threads', 'monthly'], 0],
  ] as const)(
    'maps %i dreams to %s disclosure',
    (dreamCount, stage, availableModes, remainingDreams) => {
      const state = getMemoryDisclosureState(dreamCount);

      expect(state.stage).toBe(stage);
      expect(state.availableModes).toEqual(availableModes);
      expect(state.remainingDreams).toBe(remainingDreams);
    },
  );

  test('normalizes invalid counts to the foundation stage', () => {
    expect(getMemoryDisclosureState(Number.NaN)).toMatchObject({
      stage: 'foundation',
      dreamCount: 0,
    });
    expect(getMemoryDisclosureState(-4)).toMatchObject({
      stage: 'foundation',
      dreamCount: 0,
    });
  });

  test('unlocks threads and monthly modes only at their thresholds', () => {
    const tenDreams = getMemoryDisclosureState(10);
    const elevenDreams = getMemoryDisclosureState(11);
    const twentyDreams = getMemoryDisclosureState(20);

    expect(isMemoryModeAvailable(tenDreams, 'threads')).toBe(false);
    expect(isMemoryModeAvailable(elevenDreams, 'threads')).toBe(true);
    expect(isMemoryModeAvailable(elevenDreams, 'monthly')).toBe(false);
    expect(isMemoryModeAvailable(twentyDreams, 'monthly')).toBe(true);
  });

  test('provides localized stage, analysis and secondary tool copy', () => {
    const state = getMemoryDisclosureState(4);

    expect(getMemoryDisclosureCopy(state, 'uk')).toMatchObject({
      title: 'Перші сигнали',
      detailsTitle: 'Детальна аналітика',
      practiceTitle: 'Практика снів',
      showDetailsLabel: 'Показати деталі',
      progressLabel: 'Ще 2 записи до наступного рівня',
    });
    expect(getMemoryDisclosureCopy(state, 'en')).toMatchObject({
      title: 'First signals',
      detailsTitle: 'Detailed analysis',
      practiceTitle: 'Dream practice',
      showDetailsLabel: 'Show details',
      progressLabel: '2 more entries to the next level',
    });
  });
});
