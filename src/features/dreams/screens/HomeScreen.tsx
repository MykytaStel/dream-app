import React from 'react';
import { Alert, Pressable, StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../../components/ui/Card';
import { FormField } from '../../../components/ui/FormField';
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
import { ScreenStateCard } from '../components/ScreenStateCard';
import { getDreamLayout } from '../constants/layout';
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

function matchesDreamSearch(dream: Dream, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const searchableParts = [
    dream.title,
    dream.text,
    dream.sleepContext?.importantEvents,
    dream.sleepContext?.medications,
    dream.sleepContext?.healthNotes,
    ...dream.tags,
  ];

  return searchableParts.some(part => part?.toLowerCase().includes(normalizedQuery));
}

function SwipeActionButton({
  label,
  onPress,
  actionStyle,
  textStyle,
  hitSlop,
}: {
  label: string;
  onPress: () => void;
  actionStyle: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
  hitSlop: number;
}) {
  return (
    <Pressable hitSlop={hitSlop} style={actionStyle} onPress={onPress}>
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}

type HomeFilter = 'all' | 'active' | 'archived';

export default function HomeScreen() {
  const t = useTheme<Theme>();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const moodLabels = React.useMemo(() => getDreamMoodLabels(locale), [locale]);
  const layout = React.useMemo(() => getDreamLayout(t), [t]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [dreams, setDreams] = React.useState<Dream[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = React.useState<HomeFilter>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
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
  const visibleDreams = React.useMemo(
    () => filteredDreams.filter(dream => matchesDreamSearch(dream, searchQuery)),
    [filteredDreams, searchQuery],
  );
  const streak = getCurrentStreak(activeDreams);
  const averageWords = getAverageWords(activeDreams);

  const refreshDreams = React.useCallback(() => {
    setLoading(true);
    setLoadError(null);

    try {
      setDreams(listDreams());
    } catch (error) {
      setLoadError(String(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const swipeMethods = React.useRef<Record<string, SwipeableMethods>>({});
  const activeSwipeId = React.useRef<string | null>(null);

  const closeActiveSwipe = React.useCallback(() => {
    const activeId = activeSwipeId.current;
    if (!activeId) {
      return;
    }

    swipeMethods.current[activeId]?.close();
    activeSwipeId.current = null;
  }, []);

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

  useFocusEffect(
    React.useCallback(() => {
      refreshDreams();
      return () => {
        closeActiveSwipe();
      };
    }, [closeActiveSwipe, refreshDreams]),
  );

  React.useEffect(() => {
    const dreamIds = new Set(dreams.map(dream => dream.id));

    Object.keys(swipeMethods.current).forEach(dreamId => {
      if (dreamIds.has(dreamId)) {
        return;
      }

      delete swipeMethods.current[dreamId];
      if (activeSwipeId.current === dreamId) {
        activeSwipeId.current = null;
      }
    });
  }, [dreams]);

  React.useEffect(() => {
    if (!activeSwipeId.current) {
      return;
    }

    const activeStillVisible = filteredDreams.some(dream => dream.id === activeSwipeId.current);
    if (!activeStillVisible) {
      activeSwipeId.current = null;
    }
  }, [filteredDreams]);

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

    refreshDreams();
  }, [refreshDreams]);

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
            refreshDreams();
          },
        },
      ],
    );
  }, [copy, refreshDreams]);

  const renderRightActions = (
    dream: Dream,
    swipeableMethods: SwipeableMethods,
  ) => {
    swipeMethods.current[dream.id] = swipeableMethods;

    return (
      <View style={[styles.swipeActionsContainer, styles.swipeRightActionsContainer]}>
        <SwipeActionButton
          label={copy.swipeEdit}
          hitSlop={layout.swipeActionHitSlop}
          actionStyle={[styles.swipeAction, styles.swipeEditAction]}
          textStyle={styles.swipeActionText}
          onPress={() => {
            closeSwipe(dream.id);
            openDreamEditor(dream.id);
          }}
        />
        <SwipeActionButton
          label={copy.swipeDelete}
          hitSlop={layout.swipeActionHitSlop}
          actionStyle={[styles.swipeAction, styles.swipeDeleteAction]}
          textStyle={[styles.swipeActionText, styles.swipeActionTextInverted]}
          onPress={() => {
            closeSwipe(dream.id);
            removeDreamFromList(dream.id);
          }}
        />
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
        <SwipeActionButton
          label={archiveLabel}
          hitSlop={layout.swipeActionHitSlop}
          actionStyle={[styles.swipeAction, archiveActionStyle]}
          textStyle={[styles.swipeActionText, styles.swipeActionTextInverted]}
          onPress={() => {
            closeSwipe(dream.id);
            toggleArchiveFromList(dream);
          }}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenContainer scroll={false} style={styles.emptyContainer}>
        <ScreenStateCard
          variant="loading"
          title={copy.timelineLoadingTitle}
          subtitle={copy.timelineLoadingDescription}
        />
      </ScreenContainer>
    );
  }

  if (loadError) {
    return (
      <ScreenContainer scroll={false} style={styles.emptyContainer}>
        <ScreenStateCard
          variant="error"
          title={copy.timelineErrorTitle}
          subtitle={copy.timelineErrorDescription}
          actionLabel={copy.actionRetry}
          onAction={refreshDreams}
        />
      </ScreenContainer>
    );
  }

  if (!dreams.length) {
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
      <FormField
        label={copy.homeSearchLabel}
        placeholder={copy.homeSearchPlaceholder}
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />
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
              onPress={() => {
                closeActiveSwipe();
                setSelectedFilter(filter.key);
              }}
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

      {filteredDreams.length > 0 && !visibleDreams.length ? (
        <ScreenStateCard
          variant="empty"
          title={copy.homeSearchEmptyTitle}
          subtitle={copy.homeSearchEmptyDescription}
        />
      ) : null}

      {visibleDreams.map(dream => {
        const mood = moodLabel(dream.mood, moodLabels);
        const dateParts = formatDateParts(dream);
        const archived = isDreamArchived(dream);
        return (
          <ReanimatedSwipeable
            key={dream.id}
            containerStyle={styles.swipeableContainer}
            overshootRight={false}
            overshootLeft={false}
            leftThreshold={layout.swipeThreshold}
            rightThreshold={layout.swipeThreshold}
            dragOffsetFromLeftEdge={layout.swipeDragOffset}
            dragOffsetFromRightEdge={layout.swipeDragOffset}
            friction={1.9}
            renderLeftActions={(_, __, methods) =>
              renderLeftActions(dream, methods)
            }
            renderRightActions={(_, __, methods) =>
              renderRightActions(dream, methods)
            }
            onSwipeableWillOpen={() => closePreviousSwipe(dream.id)}
            onSwipeableOpen={() => {
              activeSwipeId.current = dream.id;
            }}
            onSwipeableClose={() => {
              if (activeSwipeId.current === dream.id) {
                activeSwipeId.current = null;
              }
            }}
          >
            <Pressable
              style={styles.dreamPressable}
              onPress={() => {
                closeActiveSwipe();
                navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, {
                  dreamId: dream.id,
                });
              }}
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
