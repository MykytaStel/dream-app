import React from 'react';
import { type AppLocale } from '../../../i18n/types';
import { type Dream } from '../../dreams/model/dream';
import { getMonthlyReportData, getMonthlyReportMonths } from '../model/monthlyReport';
import { formatMonthTitle } from '../model/statsScreenModel';

export function useStatsMonthlyContent(args: {
  locale: AppLocale;
  dreams: Dream[];
  wakeEmotionLabels: Record<string, string>;
  isMonthlyMode: boolean;
}) {
  const { locale, dreams, wakeEmotionLabels, isMonthlyMode } = args;
  const monthlyReportMonths = React.useMemo(
    () =>
      isMonthlyMode ? getMonthlyReportMonths(dreams, locale === 'uk' ? 'uk-UA' : 'en-US') : [],
    [dreams, isMonthlyMode, locale],
  );
  const latestMonthlyReport = React.useMemo(
    () =>
      isMonthlyMode ? getMonthlyReportData(dreams, monthlyReportMonths[0]?.key) : null,
    [dreams, isMonthlyMode, monthlyReportMonths],
  );
  const latestMonthlyReportTitle = latestMonthlyReport
    ? formatMonthTitle(latestMonthlyReport.month.year, latestMonthlyReport.month.month, locale)
    : null;
  const monthlyReportPreviewSignals = React.useMemo(() => {
    if (!latestMonthlyReport) {
      return [];
    }

    return [
      latestMonthlyReport.topTheme?.label,
      latestMonthlyReport.topSymbol?.label,
      latestMonthlyReport.topWakeEmotion
        ? wakeEmotionLabels[latestMonthlyReport.topWakeEmotion.emotion]
        : null,
    ].filter((value): value is string => Boolean(value));
  }, [latestMonthlyReport, wakeEmotionLabels]);

  return {
    latestMonthlyReport,
    latestMonthlyReportTitle,
    monthlyReportPreviewSignals,
  };
}
