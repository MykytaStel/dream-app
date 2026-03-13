import React from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { Card } from '../../../components/ui/Card';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { ScreenStateCard } from '../../dreams/components/ScreenStateCard';
import { getDreamCopy } from '../../../constants/copy/dreams';
import { getStatsCopy } from '../../../constants/copy/stats';
import {
  ROOT_ROUTE_NAMES,
  type PatternDetailKind,
  type RootStackParamList,
} from '../../../app/navigation/routes';
import { Theme } from '../../../theme/theme';
import { createStatsScreenStyles } from './StatsScreen.styles';
import { useI18n } from '../../../i18n/I18nProvider';
import { useStatsScreenController } from '../hooks/useStatsScreenController';
import { getReviewWorkspaceViewModel } from '../model/reviewWorkspace';

export default function ReviewWorkspaceScreen() {
  const theme = useTheme<Theme>();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getStatsCopy(locale), [locale]);
  const dreamCopy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const styles = createStatsScreenStyles(theme);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const openPatternDetail = React.useCallback(
    (signal: string, kind: PatternDetailKind) =>
      navigation.navigate(ROOT_ROUTE_NAMES.PatternDetail, {
        signal,
        kind,
      }),
    [navigation],
  );

  const controller = useStatsScreenController({
    locale,
    copy,
    selectedMemoryMode: 'overview',
    openPatternDetail,
  });

  const viewModel = React.useMemo(
    () =>
      getReviewWorkspaceViewModel({
        workQueueCount: controller.workQueueItems.length,
        savedMonthCount: controller.savedMonthItems.length,
        savedThreadCount: controller.savedOverviewThreadItems.length,
        copy,
      }),
    [
      controller.savedMonthItems.length,
      controller.savedOverviewThreadItems.length,
      controller.workQueueItems.length,
      copy,
    ],
  );

  if (controller.loading && controller.meta.totalCount > 0) {
    return (
      <ScreenContainer scroll={false} style={styles.emptyContainer}>
        <Card style={styles.heroCard}>
          <SectionHeader title={copy.reviewWorkspaceTitle} subtitle={copy.reviewWorkspaceSubtitle} />
        </Card>
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
      <Card style={styles.heroCard}>
        <SectionHeader title={copy.reviewWorkspaceTitle} subtitle={copy.reviewWorkspaceSubtitle} />
        <View style={styles.metricGrid}>
          {viewModel.summaryTiles.map(tile => (
            <View key={tile.label} style={styles.metricTile}>
              <Text style={styles.metricLabel}>{tile.label}</Text>
              <Text style={styles.metricValue}>{tile.value}</Text>
            </View>
          ))}
        </View>
      </Card>

      {!viewModel.hasItems ? (
        <ScreenStateCard
          variant="empty"
          title={copy.reviewWorkspaceEmptyTitle}
          subtitle={copy.reviewWorkspaceEmptyDescription}
        />
      ) : (
        <>
          {controller.workQueueItems.length ? (
            <Card style={styles.sectionCard}>
              <SectionHeader
                title={copy.reviewWorkspaceContinueTitle}
                subtitle={copy.workQueueDescription}
              />
              <View style={styles.workQueueList}>
                {controller.workQueueItems.map(item => (
                  <Pressable
                    key={`${item.focusSection}:${item.dreamId}`}
                    onPress={() =>
                      navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
                        dreamId: item.dreamId,
                        focusSection: item.focusSection,
                      })
                    }
                    style={({ pressed }) => [
                      styles.workQueueCard,
                      pressed ? styles.insightCardPressed : null,
                    ]}
                  >
                    <Text style={styles.reportEntryEyebrow}>{copy.reviewShelfContinueEyebrow}</Text>
                    <View style={styles.memoryNudgeHeader}>
                      <Text style={styles.workQueueDreamTitle} numberOfLines={1}>
                        {item.dreamTitle}
                      </Text>
                      <View style={styles.memoryNudgeBadge}>
                        <Ionicons name={item.icon} size={12} color={theme.colors.accent} />
                        <Text style={styles.memoryNudgeBadgeText}>{item.badgeLabel}</Text>
                      </View>
                    </View>
                    <Text style={styles.storyHint}>{item.reason}</Text>
                    <View style={styles.memoryNudgeActionRow}>
                      <Text style={styles.memoryNudgeActionText}>{item.actionLabel}</Text>
                      <Ionicons
                        name="arrow-forward-outline"
                        size={14}
                        color={theme.colors.accent}
                      />
                    </View>
                  </Pressable>
                ))}
              </View>
            </Card>
          ) : null}

          {controller.savedMonthItems.length ? (
            <Card style={styles.sectionCard}>
              <SectionHeader
                title={copy.reviewWorkspaceSavedMonthsTitle}
                subtitle={copy.reviewShelfDescription}
              />
              <View style={styles.reviewShelfList}>
                {controller.savedMonthItems.map(item => (
                  <Pressable
                    key={item.monthKey}
                    onPress={() =>
                      navigation.navigate(ROOT_ROUTE_NAMES.MonthlyReport, {
                        yearMonth: item.monthKey,
                      })
                    }
                    style={({ pressed }) => [
                      styles.reviewShelfCompactRow,
                      pressed ? styles.insightCardPressed : null,
                    ]}
                  >
                    <View style={styles.reviewShelfCompactCopy}>
                      <Text style={styles.reviewShelfCompactEyebrow}>
                        {copy.reviewShelfSavedMonthEyebrow}
                      </Text>
                      <Text style={styles.reviewShelfCompactTitle}>{item.title}</Text>
                      <Text style={styles.reviewShelfCompactMeta}>
                        {`${item.summary} • ${item.meta}`}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textDim} />
                  </Pressable>
                ))}
              </View>
            </Card>
          ) : null}

          {controller.savedOverviewThreadItems.length ? (
            <Card style={styles.sectionCard}>
              <SectionHeader
                title={copy.reviewWorkspaceSavedThreadsTitle}
                subtitle={copy.savedThreadsDescription}
              />
              <View style={styles.savedThreadsList}>
                {controller.savedOverviewThreadItems.map(item => (
                  <Pressable
                    key={`${item.kind}-${item.signal}`}
                    style={({ pressed }) => [
                      styles.savedThreadRow,
                      pressed ? styles.insightCardPressed : null,
                    ]}
                    onPress={() =>
                      navigation.navigate(ROOT_ROUTE_NAMES.PatternDetail, {
                        signal: item.signal,
                        kind: item.kind as PatternDetailKind,
                      })
                    }
                  >
                    <View style={styles.savedThreadCopy}>
                      <Text style={styles.savedThreadTitle}>{item.signal}</Text>
                      <Text style={styles.savedThreadMeta}>
                        {`${item.kindLabel} • ${item.matchesLabel}`}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.text} />
                  </Pressable>
                ))}
              </View>
            </Card>
          ) : null}
        </>
      )}
    </ScreenContainer>
  );
}
