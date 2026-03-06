import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { TagChip } from '../../../components/ui/TagChip';
import { Text } from '../../../components/ui/Text';
import {
  getDreamCopy,
  getDreamMoodLabels,
  type DreamCopy,
} from '../../../constants/copy/dreams';
import { DREAM_PREVIEW_MAX_LENGTH } from '../../../constants/limits/dreams';
import { ROOT_ROUTE_NAMES, type RootStackParamList } from '../../../app/navigation/routes';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { Dream, Mood } from '../model/dream';
import { getAverageWords, getCurrentStreak, getDreamDate } from '../model/dreamAnalytics';
import { archiveDream, deleteDream, listDreams, unarchiveDream } from '../repository/dreamsRepository';
import { createHomeScreenStyles } from './HomeScreen.styles';

function formatPreview(dream: Dream, copy: DreamCopy) {
  const text = dream.text?.trim();
  if (text) {
    return text.length > DREAM_PREVIEW_MAX_LENGTH
      ? `${text.slice(0, DREAM_PREVIEW_MAX_LENGTH - 3)}...`
      : text;
  }

  if (dream.audioUri) {
    return copy.audioOnlyPreview;
  }

  return copy.noDetailsPreview;
}

function moodLabel(mood: Dream['mood'] | undefined, moodLabels: Record<Mood, string>) {
  return mood ? moodLabels[mood] : undefined;
}

function moodColor(theme: Theme, mood?: Dream['mood']) {
  if (mood === 'positive') {
    return theme.colors.accent;
  }

  if (mood === 'negative') {
    return theme.colors.primaryAlt;
  }

  return theme.colors.primary;
}

function formatDateParts(dream: Dream) {
  const date = getDreamDate(dream);
  return {
    weekday: date.toLocaleDateString([], { weekday: 'short' }),
    day: date.getDate(),
    month: date.toLocaleDateString([], { month: 'short' }),
  };
}

function isDreamArchived(dream: Dream) {
  return typeof dream.archivedAt === 'number';
}

type HomeFilter = 'all' | 'active' | 'archived';

export default function HomeScreen() {
  const t = useTheme<Theme>();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const moodLabels = React.useMemo(() => getDreamMoodLabels(locale), [locale]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [dreams, setDreams] = React.useState(() => listDreams());
  const [selectedFilter, setSelectedFilter] = React.useState<HomeFilter>('all');
  const styles = createHomeScreenStyles(t);
  const homeFilters = React.useMemo<Array<{ key: HomeFilter; label: string }>>(
    () => [
      { key: 'all', label: copy.homeFilterAll },
      { key: 'active', label: copy.homeFilterActive },
      { key: 'archived', label: copy.homeFilterArchived },
    ],
    [copy],
  );
  const activeDreams = React.useMemo(
    () => dreams.filter(dream => !isDreamArchived(dream)),
    [dreams],
  );
  const archivedDreams = React.useMemo(
    () => dreams.filter(dream => isDreamArchived(dream)),
    [dreams],
  );
  const filteredDreams = React.useMemo(() => {
    if (selectedFilter === 'active') {
      return activeDreams;
    }

    if (selectedFilter === 'archived') {
      return archivedDreams;
    }

    return dreams;
  }, [activeDreams, archivedDreams, dreams, selectedFilter]);
  const streak = getCurrentStreak(activeDreams);
  const averageWords = getAverageWords(activeDreams);

  useFocusEffect(
    React.useCallback(() => {
      setDreams(listDreams());
    }, []),
  );

  const swipeMethods = React.useRef<Record<string, SwipeableMethods>>({});
  const activeSwipeId = React.useRef<string | null>(null);

  const closeSwipe = React.useCallback((dreamId: string) => {
    swipeMethods.current[dreamId]?.close();
    if (activeSwipeId.current === dreamId) {
      activeSwipeId.current = null;
    }
  }, []);

  const closePreviousSwipe = React.useCallback((dreamId: string) => {
    if (activeSwipeId.current && activeSwipeId.current !== dreamId) {
      swipeMethods.current[activeSwipeId.current]?.close();
    }
    activeSwipeId.current = dreamId;
  }, []);

  const openDreamEditor = React.useCallback((dreamId: string) => {
    navigation.navigate(ROOT_ROUTE_NAMES.DreamEditor, {
      dreamId,
    });
  }, [navigation]);

  const toggleArchiveFromList = React.useCallback((dream: Dream) => {
    if (isDreamArchived(dream)) {
      unarchiveDream(dream.id);
    } else {
      archiveDream(dream.id);
    }
    setDreams(listDreams());
  }, []);

  const removeDreamFromList = React.useCallback((dreamId: string) => {
    Alert.alert(
      copy.detailDeleteTitle,
      copy.detailDeleteDescription,
      [
        {
          text: copy.detailDeleteCancel,
          style: 'cancel',
        },
        {
          text: copy.detailDeleteConfirm,
          style: 'destructive',
          onPress: () => {
            deleteDream(dreamId);
            setDreams(listDreams());
          },
        },
      ],
    );
  }, [copy]);

  const renderRightActions = (
    dream: Dream,
    swipeableMethods: SwipeableMethods,
  ) => {
    swipeMethods.current[dream.id] = swipeableMethods;

    return (
      <View style={[styles.swipeActionsContainer, styles.swipeRightActionsContainer]}>
        <Pressable
          style={[styles.swipeAction, styles.swipeEditAction]}
          onPress={() => {
            closeSwipe(dream.id);
            openDreamEditor(dream.id);
          }}
        >
          <Text style={styles.swipeActionText}>{copy.swipeEdit}</Text>
        </Pressable>
        <Pressable
          style={[styles.swipeAction, styles.swipeDeleteAction]}
          onPress={() => {
            closeSwipe(dream.id);
            removeDreamFromList(dream.id);
          }}
        >
          <Text
            style={[styles.swipeActionText, styles.swipeActionTextInverted]}
          >
            {copy.swipeDelete}
          </Text>
        </Pressable>
      </View>
    );
  };

  const renderLeftActions = (
    dream: Dream,
    swipeableMethods: SwipeableMethods,
  ) => {
    swipeMethods.current[dream.id] = swipeableMethods;
    const archiveLabel = isDreamArchived(dream)
      ? copy.swipeUnarchive
      : copy.swipeArchive;
    const archiveActionStyle = isDreamArchived(dream)
      ? styles.swipeUnarchiveAction
      : styles.swipeArchiveAction;

    return (
      <View style={[styles.swipeActionsContainer, styles.swipeLeftActionsContainer]}>
        <Pressable
          style={[styles.swipeAction, archiveActionStyle]}
          onPress={() => {
            closeSwipe(dream.id);
            toggleArchiveFromList(dream);
          }}
        >
          <Text
            style={[styles.swipeActionText, styles.swipeActionTextInverted]}
          >
            {archiveLabel}
          </Text>
        </Pressable>
      </View>
    );
  };

  if (!dreams.length) {
    return (
      <ScreenContainer scroll={false} style={styles.emptyContainer}>
        <Card style={styles.emptyCard}>
          <SectionHeader title={copy.emptyTitle} subtitle={copy.emptyDescription} />
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <Card style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>{copy.homeGreeting}</Text>
            <Text style={styles.heroTitle}>{copy.homeTitle}</Text>
            <Text style={styles.heroSubtitle}>{copy.homeSubtitle}</Text>
          </View>
          <View style={styles.heroFacet} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statLabel}>{copy.homeStreakLabel}</Text>
            <Text style={styles.statValue}>{`${streak} ${copy.homeDaysUnit}`}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statLabel}>{copy.homeTotalLabel}</Text>
            <Text style={styles.statValue}>{activeDreams.length}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statLabel}>{copy.homeAverageLabel}</Text>
            <Text style={styles.statValue}>{averageWords}</Text>
          </View>
        </View>
      </Card>

      <Text style={styles.sectionLabel}>{copy.homeSectionLabel}</Text>
      <Text style={styles.sectionHint}>{copy.openDreamHint}</Text>
      <View style={styles.filterRow}>
        {homeFilters.map(filter => {
          const active = selectedFilter === filter.key;
          return (
            <Pressable
              key={filter.key}
              style={[
                styles.filterButton,
                active ? styles.filterButtonActive : null,
              ]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text
                style={[
                  styles.filterButtonLabel,
                  active ? styles.filterButtonLabelActive : null,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!filteredDreams.length ? (
        <Card style={styles.emptyCard}>
          <SectionHeader
            title={
              selectedFilter === 'archived'
                ? copy.emptyArchivedTitle
                : copy.emptyActiveTitle
            }
            subtitle={
              selectedFilter === 'archived'
                ? copy.emptyArchivedDescription
                : copy.emptyActiveDescription
            }
          />
        </Card>
      ) : null}

      {filteredDreams.map(dream => {
        const mood = moodLabel(dream.mood, moodLabels);
        const dateParts = formatDateParts(dream);
        const archived = isDreamArchived(dream);
        return (
          <ReanimatedSwipeable
            key={dream.id}
            containerStyle={styles.swipeableContainer}
            overshootRight={false}
            overshootLeft={false}
            leftThreshold={32}
            rightThreshold={32}
            renderLeftActions={(_, __, methods) =>
              renderLeftActions(dream, methods)
            }
            renderRightActions={(_, __, methods) =>
              renderRightActions(dream, methods)
            }
            onSwipeableOpen={() => closePreviousSwipe(dream.id)}
            onSwipeableClose={() => {
              if (activeSwipeId.current === dream.id) {
                activeSwipeId.current = null;
              }
            }}
          >
            <Pressable
              style={styles.dreamPressable}
              onPress={() =>
                navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
                  dreamId: dream.id,
                })
              }
            >
              <Card style={styles.dreamCard}>
                <View style={styles.dreamRow}>
                  <View style={styles.dateColumn}>
                    <Text style={styles.weekday}>{dateParts.weekday}</Text>
                    <Text style={styles.dayNumber}>{dateParts.day}</Text>
                    <Text style={styles.month}>{dateParts.month}</Text>
                  </View>

                  <View style={styles.dreamContent}>
                    <View style={styles.dreamMeta}>
                      <View style={styles.titleRow}>
                        <Text style={styles.title}>
                          {dream.title || copy.untitled}
                        </Text>
                        <View
                          style={[
                            styles.moodDot,
                            { backgroundColor: moodColor(t, dream.mood) },
                          ]}
                        />
                      </View>
                      <Text style={styles.timestamp}>
                        {dream.sleepDate || new Date(dream.createdAt).toISOString().slice(0, 10)}
                        {' · '}
                        {new Date(dream.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>

                    <Text style={styles.preview}>{formatPreview(dream, copy)}</Text>

                    <View style={styles.tags}>
                      {mood ? <TagChip label={mood} /> : null}
                      {archived ? <TagChip label={copy.archivedTag} /> : null}
                      {dream.audioUri ? <TagChip label={copy.audioTag} /> : null}
                      {dream.tags.map(tag => <TagChip key={tag} label={tag} />)}
                    </View>
                  </View>

                  <View
                    style={[
                      styles.cardFacet,
                      { backgroundColor: moodColor(t, dream.mood) },
                    ]}
                  />
                </View>
              </Card>
            </Pressable>
          </ReanimatedSwipeable>
        );
      })}
    </ScreenContainer>
  );
}
