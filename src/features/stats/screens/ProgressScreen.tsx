import React from 'react';
import { Pressable, View } from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { Card } from '../../../components/ui/Card';
import { InfoRow } from '../../../components/ui/InfoRow';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { ROOT_ROUTE_NAMES, type RootStackParamList } from '../../../app/navigation/routes';
import { getStatsCopy } from '../../../constants/copy/stats';
import { Theme } from '../../../theme/theme';
import { listDreams } from '../../dreams/repository/dreamsRepository';
import {
  getDreamAchievements,
  getDreamAchievementSummary,
  type DreamAchievementId,
} from '../model/achievements';
import { getEntriesLastSevenDays } from '../../dreams/model/dreamAnalytics';
import { createProgressScreenStyles } from './ProgressScreen.styles';
import { useI18n } from '../../../i18n/I18nProvider';
import { trackLocalSurfaceLoad } from '../../../services/observability/perf';

const progressLayoutTransition = LinearTransition.springify()
  .damping(18)
  .stiffness(180);

function getAchievementContent(id: DreamAchievementId, copy: ReturnType<typeof getStatsCopy>) {
  switch (id) {
    case 'first-dream':
      return {
        title: copy.milestoneFirstDreamTitle,
        description: copy.milestoneFirstDreamDescription,
      };
    case 'three-day-streak':
      return {
        title: copy.milestoneThreeDayStreakTitle,
        description: copy.milestoneThreeDayStreakDescription,
      };
    case 'ten-dreams':
      return {
        title: copy.milestoneTenDreamsTitle,
        description: copy.milestoneTenDreamsDescription,
      };
    case 'first-voice-dream':
      return {
        title: copy.milestoneFirstVoiceDreamTitle,
        description: copy.milestoneFirstVoiceDreamDescription,
      };
  }
}

export default function ProgressScreen() {
  const t = useTheme<Theme>();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getStatsCopy(locale), [locale]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  useRoute<RouteProp<RootStackParamList, typeof ROOT_ROUTE_NAMES.Progress>>();
  const styles = createProgressScreenStyles(t);
  const [dreams, setDreams] = React.useState(() => listDreams());

  useFocusEffect(
    React.useCallback(() => {
      const startedAt = Date.now();
      const nextDreams = listDreams();
      React.startTransition(() => {
        setDreams(nextDreams);
      });
      trackLocalSurfaceLoad('progress_refresh', startedAt, nextDreams.length);
    }, []),
  );

  const achievements = getDreamAchievements(dreams);
  const achievementSummary = getDreamAchievementSummary(achievements);
  const weeklyGoalTarget = 3;
  const lastSevenDays = getEntriesLastSevenDays(dreams);
  const weeklyGoalComplete = lastSevenDays >= weeklyGoalTarget;
  const milestonesComplete =
    achievementSummary.unlockedCount === achievementSummary.totalCount;
  const highlightedAchievement = achievementSummary.highlightedId
    ? achievements.find(achievement => achievement.id === achievementSummary.highlightedId) ?? null
    : null;
  const highlightedAchievementTitle = achievementSummary.highlightedId
    ? getAchievementContent(achievementSummary.highlightedId, copy).title
    : null;
  const milestoneSummaryHint =
    milestonesComplete
      ? copy.milestonesCompleteTitle
      : highlightedAchievementTitle ?? copy.milestoneInProgress;
  const highlightedAchievementContent = highlightedAchievement
    ? getAchievementContent(highlightedAchievement.id, copy)
    : null;
  const highlightedProgressRatio = highlightedAchievement
    ? Math.min(highlightedAchievement.current / highlightedAchievement.target, 1)
    : 0;
  const highlightedProgressValue = highlightedAchievement
    ? `${Math.min(highlightedAchievement.current, highlightedAchievement.target)}/${highlightedAchievement.target}`
    : null;

  return (
    <ScreenContainer scroll>
      <Animated.View layout={progressLayoutTransition}>
        <Card style={styles.heroCard}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backLabel}>{copy.progressBackButton}</Text>
          </Pressable>

          <View style={styles.heroHeader}>
            <SectionHeader
              title={copy.progressScreenTitle}
              subtitle={copy.progressScreenSubtitle}
              large
            />
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{copy.weeklyGoalTitle}</Text>
              <Text style={styles.summaryValue}>{`${lastSevenDays}/${weeklyGoalTarget}`}</Text>
              <Text style={styles.summaryHint}>
                {weeklyGoalComplete ? copy.weeklyGoalStatusDone : copy.weeklyGoalStatusPending}
              </Text>
            </View>
            <View style={[styles.summaryCard, styles.summaryCardAccent]}>
              <Text style={styles.summaryLabel}>{copy.milestonesUnlockedLabel}</Text>
              <Text style={styles.summaryValue}>
                {`${achievementSummary.unlockedCount}/${achievementSummary.totalCount}`}
              </Text>
              <Text style={styles.summaryHint}>{milestoneSummaryHint}</Text>
            </View>
          </View>

          <View style={styles.focusCard}>
            <Text style={styles.focusLabel}>
              {milestonesComplete ? copy.progressFocusDoneTitle : copy.progressFocusTitle}
            </Text>
            {!milestonesComplete && highlightedAchievement && highlightedAchievementContent ? (
              <>
                <Text style={styles.focusTitle}>{highlightedAchievementContent.title}</Text>
                <Text style={styles.focusDescription}>
                  {highlightedAchievementContent.description}
                </Text>
                <View style={styles.focusMetaRow}>
                  <Text style={styles.focusMetaText}>
                    {`${copy.milestoneProgressLabel}: ${highlightedProgressValue}`}
                  </Text>
                  <View
                    style={[
                      styles.achievementBadge,
                      highlightedAchievement.unlocked ? styles.achievementBadgeUnlocked : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.achievementBadgeText,
                        highlightedAchievement.unlocked
                          ? styles.achievementBadgeTextUnlocked
                          : null,
                      ]}
                    >
                      {highlightedAchievement.unlocked
                        ? copy.milestoneUnlocked
                        : copy.milestoneInProgress}
                    </Text>
                  </View>
                </View>
                <View style={styles.achievementProgressTrack}>
                  <View
                    style={[
                      styles.achievementProgressFill,
                      highlightedAchievement.unlocked
                        ? styles.achievementProgressFillUnlocked
                        : null,
                      { width: `${highlightedProgressRatio * 100}%` },
                    ]}
                  />
                </View>
              </>
            ) : (
              <Text style={styles.focusDescription}>{copy.progressFocusDoneDescription}</Text>
            )}
          </View>
        </Card>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(220)}
        layout={progressLayoutTransition}
      >
        <Card style={styles.sectionCard}>
          <SectionHeader title={copy.milestonesTitle} subtitle={copy.milestonesDescription} />
          <View style={styles.achievementsList}>
            {achievements.map(achievement => {
              const content = getAchievementContent(achievement.id, copy);
              const progressValue = `${Math.min(achievement.current, achievement.target)}/${achievement.target}`;
              const progressRatio = Math.min(achievement.current / achievement.target, 1);
              const isHighlighted = achievement.id === achievementSummary.highlightedId;

              return (
                <View
                  key={achievement.id}
                  style={[
                    styles.achievementItem,
                    achievement.unlocked ? styles.achievementItemUnlocked : null,
                    isHighlighted ? styles.achievementItemHighlighted : null,
                  ]}
                >
                  <View style={styles.achievementHeaderRow}>
                    <View style={styles.achievementCopy}>
                      <Text style={styles.achievementTitle}>{content.title}</Text>
                      <Text style={styles.achievementDescription}>{content.description}</Text>
                    </View>
                    <View
                      style={[
                        styles.achievementBadge,
                        achievement.unlocked ? styles.achievementBadgeUnlocked : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.achievementBadgeText,
                          achievement.unlocked ? styles.achievementBadgeTextUnlocked : null,
                        ]}
                      >
                        {achievement.unlocked ? copy.milestoneUnlocked : copy.milestoneInProgress}
                      </Text>
                    </View>
                  </View>
                  <InfoRow label={copy.milestoneProgressLabel} value={progressValue} />
                  <View style={styles.achievementProgressTrack}>
                    <View
                      style={[
                        styles.achievementProgressFill,
                        achievement.unlocked ? styles.achievementProgressFillUnlocked : null,
                        { width: `${progressRatio * 100}%` },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </Card>
      </Animated.View>
    </ScreenContainer>
  );
}
