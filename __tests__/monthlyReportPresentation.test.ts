import { getDreamPreSleepEmotionLabels, getDreamWakeEmotionLabels } from '../src/constants/copy/dreams';
import { getStatsCopy } from '../src/constants/copy/stats';
import type { Dream } from '../src/features/dreams/model/dream';
import { getMonthlyReportData } from '../src/features/stats/model/monthlyReport';
import { getMonthlyReportViewModel } from '../src/features/stats/model/monthlyReportPresentation';

describe('monthlyReportPresentation', () => {
  const copy = getStatsCopy('en');
  const wakeEmotionLabels = getDreamWakeEmotionLabels('en');
  const preSleepEmotionLabels = getDreamPreSleepEmotionLabels('en');

  test('adds a time-based revisit cue when a dream from the month hits a resurfacing window', () => {
    const now = new Date('2026-03-11T12:00:00Z').getTime();
    const dreams: Dream[] = [
      {
        id: 'time-capsule',
        createdAt: new Date('2026-02-09T08:00:00Z').getTime(),
        title: 'Airport gate',
        text: 'Walking toward a gate that kept moving',
        tags: [],
      },
      {
        id: 'other-dream',
        createdAt: new Date('2026-02-20T08:00:00Z').getTime(),
        title: 'Kitchen light',
        text: 'A small light above the sink',
        tags: [],
      },
    ];
    const report = getMonthlyReportData(dreams, '2026-02');

    expect(report).not.toBeNull();
    if (!report) {
      throw new Error('Expected monthly report data');
    }

    const viewModel = getMonthlyReportViewModel({
      report,
      locale: 'en-US',
      copy,
      wakeEmotionLabels,
      preSleepEmotionLabels,
      isSavedForLater: false,
      now,
    });

    expect(viewModel.revisitCue).toEqual({
      dreamId: 'time-capsule',
      dreamTitle: 'Airport gate',
      badgeLabel: copy.memoryNudgeTimeBadge,
      reason: `${copy.memoryNudgeTimeReasonPrefix}${copy.memoryNudgeTimeMonth}${copy.memoryNudgeTimeReasonSuffix}`,
      actionLabel: copy.memoryNudgeActionTime,
    });
  });

  test('does not add a revisit cue when no dream from the month is in a resurfacing window', () => {
    const now = new Date('2026-03-11T12:00:00Z').getTime();
    const dreams: Dream[] = [
      {
        id: 'recent-dream',
        createdAt: new Date('2026-03-07T08:00:00Z').getTime(),
        title: 'Too recent',
        text: 'Only a few days old',
        tags: [],
      },
      {
        id: 'mid-dream',
        createdAt: new Date('2026-03-01T08:00:00Z').getTime(),
        title: 'Not quite there',
        text: 'Old enough for the month but not for a cue',
        tags: [],
      },
    ];
    const report = getMonthlyReportData(dreams, '2026-03');

    expect(report).not.toBeNull();
    if (!report) {
      throw new Error('Expected monthly report data');
    }

    const viewModel = getMonthlyReportViewModel({
      report,
      locale: 'en-US',
      copy,
      wakeEmotionLabels,
      preSleepEmotionLabels,
      isSavedForLater: false,
      now,
    });

    expect(viewModel.revisitCue).toBeNull();
  });
});
