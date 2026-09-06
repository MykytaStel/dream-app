import React from 'react';
import {
  trackMemoryOpened,
  trackPatternConfirmed,
} from '../../../services/observability/events';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { Card } from '../../../components/ui/Card';
import { SkeletonBlock } from '../../../components/ui/SkeletonBlock';
import { getDreamCopy } from '../../../constants/copy/dreams';
import { getStatsCopy } from '../../../constants/copy/stats';
import {
  ROOT_ROUTE_NAMES,
  type PatternDetailKind,
  type RootStackParamList,
} from '../../../app/navigation/routes';
import { ScreenStateCard } from '../../dreams/components/ScreenStateCard';
import { createStatsScreenStyles } from './StatsScreen.styles';
import { useStyles } from '../../../theme/useStyles';
import { useI18n } from '../../../i18n/I18nProvider';
import { useStatsScreenController } from '../hooks/useStatsScreenController';
import { StatsHeroSection } from '../components/StatsScreenSections';
import {
  MemoryDisclosureCard,
  MemorySecondaryActions,
} from '../components/MemoryProgressiveDisclosure';
import { MemoryPatternCard } from '../components/MemoryPatternCard';
import { MemoryRevisitNudgeCard } from '../components/MemoryRevisitNudgeCard';
import { SettingsActionRow } from '../../settings/components/SettingsActionRow';
import {
  getMemoryDisclosureCopy,
  getMemoryDisclosureState,
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
  const { locale } = useI18n();
  const copy = React.useMemo(() => getStatsCopy(locale), [locale]);
  const dreamCopy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const memoryPatternCopy = React.useMemo(
    () => getMemoryPatternCopy(locale),
    [locale],
  );
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const styles = useStyles(createStatsScreenStyles);
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
    selectedMemoryMode: 'overview',
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

  // The denominator for §9's "≥30% of people with 10+ dreams open Memory".
  // The count is what makes that conditional answerable; nothing about the
  // dreams themselves is sent.
  //
  // Keyed on focus rather than on the count: this is a bottom tab that stays
  // mounted, so an effect watching the count would fire once for the life of
  // the tab and make frequency of use unanswerable.
  const totalDreamCount = controller.meta.totalCount;
  useFocusEffect(
    React.useCallback(() => {
      trackMemoryOpened({ dreamCount: totalDreamCount });
    }, [totalDreamCount]),
  );

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
      <StatsHeroSection copy={copy} styles={styles} />

      {disclosureState.stage !== 'foundation' && primaryMemoryPattern ? (
        <MemoryPatternCard
          candidate={primaryMemoryPattern}
          copy={memoryPatternCopy}
          onConfirm={() => {
            // §9's "≥20% of people with 10+ dreams confirm a pattern" — the
            // one number that measures §5.1, the product's stated
            // differentiator. `kind` only: the signal is the symbol itself.
            trackPatternConfirmed({
              kind: primaryMemoryPattern.kind,
              action: 'confirm',
            });
            setMemoryPatternFeedback(
              confirmMemoryPattern(
                primaryMemoryPattern.signal,
                primaryMemoryPattern.kind,
              ),
            );
          }}
          onDismiss={() => {
            trackPatternConfirmed({
              kind: primaryMemoryPattern.kind,
              action: 'reject',
            });
            setMemoryPatternFeedback(
              dismissMemoryPattern(
                primaryMemoryPattern.signal,
                primaryMemoryPattern.kind,
              ),
            );
          }}
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
            navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
              dreamId,
              source: 'stats',
            })
          }
          onOpenPattern={() =>
            openPatternDetail(
              primaryMemoryPattern.signal,
              primaryMemoryPattern.kind,
            )
          }
        />
      ) : controller.memoryNudge ? (
        <MemoryRevisitNudgeCard
          nudge={controller.memoryNudge}
          copy={copy}
          onOpen={(dreamId, focusSection) =>
            navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
              source: 'stats',
              dreamId,
              focusSection,
            })
          }
        />
      ) : null}

      {disclosureState.stage !== 'deep' ? (
        <MemoryDisclosureCard state={disclosureState} copy={disclosureCopy} />
      ) : null}

      <SettingsActionRow
        variant="inline"
        title={copy.memoryModeMonthly}
        meta={copy.memoryMonthlyRowMeta}
        onPress={() => navigation.navigate(ROOT_ROUTE_NAMES.MonthlyReport)}
      />
      <SettingsActionRow
        variant="inline"
        title={copy.memoryTrendsTitle}
        meta={copy.memoryTrendsRowMeta}
        onPress={() => navigation.navigate(ROOT_ROUTE_NAMES.MemoryTrends)}
      />

      <MemorySecondaryActions
        copy={disclosureCopy}
        onOpenPractice={() =>
          navigation.navigate(ROOT_ROUTE_NAMES.DreamPractice, {
            focus: controller.nightmareCount === 0 ? 'lucid' : 'nightmares',
            entrySource: 'stats',
          })
        }
      />
    </ScreenContainer>
  );
}
