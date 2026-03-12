import React from 'react';
import { Share } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { trackLocalSurfaceLoad } from '../../../services/observability/perf';
import {
  getDreamsMeta,
  listDreams,
  type DreamsMeta,
} from '../../dreams/repository/dreamsRepository';
import type { MonthlyReportCopyShape } from '../model/monthlyReportPresentation';
import {
  buildMonthlyReportShareLines,
  getMonthlyReportViewModel,
} from '../model/monthlyReportPresentation';
import { buildSavedDreamThreadShelfItems } from '../model/dreamThread';
import {
  getMonthlyReportData,
  getMonthlyReportMonths,
  getMonthlyReportMonthsFromKeys,
  type MonthlyReportMonth,
} from '../model/monthlyReport';
import {
  getSavedMonthlyReportMonths,
  toggleSavedMonthlyReportMonth,
} from '../services/monthlyReportShelfService';
import { getSavedDreamThreads } from '../services/dreamThreadShelfService';

type IdleCallbackHandle = number;
type IdleSchedulerShape = {
  requestIdleCallback?: (callback: () => void) => IdleCallbackHandle;
  cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
};

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
  const hydrationRequestRef = React.useRef(0);
  const [meta, setMeta] = React.useState<DreamsMeta>(() => getDreamsMeta());
  const [months, setMonths] = React.useState<MonthlyReportMonth[]>(() =>
    getMonthlyReportMonthsFromKeys(meta.monthKeys, localeTag),
  );
  const [dreams, setDreams] = React.useState(() => [] as ReturnType<typeof listDreams>);
  const [savedMonths, setSavedMonths] = React.useState(() => getSavedMonthlyReportMonths());
  const [savedThreadRecords, setSavedThreadRecords] = React.useState(() => getSavedDreamThreads());
  const [loading, setLoading] = React.useState(meta.totalCount > 0);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [selectedMonthKey, setSelectedMonthKey] = React.useState<string | undefined>(
    initialMonthKey ?? getMonthlyReportMonthsFromKeys(meta.monthKeys, localeTag)[0]?.key,
  );

  useFocusEffect(
    React.useCallback(() => {
      const startedAt = Date.now();
      setLoadError(null);

      try {
        const requestId = ++hydrationRequestRef.current;
        const nextMeta = getDreamsMeta();
        const nextMonths = getMonthlyReportMonthsFromKeys(nextMeta.monthKeys, localeTag);

        setMeta(nextMeta);
        setMonths(nextMonths);
        setSavedMonths(getSavedMonthlyReportMonths());
        setSavedThreadRecords(getSavedDreamThreads());
        setLoading(nextMeta.totalCount > 0);
        trackLocalSurfaceLoad('monthly_report_refresh', startedAt, nextMeta.totalCount);

        const runHydration = () => {
          try {
            const nextDreams = listDreams();

            React.startTransition(() => {
              if (hydrationRequestRef.current !== requestId) {
                return;
              }

              setDreams(nextDreams);
              setMonths(getMonthlyReportMonths(nextDreams, localeTag));
              setLoading(false);
              setLoadError(null);
            });
          } catch (error) {
            if (hydrationRequestRef.current !== requestId) {
              return;
            }

            setDreams([]);
            setLoading(false);
            setLoadError(String(error));
          }
        };

        const scheduler = globalThis as typeof globalThis & IdleSchedulerShape;
        if (typeof scheduler.requestIdleCallback === 'function') {
          scheduler.requestIdleCallback(runHydration);
          return;
        }

        setTimeout(runHydration, 0);
      } catch (error) {
        setLoading(false);
        setLoadError(String(error));
      }
    }, [localeTag]),
  );

  React.useEffect(() => {
    const hasSelectedMonth =
      selectedMonthKey && months.some(month => month.key === selectedMonthKey);

    if ((!selectedMonthKey || !hasSelectedMonth) && months[0]?.key) {
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
  const savedThreadItems = React.useMemo(
    () =>
      report
        ? buildSavedDreamThreadShelfItems({
            records: savedThreadRecords,
            dreams: report.dreams,
            statsCopy: copy,
          })
        : [],
    [copy, report, savedThreadRecords],
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
    meta,
    months,
    report,
    viewModel,
    savedThreadItems,
    loading,
    loadError,
    selectedMonthKey,
    setSelectedMonthKey,
    onToggleSaveForLater,
    onShareReport,
  };
}
