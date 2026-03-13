import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card } from '../../../components/ui/Card';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';
import {
  type DreamAchievementId,
  type DreamAchievementProgress,
} from '../model/achievements';
import {
  statsLayoutTransition,
  type StatsCopy,
  type StatsStyles,
} from './StatsScreenSection.shared';

function getAchievementContent(id: DreamAchievementId, copy: StatsCopy) {
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

export function StatsMilestonesSection({
  copy,
  styles,
  overallLastSevenDays,
  weeklyGoalTarget,
  weeklyGoalComplete,
  unlockedCount,
  totalCount,
  milestoneSummaryHint,
  achievements,
  highlightedAchievementId,
  isExpanded,
  onToggleExpanded,
}: {
  copy: StatsCopy;
  styles: StatsStyles;
  overallLastSevenDays: number;
  weeklyGoalTarget: number;
  weeklyGoalComplete: boolean;
  unlockedCount: number;
  totalCount: number;
  milestoneSummaryHint: string;
  achievements: ReadonlyArray<DreamAchievementProgress>;
  highlightedAchievementId: DreamAchievementId | null;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}) {
  const t = useTheme<Theme>();

  return (
    <Animated.View layout={statsLayoutTransition}>
      <Card style={styles.sectionCard}>
        <Pressable style={styles.detailsToggleRow} onPress={onToggleExpanded}>
          <View style={styles.detailsToggleCopy}>
            <Text style={styles.detailsToggleTitle}>{copy.milestonesTitle}</Text>
            <Text style={styles.detailsToggleDescription}>
              {`${overallLastSevenDays}/${weeklyGoalTarget} • ${unlockedCount}/${totalCount} • ${milestoneSummaryHint}`}
            </Text>
          </View>
          <View style={styles.detailsTogglePill}>
            <Text style={styles.detailsTogglePillText}>
              {isExpanded ? copy.milestonesToggleHide : copy.milestonesToggleShow}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={t.colors.text}
            />
          </View>
        </Pressable>

        {isExpanded ? (
          <Animated.View
            entering={FadeInDown.duration(180)}
            layout={statsLayoutTransition}
            style={styles.achievementsList}
          >
            <View style={styles.teaserRow}>
              <View style={styles.teaserCard}>
                <Text style={styles.teaserLabel}>{copy.weeklyGoalTitle}</Text>
                <Text style={styles.teaserValue}>{`${overallLastSevenDays}/${weeklyGoalTarget}`}</Text>
                <Text style={styles.teaserHint}>
                  {weeklyGoalComplete ? copy.weeklyGoalStatusDone : copy.weeklyGoalStatusPending}
                </Text>
              </View>
              <View style={[styles.teaserCard, styles.teaserCardAccent]}>
                <Text style={styles.teaserLabel}>{copy.milestonesUnlockedLabel}</Text>
                <Text style={styles.teaserValue}>{`${unlockedCount}/${totalCount}`}</Text>
                <Text style={styles.teaserHint}>{milestoneSummaryHint}</Text>
              </View>
            </View>

            {achievements.map(achievement => {
              const content = getAchievementContent(achievement.id, copy);
              const progressValue = `${Math.min(achievement.current, achievement.target)}/${achievement.target}`;
              const progressRatio = Math.min(achievement.current / achievement.target, 1);
              const isHighlighted = achievement.id === highlightedAchievementId;

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
                  <Text style={styles.detailsListLabel}>{copy.milestoneProgressLabel}</Text>
                  <Text style={styles.threadMatchMeta}>{progressValue}</Text>
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
          </Animated.View>
        ) : null}
      </Card>
    </Animated.View>
  );
}
