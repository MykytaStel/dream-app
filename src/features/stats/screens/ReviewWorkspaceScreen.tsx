import React from 'react';
import { Pressable, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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
import { getSettingsCopy } from '../../../constants/copy/settings';
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
import { getCloudSession, getCloudSyncEnabled } from '../../../services/auth/session';
import { getDerivedReviewStateSnapshot } from '../services/reviewShelfStateService';
import { getReviewWorkspaceBackupCue } from '../../settings/model/backupCue';
import { SettingsActionRow } from '../../settings/components/SettingsActionRow';

export default function ReviewWorkspaceScreen() {
  const theme = useTheme<Theme>();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getStatsCopy(locale), [locale]);
  const dreamCopy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const settingsCopy = React.useMemo(() => getSettingsCopy(locale), [locale]);
  const styles = React.useMemo(() => createStatsScreenStyles(theme), [theme]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [cloudSession, setCloudSession] = React.useState(() => getCloudSession());
  const [cloudSyncEnabled, setCloudSyncEnabledState] = React.useState(() =>
    getCloudSyncEnabled(),
  );
  const [reviewState, setReviewState] = React.useState(() =>
    getDerivedReviewStateSnapshot(),
  );
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
  const refreshBackupState = React.useCallback(() => {
    setCloudSession(getCloudSession());
    setCloudSyncEnabledState(getCloudSyncEnabled());
    setReviewState(getDerivedReviewStateSnapshot());
  }, []);
  useFocusEffect(
    React.useCallback(() => {
      refreshBackupState();
    }, [refreshBackupState]),
  );
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: copy.reviewWorkspaceTitle,
    });
  }, [copy.reviewWorkspaceTitle, navigation]);

  const viewModel = React.useMemo(
    () =>
      getReviewWorkspaceViewModel({
        workQueueCount: controller.workQueueItems.length,
        importantDreamCount: controller.importantDreamItems.length,
        savedSetCount: controller.savedSetItems.length,
        copy,
      }),
    [
      controller.importantDreamItems.length,
      controller.savedSetItems.length,
      controller.workQueueItems.length,
      copy,
    ],
  );
  const backupCue = React.useMemo(
    () =>
      getReviewWorkspaceBackupCue({
        cloudSession,
        cloudSyncEnabled,
        hasReviewItems: viewModel.hasItems,
        reviewState,
        copy: settingsCopy,
      }),
    [cloudSession, cloudSyncEnabled, reviewState, settingsCopy, viewModel.hasItems],
  );

  if (controller.loading) {
    return (
      <ScreenContainer scroll={false} withTopInset={false} style={styles.emptyContainer}>
        <Card style={styles.heroCard}>
          <Text style={styles.storyHint}>{copy.reviewWorkspaceSubtitle}</Text>
        </Card>
      </ScreenContainer>
    );
  }

  if (controller.loadError) {
    return (
      <ScreenContainer scroll={false} withTopInset={false} style={styles.emptyContainer}>
        <ScreenStateCard
          variant="error"
          title={dreamCopy.timelineErrorTitle}
          subtitle={dreamCopy.timelineErrorDescription}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll withTopInset={false}>
      <Card style={styles.heroCard}>
        <Text style={styles.storyHint}>{copy.reviewWorkspaceSubtitle}</Text>
        <View style={styles.metricGrid}>
          {viewModel.summaryTiles.map(tile => (
            <View key={tile.label} style={styles.metricTile}>
              <Text style={styles.metricLabel}>{tile.label}</Text>
              <Text style={styles.metricValue}>{tile.value}</Text>
            </View>
          ))}
        </View>
        {backupCue ? (
          <SettingsActionRow
            title={backupCue.title}
            meta={backupCue.description}
            value={backupCue.actionLabel}
            variant="inline"
            onPress={() => navigation.navigate(ROOT_ROUTE_NAMES.Backup)}
          />
        ) : null}
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

          {controller.importantDreamItems.length ? (
            <Card style={styles.sectionCard}>
              <SectionHeader
                title={copy.reviewWorkspaceImportantTitle}
                subtitle={copy.reviewWorkspaceImportantDescription}
              />
              <View style={styles.reviewShelfList}>
                {controller.importantDreamItems.map(item => (
                  <Pressable
                    key={item.dreamId}
                    onPress={() =>
                      navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
                        dreamId: item.dreamId,
                      })
                    }
                    style={({ pressed }) => [
                      styles.reviewShelfCompactRow,
                      pressed ? styles.insightCardPressed : null,
                    ]}
                  >
                    <View style={styles.reviewShelfCompactCopy}>
                      <Text style={styles.reviewShelfCompactEyebrow}>
                        {copy.reviewShelfImportantDreamEyebrow}
                      </Text>
                      <Text style={styles.reviewShelfCompactTitle}>{item.title}</Text>
                      <Text style={styles.reviewShelfCompactMeta}>{item.meta}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textDim} />
                  </Pressable>
                ))}
              </View>
            </Card>
          ) : null}

          {controller.savedSetItems.length ? (
            <Card style={styles.sectionCard}>
              <SectionHeader
                title={copy.reviewWorkspaceSavedSetsTitle}
                subtitle={copy.reviewWorkspaceSavedSetsDescription}
              />
              <View style={styles.savedThreadsList}>
                {controller.savedSetItems.map(item => (
                  <Pressable
                    key={item.key}
                    style={({ pressed }) => [
                      styles.savedThreadRow,
                      pressed ? styles.insightCardPressed : null,
                    ]}
                    onPress={() => {
                      if (item.kind === 'month' && item.monthKey) {
                        navigation.navigate(ROOT_ROUTE_NAMES.MonthlyReport, {
                          yearMonth: item.monthKey,
                        });
                        return;
                      }

                      if (item.kind === 'thread' && item.signal && item.patternKind) {
                        navigation.navigate(ROOT_ROUTE_NAMES.PatternDetail, {
                          signal: item.signal,
                          kind: item.patternKind as PatternDetailKind,
                        });
                      }
                    }}
                  >
                    <View style={styles.savedThreadCopy}>
                      <Text style={styles.reviewShelfCompactEyebrow}>{item.eyebrow}</Text>
                      <Text style={styles.savedThreadTitle}>{item.title}</Text>
                      <Text style={styles.savedThreadMeta}>{item.meta}</Text>
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
