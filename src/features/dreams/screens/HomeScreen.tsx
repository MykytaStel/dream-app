import React from 'react';
import { Alert, Pressable, StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../../components/ui/Button';
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
import {
  ROOT_ROUTE_NAMES,
  TAB_ROUTE_NAMES,
  type RootStackParamList,
} from '../../../app/navigation/routes';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { ScreenStateCard } from '../components/ScreenStateCard';
import { getDreamLayout } from '../constants/layout';
import { Dream, Mood } from '../model/dream';
import { getAverageWords, getCurrentStreak, getDreamDate } from '../model/dreamAnalytics';
import {
  applyHomeTimelineFilters,
  DEFAULT_HOME_TIMELINE_FILTERS,
  getAvailableTimelineTags,
  type HomeArchiveFilter,
  type HomeDateRangeFilter,
  type HomeEntryTypeFilter,
  hasActiveTimelineRefinements,
  isDreamArchived,
  type HomeSortOrder,
  type HomeTimelineFilters,
} from '../model/homeTimeline';
import { archiveDream, deleteDream, listDreams, unarchiveDream } from '../repository/dreamsRepository';
import { getDreamDraft, type DreamDraft } from '../services/dreamDraftService';
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

function formatResultCount(count: number, copy: DreamCopy) {
  return `${count} ${count === 1 ? copy.homeResultsSingle : copy.homeResultsPlural}`;
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

export default function HomeScreen() {
  const t = useTheme<Theme>();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const moodLabels = React.useMemo(() => getDreamMoodLabels(locale), [locale]);
  const layout = React.useMemo(() => getDreamLayout(t), [t]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [dreams, setDreams] = React.useState<Dream[]>([]);
  const [draft, setDraft] = React.useState<DreamDraft | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [timelineFilters, setTimelineFilters] = React.useState<HomeTimelineFilters>(
    DEFAULT_HOME_TIMELINE_FILTERS,
  );
  const [isRefineExpanded, setIsRefineExpanded] = React.useState(false);
  const styles = createHomeScreenStyles(t);
  const homeFilters = React.useMemo<Array<{ key: HomeArchiveFilter; label: string }>>(
    () => [
      { key: 'all', label: copy.homeFilterAll },
      { key: 'active', label: copy.homeFilterActive },
      { key: 'archived', label: copy.homeFilterArchived },
    ],
    [copy],
  );
  const moodFilters = React.useMemo<Array<{ key: HomeTimelineFilters['mood']; label: string }>>(
    () => [
      { key: 'all', label: copy.homeMoodFilterAll },
      { key: 'positive', label: moodLabels.positive },
      { key: 'neutral', label: moodLabels.neutral },
      { key: 'negative', label: moodLabels.negative },
    ],
    [copy, moodLabels],
  );
  const typeFilters = React.useMemo<Array<{ key: HomeEntryTypeFilter; label: string }>>(
    () => [
      { key: 'all', label: copy.homeTypeFilterAll },
      { key: 'text', label: copy.homeTypeFilterText },
      { key: 'audio', label: copy.homeTypeFilterAudio },
      { key: 'mixed', label: copy.homeTypeFilterMixed },
    ],
    [copy],
  );
  const dateRangeFilters = React.useMemo<Array<{ key: HomeDateRangeFilter; label: string }>>(
    () => [
      { key: 'all', label: copy.homeDateRangeAll },
      { key: '7d', label: copy.homeDateRange7d },
      { key: '30d', label: copy.homeDateRange30d },
      { key: '90d', label: copy.homeDateRange90d },
    ],
    [copy],
  );
  const sortOptions = React.useMemo<Array<{ key: HomeSortOrder; label: string }>>(
    () => [
      { key: 'newest', label: copy.homeSortFilterNewest },
      { key: 'oldest', label: copy.homeSortFilterOldest },
    ],
    [copy],
  );
  const activeDreams = React.useMemo(
    () => dreams.filter(dream => !isDreamArchived(dream)),
    [dreams],
  );
  const archiveScopedDreams = React.useMemo(
    () =>
      dreams.filter(dream => {
        if (timelineFilters.archive === 'active') {
          return !isDreamArchived(dream);
        }

        if (timelineFilters.archive === 'archived') {
          return isDreamArchived(dream);
        }

        return true;
      }),
    [dreams, timelineFilters.archive],
  );
  const availableTags = React.useMemo(
    () => getAvailableTimelineTags(archiveScopedDreams),
    [archiveScopedDreams],
  );
  const visibleDreams = React.useMemo(
    () => applyHomeTimelineFilters(dreams, timelineFilters),
    [dreams, timelineFilters],
  );
  const hasActiveRefinements = React.useMemo(
    () => hasActiveTimelineRefinements(timelineFilters),
    [timelineFilters],
  );
  const streak = getCurrentStreak(activeDreams);
  const averageWords = getAverageWords(activeDreams);

  const refreshDreams = React.useCallback(() => {
    setLoading(true);
    setLoadError(null);

    try {
      setDreams(listDreams());
      setDraft(getDreamDraft());
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
    const nextTags = timelineFilters.tags.filter(tag => availableTags.includes(tag));
    if (nextTags.length === timelineFilters.tags.length) {
      return;
    }

    setTimelineFilters(current => ({
      ...current,
      tags: current.tags.filter(tag => availableTags.includes(tag)),
    }));
  }, [availableTags, timelineFilters.tags]);

  React.useEffect(() => {
    if (!activeSwipeId.current) {
      return;
    }

    const activeStillVisible = visibleDreams.some(dream => dream.id === activeSwipeId.current);
    if (!activeStillVisible) {
      activeSwipeId.current = null;
    }
  }, [visibleDreams]);

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

  const openContinueDraft = React.useCallback(() => {
    closeActiveSwipe();
    navigation.navigate(ROOT_ROUTE_NAMES.Tabs, {
      screen: TAB_ROUTE_NAMES.New,
      params: {
        entryMode: 'default',
      },
    });
  }, [closeActiveSwipe, navigation]);

  const openQuickVoiceCapture = React.useCallback(() => {
    closeActiveSwipe();
    navigation.navigate(ROOT_ROUTE_NAMES.Tabs, {
      screen: TAB_ROUTE_NAMES.New,
      params: {
        entryMode: 'voice',
        launchKey: Date.now(),
      },
    });
  }, [closeActiveSwipe, navigation]);

  const updateTimelineFilters = React.useCallback(
    (updater: (current: HomeTimelineFilters) => HomeTimelineFilters) => {
      closeActiveSwipe();
      setTimelineFilters(current => updater(current));
    },
    [closeActiveSwipe],
  );

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

  if (!dreams.length && !draft) {
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

        <View style={styles.heroActionsRow}>
          <Button
            title={copy.homeRecordNow}
            onPress={openQuickVoiceCapture}
            style={styles.heroPrimaryAction}
          />
          {draft ? (
            <Button
              title={copy.homeContinueDraft}
              variant="ghost"
              onPress={openContinueDraft}
              style={styles.heroSecondaryAction}
            />
          ) : null}
        </View>

        {draft ? (
          <Text style={styles.heroActionHint}>{copy.homeDraftShortcutHint}</Text>
        ) : null}
      </Card>

      <Text style={styles.sectionLabel}>{copy.homeSectionLabel}</Text>
      <Text style={styles.sectionHint}>{copy.openDreamHint}</Text>
      <Card style={styles.filtersCard}>
        <FormField
          placeholder={copy.homeSearchPlaceholder}
          value={timelineFilters.searchQuery}
          onChangeText={value =>
            updateTimelineFilters(current => ({
              ...current,
              searchQuery: value,
            }))
          }
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.primaryControlsRow}>
          <View style={styles.filterRow}>
            {homeFilters.map(filter => {
              const active = timelineFilters.archive === filter.key;
              return (
                <Pressable
                  key={filter.key}
                  style={[
                    styles.filterButton,
                    active ? styles.filterButtonActive : null,
                  ]}
                  onPress={() =>
                    updateTimelineFilters(current => ({
                      ...current,
                      archive: filter.key,
                    }))
                  }
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

          <View style={styles.primaryActionsRow}>
            <Text style={styles.resultCount}>{formatResultCount(visibleDreams.length, copy)}</Text>
            <Pressable
              style={[
                styles.inlineActionButton,
                isRefineExpanded ? styles.inlineActionButtonActive : null,
              ]}
              onPress={() => setIsRefineExpanded(current => !current)}
            >
              <Text
                style={[
                  styles.inlineActionButtonText,
                  isRefineExpanded ? styles.inlineActionButtonTextActive : null,
                ]}
              >
                {isRefineExpanded ? copy.homeHideFilters : copy.homeShowFilters}
              </Text>
            </Pressable>
          </View>
        </View>

        {hasActiveRefinements ? (
          <View style={styles.activeFiltersRow}>
            {timelineFilters.mood !== 'all' ? (
              <TagChip label={moodLabel(timelineFilters.mood, moodLabels) ?? copy.homeMoodFilterAll} />
            ) : null}
            {timelineFilters.entryType !== 'all' ? (
              <TagChip
                label={typeFilters.find(filter => filter.key === timelineFilters.entryType)?.label ?? timelineFilters.entryType}
              />
            ) : null}
            {timelineFilters.tags.map(tag => <TagChip key={tag} label={tag} />)}
            {timelineFilters.dateRange !== 'all' ? (
              <TagChip
                label={
                  dateRangeFilters.find(filter => filter.key === timelineFilters.dateRange)?.label ??
                  timelineFilters.dateRange
                }
              />
            ) : null}
            {timelineFilters.sortOrder !== 'newest' ? (
              <TagChip
                label={
                  sortOptions.find(option => option.key === timelineFilters.sortOrder)?.label ??
                  timelineFilters.sortOrder
                }
              />
            ) : null}
            {timelineFilters.searchQuery.trim() ? <TagChip label={timelineFilters.searchQuery.trim()} /> : null}
            <Pressable
              style={styles.clearFiltersButton}
              onPress={() => {
                closeActiveSwipe();
                setTimelineFilters(current => ({
                  ...DEFAULT_HOME_TIMELINE_FILTERS,
                  archive: current.archive,
                }));
              }}
            >
              <Text style={styles.clearFiltersButtonText}>{copy.homeClearFilters}</Text>
            </Pressable>
          </View>
        ) : null}

        {isRefineExpanded ? (
          <>
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>{copy.homeMoodFilterLabel}</Text>
              <View style={styles.filterRow}>
                {moodFilters.map(filter => {
                  const active = timelineFilters.mood === filter.key;
                  return (
                    <Pressable
                      key={filter.key}
                      style={[
                        styles.filterButton,
                        active ? styles.filterButtonActive : null,
                      ]}
                      onPress={() =>
                        updateTimelineFilters(current => ({
                          ...current,
                          mood: filter.key,
                        }))
                      }
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
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>{copy.homeTypeFilterLabel}</Text>
              <View style={styles.filterRow}>
                {typeFilters.map(filter => {
                  const active = timelineFilters.entryType === filter.key;
                  return (
                    <Pressable
                      key={filter.key}
                      style={[
                        styles.filterButton,
                        active ? styles.filterButtonActive : null,
                      ]}
                      onPress={() =>
                        updateTimelineFilters(current => ({
                          ...current,
                          entryType: filter.key,
                        }))
                      }
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
            </View>

            {availableTags.length > 0 ? (
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>{copy.homeTagFilterLabel}</Text>
                <View style={styles.filterRow}>
                  {availableTags.map(tag => {
                    const active = timelineFilters.tags.includes(tag);
                    return (
                      <Pressable
                        key={tag}
                        style={[
                          styles.filterButton,
                          active ? styles.filterButtonActive : null,
                        ]}
                        onPress={() =>
                          updateTimelineFilters(current => ({
                            ...current,
                            tags: current.tags.includes(tag)
                              ? current.tags.filter(value => value !== tag)
                              : [...current.tags, tag],
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.filterButtonLabel,
                            active ? styles.filterButtonLabelActive : null,
                          ]}
                        >
                          {tag}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>{copy.homeDateRangeFilterLabel}</Text>
              <View style={styles.filterRow}>
                {dateRangeFilters.map(filter => {
                  const active = timelineFilters.dateRange === filter.key;
                  return (
                    <Pressable
                      key={filter.key}
                      style={[
                        styles.filterButton,
                        active ? styles.filterButtonActive : null,
                      ]}
                      onPress={() =>
                        updateTimelineFilters(current => ({
                          ...current,
                          dateRange: filter.key,
                        }))
                      }
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
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>{copy.homeSortFilterLabel}</Text>
              <View style={styles.filterRow}>
                {sortOptions.map(option => {
                  const active = timelineFilters.sortOrder === option.key;
                  return (
                    <Pressable
                      key={option.key}
                      style={[
                        styles.filterButton,
                        active ? styles.filterButtonActive : null,
                      ]}
                      onPress={() =>
                        updateTimelineFilters(current => ({
                          ...current,
                          sortOrder: option.key,
                        }))
                      }
                    >
                      <Text
                        style={[
                          styles.filterButtonLabel,
                          active ? styles.filterButtonLabelActive : null,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </>
        ) : null}
      </Card>

      {!archiveScopedDreams.length ? (
        <Card style={styles.emptyCard}>
          <SectionHeader
            title={
              timelineFilters.archive === 'archived'
                ? copy.emptyArchivedTitle
                : copy.emptyActiveTitle
            }
            subtitle={
              timelineFilters.archive === 'archived'
                ? copy.emptyArchivedDescription
                : copy.emptyActiveDescription
            }
          />
        </Card>
      ) : null}

      {archiveScopedDreams.length > 0 && !visibleDreams.length ? (
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
