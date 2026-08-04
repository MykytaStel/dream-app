import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { Card } from '../../../components/ui/Card';
import { SkeletonBlock } from '../../../components/ui/SkeletonBlock';
import { getDreamCopy } from '../../../constants/copy/dreams';
import { getStatsCopy } from '../../../constants/copy/stats';
import { getPracticeCopy } from '../../../constants/copy/practice';
import {
  ROOT_ROUTE_NAMES,
  type PatternDetailKind,
  type RootStackParamList,
} from '../../../app/navigation/routes';
import { ScreenStateCard } from '../../dreams/components/ScreenStateCard';
import { Theme } from '../../../theme/theme';
import { createStatsScreenStyles } from './StatsScreen.styles';
import { useI18n } from '../../../i18n/I18nProvider';
import { useStatsScreenController } from '../hooks/useStatsScreenController';
import {
  StatsHeroSection,
  StatsMonthlySections,
  StatsOverviewSections,
  StatsThreadsSections,
  type MemoryMode,
} from '../components/StatsScreenSections';
import {
  MemoryDetailsToggle,
  MemoryDisclosureCard,
  MemorySecondaryActions,
} from '../components/MemoryProgressiveDisclosure';
import { MemoryPatternCard } from '../components/MemoryPatternCard';
import {
  getMemoryDisclosureCopy,
  getMemoryDisclosureState,
  isMemoryModeAvailable,
} from '../model/memoryDisclosure';
import {
  getMemoryPatternCopy,
  getPrimaryMemoryPattern,
} from '../model/memoryPattern';
import {
  confirmMemoryPattern,
  dismissMemoryPattern,
  getMemoryPatternFeedback,
  renameMemoryPattern,
} from '../services/memoryPatternFeedbackService';

export default function StatsScreen() {
  const theme = useTheme<Theme>();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getStatsCopy(locale), [locale]);
  const dreamCopy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const practiceCopy = React.useMemo(() => getPracticeCopy(locale), [locale]);
  const memoryPatternCopy = React.useMemo(
    () => getMemoryPatternCopy(locale),
    [locale],
  );
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const styles = React.useMemo(() => createStatsScreenStyles(theme), [theme]);
  const [selectedMemoryMode, setSelectedMemoryMode] =
    React.useState<MemoryMode>('overview');
  const [isMemoryDetailsExpanded, setIsMemoryDetailsExpanded] =
    React.useState(false);
  const [memoryPatternFeedback, setMemoryPatternFeedback] = React.useState(() =>
    getMemoryPatternFeedback(),
  );

  const openPatternDetail = React.useCallback(
    (signal: string, kind: PatternDetailKind) => {
      navigation.navigate(ROOT_ROUTE_NAMES.PatternDetail, {
        signal,
        kind,
      });
    },
    [navigation],
  );

  const controller = useStatsScreenController({
    locale,
    copy,
    dreamCopy,
    selectedMemoryMode,
    openPatternDetail,
  });
  const disclosureState = React.useMemo(
    () => getMemoryDisclosureState(controller.meta.totalCount),
    [controller.meta.totalCount],
  );
  const disclosureCopy = React.useMemo(
    () => getMemoryDisclosureCopy(disclosureState, locale),
    [disclosureState, locale],
  );
  const primaryMemoryPattern = React.useMemo(
    () =>
      getPrimaryMemoryPattern({
        dreams: controller.scopedDreams,
        locale,
        feedback: memoryPatternFeedback,
      }),
    [controller.scopedDreams, locale, memoryPatternFeedback],
  );
  const memoryModeOptions = React.useMemo(
    () =>
      [
        { value: 'overview' as const, label: copy.memoryModeOverview },
        { value: 'threads' as const, label: copy.memoryModeThreads },
        { value: 'monthly' as const, label: copy.memoryModeMonthly },
      ].filter(option => disclosureState.availableModes.includes(option.value)),
    [
      copy.memoryModeMonthly,
      copy.memoryModeOverview,
      copy.memoryModeThreads,
      disclosureState.availableModes,
    ],
  );
  const visibleRangeOptions =
    disclosureState.stage === 'foundation' ? [] : controller.rangeOptions;

  React.useEffect(() => {
    if (!isMemoryModeAvailable(disclosureState, selectedMemoryMode)) {
      setSelectedMemoryMode('overview');
    }
  }, [disclosureState, selectedMemoryMode]);

  const handleSelectMemoryMode = React.useCallback(
    (value: MemoryMode) => {
      if (!isMemoryModeAvailable(disclosureState, value)) {
        return;
      }

      React.startTransition(() => {
        setSelectedMemoryMode(value);
        if (value !== 'overview') {
          setIsMemoryDetailsExpanded(false);
        }
      });
    },
    [disclosureState],
  );
  const handleSelectRange = React.useCallback(
    (value: 'all' | '30d' | '7d') => {
      React.startTransition(() => {
        controller.setSelectedRange(value);
      });
    },
    [controller],
  );
  const shouldShowScopedEmptyState =
    selectedMemoryMode !== 'monthly' && !controller.scopedDreams.length;

  if (controller.loading) {
    return (
      <ScreenContainer scroll={false} style={styles.emptyContainer}>
        <Card style={styles.heroCard}>
          <SkeletonBlock width="38%" height={14} />
          <SkeletonBlock width="58%" height={26} />
          <SkeletonBlock width="100%" height={34} />
        </Card>
        <Card style={styles.sectionCard}>
          <SkeletonBlock width="42%" height={16} />
          <SkeletonBlock width="100%" height={88} />
        </Card>
        <Card style={styles.sectionCard}>
          <SkeletonBlock width="34%" height={16} />
          <SkeletonBlock width="100%" height={132} />
        </Card>
      </ScreenContainer>
    );
  }

  if (!controller.meta.totalCount) {
    return (
      <ScreenContainer scroll={false} style={styles.emptyContainer}>
        <ScreenStateCard
          variant="empty"
          title={copy.emptyTitle}
          subtitle={copy.emptyDescription}
        />
      </ScreenContainer>
    );
  }

  if (controller.loadError) {
    return (
      <ScreenContainer scroll={false} style={styles.emptyContainer}>
        <ScreenStateCard
          variant="error"
          title={dreamCopy.timelineErrorTitle}
          subtitle={dreamCopy.timelineErrorDescription}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <StatsHeroSection
        copy={copy}
        styles={styles}
        selectedMemoryMode={selectedMemoryMode}
        onSelectMemoryMode={handleSelectMemoryMode}
        memoryModeOptions={memoryModeOptions}
        selectedRange={controller.selectedRange}
        onSelectRange={handleSelectRange}
        rangeOptions={visibleRangeOptions}
        memoryNudge={controller.memoryNudge}
        onOpenMemoryNudge={(dreamId, focusSection) =>
          navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
            dreamId,
            focusSection,
          })
        }
        coverageGap={controller.coverageGap}
      />

      {selectedMemoryMode === 'overview' &&
      disclosureState.stage !== 'foundation' &&
      primaryMemoryPattern ? (
        <MemoryPatternCard
          candidate={primaryMemoryPattern}
          copy={memoryPatternCopy}
          onConfirm={() =>
            setMemoryPatternFeedback(
              confirmMemoryPattern(
                primaryMemoryPattern.signal,
                primaryMemoryPattern.kind,
              ),
            )
          }
          onDismiss={() =>
            setMemoryPatternFeedback(
              dismissMemoryPattern(
                primaryMemoryPattern.signal,
                primaryMemoryPattern.kind,
              ),
            )
          }
          onRename={title =>
            setMemoryPatternFeedback(
              renameMemoryPattern(
                primaryMemoryPattern.signal,
                primaryMemoryPattern.kind,
                title,
              ),
            )
          }
          onOpenDream={dreamId =>
            navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, { dreamId })
          }
          onOpenPattern={() =>
            openPatternDetail(
              primaryMemoryPattern.signal,
              primaryMemoryPattern.kind,
            )
          }
        />
      ) : null}

      {selectedMemoryMode === 'overview' ? (
        <>
          <MemoryDisclosureCard state={disclosureState} copy={disclosureCopy} />
          <MemoryDetailsToggle
            expanded={isMemoryDetailsExpanded}
            copy={disclosureCopy}
            onPress={() => setIsMemoryDetailsExpanded(current => !current)}
          />
          <MemorySecondaryActions
            copy={disclosureCopy}
            onOpenPractice={() =>
              navigation.navigate(ROOT_ROUTE_NAMES.DreamPractice, {
                focus: controller.nightmareCount === 0 ? 'lucid' : 'nightmares',
                entrySource: 'stats',
              })
            }
            onOpenProgress={() =>
              navigation.navigate(ROOT_ROUTE_NAMES.Progress)
            }
          />
        </>
      ) : null}

      {selectedMemoryMode === 'overview' && isMemoryDetailsExpanded ? (
        shouldShowScopedEmptyState ? (
          <ScreenStateCard
            variant="empty"
            title={copy.emptyTitle}
            subtitle={copy.emptyDescription}
          />
        ) : (
          <StatsOverviewSections
            copy={copy}
            styles={styles}
            fingerprintLeadSignals={controller.fingerprintLeadSignals}
            fingerprintFacets={controller.fingerprintFacets}
            isDetailsExpanded={controller.isDetailsExpanded}
            onToggleDetails={() =>
              controller.setIsDetailsExpanded(current => !current)
            }
            selectedMode={controller.selectedMode}
            onSelectMode={controller.setSelectedMode}
            canCompare={controller.canCompare}
            selectedRangeLabel={controller.selectedRangeLabel}
            compareOptions={controller.compareOptions}
            compareMetrics={controller.compareMetrics}
            activityBars={controller.activityBars}
            emotionalTrendSeries={controller.emotionalTrendSeries}
            emotionalTrendInsight={controller.emotionalTrendInsight}
            lucidMetrics={controller.lucidMetrics}
            lucidHistoryItems={controller.lucidHistoryItems}
            nightmareMetrics={controller.nightmareMetrics}
            lucidProgressTitle={practiceCopy.statsLucidProgressTitle}
            lucidProgressDescription={
              practiceCopy.statsLucidProgressDescription
            }
            nightmareRecoveryTitle={practiceCopy.statsNightmareRecoveryTitle}
            nightmareRecoveryDescription={
              practiceCopy.statsNightmareRecoveryDescription
            }
            weeklyPatternCards={controller.weeklyPatternCards}
            summaryTiles={controller.summaryTiles}
            coverageItems={controller.coverageItems}
            attentionItems={controller.attentionItems}
            workQueueItems={controller.workQueueItems}
            importantDreamItems={controller.importantDreamItems}
            savedSetItems={controller.savedSetItems}
            onOpenReviewWorkspace={() =>
              navigation.navigate(ROOT_ROUTE_NAMES.ReviewWorkspace)
            }
            onOpenLucidDream={dreamId =>
              navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, { dreamId })
            }
            onOpenPatternDetail={openPatternDetail}
          />
        )
      ) : null}

      {selectedMemoryMode !== 'overview' && shouldShowScopedEmptyState ? (
        <ScreenStateCard
          variant="empty"
          title={copy.emptyTitle}
          subtitle={copy.emptyDescription}
        />
      ) : null}

      {selectedMemoryMode === 'threads' && !shouldShowScopedEmptyState ? (
        <StatsThreadsSections
          copy={copy}
          styles={styles}
          patternGroups={controller.patternGroups}
          savedThreadItems={controller.savedThreadItems}
          onOpenThreadDetail={openPatternDetail}
        />
      ) : null}

      {selectedMemoryMode === 'monthly' ? (
        <StatsMonthlySections
          copy={copy}
          styles={styles}
          latestMonthlyReport={controller.latestMonthlyReport}
          latestMonthlyReportTitle={controller.latestMonthlyReportTitle}
          monthlyReportPreviewSignals={controller.monthlyReportPreviewSignals}
          onOpenMonthlyReport={() =>
            navigation.navigate(ROOT_ROUTE_NAMES.MonthlyReport)
          }
        />
      ) : null}
    </ScreenContainer>
  );
}
