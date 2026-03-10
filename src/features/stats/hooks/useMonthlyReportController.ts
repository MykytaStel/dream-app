import React from 'react';
import { Share } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { trackLocalSurfaceLoad } from '../../../services/observability/perf';
import { listDreams } from '../../dreams/repository/dreamsRepository';
import type { MonthlyReportCopyShape } from '../model/monthlyReportPresentation';
import {
  buildMonthlyReportShareLines,
  getMonthlyReportViewModel,
} from '../model/monthlyReportPresentation';
import { getMonthlyReportData, getMonthlyReportMonths } from '../model/monthlyReport';
import {
  getSavedMonthlyReportMonths,
  toggleSavedMonthlyReportMonth,
} from '../services/monthlyReportShelfService';

type UseMonthlyReportControllerArgs = {
  locale: string;
  initialMonthKey?: string;
  copy: MonthlyReportCopyShape;
  wakeEmotionLabels: Record<string, string>;
  preSleepEmotionLabels: Record<string, string>;
};

export function useMonthlyReportController({
  locale,
  initialMonthKey,
  copy,
  wakeEmotionLabels,
  preSleepEmotionLabels,
}: UseMonthlyReportControllerArgs) {
  const localeTag = locale === 'uk' ? 'uk-UA' : 'en-US';
  const [dreams, setDreams] = React.useState(() => listDreams());
  const [savedMonths, setSavedMonths] = React.useState(() => getSavedMonthlyReportMonths());

  const months = React.useMemo(
    () => getMonthlyReportMonths(dreams, localeTag),
    [dreams, localeTag],
  );

  const [selectedMonthKey, setSelectedMonthKey] = React.useState<string | undefined>(
    initialMonthKey ?? months[0]?.key,
  );

  useFocusEffect(
    React.useCallback(() => {
      const startedAt = Date.now();
      const nextDreams = listDreams();
      React.startTransition(() => {
        setDreams(nextDreams);
      });
      setSavedMonths(getSavedMonthlyReportMonths());
      trackLocalSurfaceLoad('monthly_report_refresh', startedAt, nextDreams.length);
    }, []),
  );

  React.useEffect(() => {
    if (!selectedMonthKey && months[0]?.key) {
      setSelectedMonthKey(months[0].key);
    }
  }, [months, selectedMonthKey]);

  const report = React.useMemo(
    () => getMonthlyReportData(dreams, selectedMonthKey),
    [dreams, selectedMonthKey],
  );

  const isSavedForLater = React.useMemo(
    () =>
      report ? savedMonths.some(item => item.monthKey === report.month.key) : false,
    [report, savedMonths],
  );

  const viewModel = React.useMemo(
    () =>
      report
        ? getMonthlyReportViewModel({
            report,
            locale: localeTag,
            copy,
            wakeEmotionLabels,
            preSleepEmotionLabels,
            isSavedForLater,
          })
        : null,
    [copy, isSavedForLater, localeTag, preSleepEmotionLabels, report, wakeEmotionLabels],
  );

  const onToggleSaveForLater = React.useCallback(() => {
    if (!report) {
      return;
    }

    setSavedMonths(toggleSavedMonthlyReportMonth(report.month.key));
  }, [report]);

  const onShareReport = React.useCallback(async () => {
    if (!report || !viewModel) {
      return;
    }

    const lines = buildMonthlyReportShareLines({
      report,
      monthTitle: viewModel.monthTitle,
      coverText: viewModel.coverText,
      copy,
      wakeEmotionLabels,
      preSleepEmotionLabels,
    });

    await Share.share({
      title: `${copy.monthlyReportShareTitle} · ${viewModel.monthTitle}`,
      message: lines.join('\n'),
    });
  }, [copy, preSleepEmotionLabels, report, viewModel, wakeEmotionLabels]);

  return {
    months,
    report,
    viewModel,
    selectedMonthKey,
    setSelectedMonthKey,
    onToggleSaveForLater,
    onShareReport,
  };
}
