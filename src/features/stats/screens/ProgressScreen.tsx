import React from 'react';
import { Pressable, View } from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
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
      setDreams(listDreams());
    }, []),
  );

  const achievements = getDreamAchievements(dreams);
  const achievementSummary = getDreamAchievementSummary(achievements);
  const weeklyGoalTarget = 3;
  const lastSevenDays = getEntriesLastSevenDays(dreams);
  const weeklyGoalComplete = lastSevenDays >= weeklyGoalTarget;

  return (
    <ScreenContainer scroll>
      <Card style={styles.heroCard}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backLabel}>{copy.progressScreenTitle}</Text>
        </Pressable>
        <SectionHeader title={copy.progressScreenTitle} subtitle={copy.progressScreenSubtitle} large />
      </Card>

      <Card style={styles.sectionCard}>
        <View style={styles.teaserRow}>
          <View style={styles.teaserCard}>
            <Text style={styles.teaserLabel}>{copy.weeklyGoalTitle}</Text>
            <Text style={styles.teaserValue}>{`${lastSevenDays}/${weeklyGoalTarget}`}</Text>
            <Text style={styles.teaserHint}>
              {weeklyGoalComplete ? copy.weeklyGoalStatusDone : copy.weeklyGoalStatusPending}
            </Text>
          </View>
          <View style={[styles.teaserCard, styles.teaserCardAccent]}>
            <Text style={styles.teaserLabel}>{copy.milestonesUnlockedLabel}</Text>
            <Text style={styles.teaserValue}>
              {`${achievementSummary.unlockedCount}/${achievementSummary.totalCount}`}
            </Text>
            <Text style={styles.teaserHint}>
              {achievementSummary.highlightedId
                ? getAchievementContent(achievementSummary.highlightedId, copy).title
                : copy.milestoneInProgress}
            </Text>
          </View>
        </View>
        <InfoRow label={copy.weeklyGoalProgressLabel} value={`${lastSevenDays}/${weeklyGoalTarget}`} />
        <InfoRow
          label={copy.milestoneHighlightLabel}
          value={
            achievementSummary.highlightedId
              ? getAchievementContent(achievementSummary.highlightedId, copy).title
              : copy.milestoneInProgress
          }
        />
      </Card>

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
    </ScreenContainer>
  );
}
