import React from 'react';
import { Pressable, SectionList, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@shopify/restyle';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { Card } from '../../../components/ui/Card';
import { FormField } from '../../../components/ui/FormField';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { ScreenStateCard } from '../components/ScreenStateCard';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { getDreamCopy, getDreamMoodLabels, type DreamCopy } from '../../../constants/copy/dreams';
import { ROOT_ROUTE_NAMES, type RootStackParamList } from '../../../app/navigation/routes';
import { getTabBarReservedSpace } from '../../../app/navigation/tabBarLayout';
import { useI18n } from '../../../i18n/I18nProvider';
import { AppLocale } from '../../../i18n/types';
import { Theme } from '../../../theme/theme';
import { Dream, Mood } from '../model/dream';
import { getDreamDate } from '../model/dreamAnalytics';
import {
  getDreamSearchScore,
  isDreamArchived,
  isDreamStarred,
  sortDreamsForTimeline,
} from '../model/homeTimeline';
import { listDreams } from '../repository/dreamsRepository';
import { createArchiveScreenStyles } from './ArchiveScreen.styles';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';

type ArchiveFilter = 'all' | 'active' | 'archived' | 'starred';
type ArchiveViewMode = 'comfortable' | 'compact';

type ArchiveSection = {
  title: string;
  monthKey: string;
  data: Dream[];
};

type ArchiveCalendarCell = {
  key: string;
  date: string | null;
  dayNumber: number | null;
  count: number;
};

const archiveLayoutTransition = LinearTransition.springify()
  .damping(18)
  .stiffness(180);

function moodLabel(mood: Dream['mood'] | undefined, moodLabels: Record<Mood, string>) {
  return mood ? moodLabels[mood] : undefined;
}

function toLocalDateKey(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function getMonthKeyForDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthKey(dream: Dream) {
  return getMonthKeyForDate(getDreamDate(dream));
}

function getMonthLabel(monthKey: string, locale: string) {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

function formatSelectedDate(dateKey: string, locale: string) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getAvailableMonthKeys(dreams: Dream[]) {
  return Array.from(new Set(dreams.map(getMonthKey))).sort((a, b) => b.localeCompare(a));
}

function getDistinctDayCount(dreams: Dream[]) {
  return new Set(dreams.map(dream => toLocalDateKey(getDreamDate(dream)))).size;
}

function getCountWord(
  count: number,
  locale: AppLocale,
  forms: {
    en: { one: string; other: string };
    uk: { one: string; few: string; many: string };
  },
) {
  if (locale === 'uk') {
    const absolute = Math.abs(count);
    const lastTwo = absolute % 100;
    const last = absolute % 10;

    if (lastTwo >= 11 && lastTwo <= 14) {
      return forms.uk.many;
    }

    if (last === 1) {
      return forms.uk.one;
    }

    if (last >= 2 && last <= 4) {
      return forms.uk.few;
    }

    return forms.uk.many;
  }

  return Math.abs(count) === 1 ? forms.en.one : forms.en.other;
}

function formatArchiveEntryCount(count: number, locale: AppLocale) {
  return `${count} ${getCountWord(count, locale, {
    en: { one: 'entry', other: 'entries' },
    uk: { one: 'запис', few: 'записи', many: 'записів' },
  })}`;
}

function formatArchiveActiveDaysCount(count: number, locale: AppLocale) {
  return `${count} ${getCountWord(count, locale, {
    en: { one: 'active day', other: 'active days' },
    uk: { one: 'активний день', few: 'активні дні', many: 'активних днів' },
  })}`;
}

function getArchiveEmptyContent(
  copy: DreamCopy,
  filter: ArchiveFilter,
  hasScopedDreams: boolean,
  hasVisibleDreams: boolean,
) {
  if (!hasScopedDreams) {
    switch (filter) {
      case 'active':
        return {
          title: copy.archiveEmptyCurrentTitle,
          subtitle: copy.archiveEmptyCurrentDescription,
        };
      case 'archived':
        return {
          title: copy.archiveEmptyArchivedTitle,
          subtitle: copy.archiveEmptyArchivedDescription,
        };
      case 'starred':
        return {
          title: copy.archiveEmptyImportantTitle,
          subtitle: copy.archiveEmptyImportantDescription,
        };
      case 'all':
      default:
        return {
          title: copy.archiveEmptyTitle,
          subtitle: copy.archiveEmptyDescription,
        };
    }
  }

  if (!hasVisibleDreams) {
    return {
      title: copy.archiveNoResultsTitle,
      subtitle: copy.archiveNoResultsDescription,
    };
  }

  return null;
}

function getArchivePills(dream: Dream, copy: DreamCopy, mood?: string) {
  return [
    mood ?? null,
    isDreamStarred(dream) ? copy.starredTag : null,
    isDreamArchived(dream) ? copy.archivedTag : null,
    dream.transcriptSource === 'edited'
      ? copy.editedTranscriptTag
      : dream.transcript
        ? copy.transcriptTag
        : dream.audioUri
          ? copy.audioTag
          : null,
    ...dream.tags.slice(0, 2),
  ].filter((value): value is string => Boolean(value));
}

function formatArchivePreview(dream: Dream, copy: DreamCopy) {
  const text = dream.text?.trim();
  if (text) {
    return text.length > 110 ? `${text.slice(0, 107)}...` : text;
  }

  const transcript = dream.transcript?.trim();
  if (transcript) {
    const prefix =
      dream.transcriptSource === 'edited'
        ? `${copy.editedTranscriptPreviewPrefix}: `
        : `${copy.transcriptPreviewPrefix}: `;
    const visible = transcript.length > 88 ? `${transcript.slice(0, 85)}...` : transcript;
    return `${prefix}${visible}`;
  }

  if (dream.audioUri) {
    return copy.audioOnlyPreview;
  }

  return copy.noDetailsPreview;
}

function buildCalendarCells(monthKey: string, dreams: Dream[]) {
  const [year, month] = monthKey.split('-').map(Number);
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = (firstDayOfMonth.getDay() + 6) % 7;
  const counts = new Map<string, number>();

  dreams.forEach(dream => {
    const dateKey = toLocalDateKey(getDreamDate(dream));
    counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1);
  });

  const cells: ArchiveCalendarCell[] = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({
      key: `pad-start-${index}`,
      date: null,
      dayNumber: null,
      count: 0,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${monthKey}-${String(day).padStart(2, '0')}`;
    cells.push({
      key: dateKey,
      date: dateKey,
      dayNumber: day,
      count: counts.get(dateKey) ?? 0,
    });
  }

  while (cells.length % 7 !== 0) {
    const index = cells.length;
    cells.push({
      key: `pad-end-${index}`,
      date: null,
      dayNumber: null,
      count: 0,
    });
  }

  return cells;
}

function buildCalendarRows(cells: ArchiveCalendarCell[]) {
  const rows: ArchiveCalendarCell[][] = [];

  for (let index = 0; index < cells.length; index += 7) {
    rows.push(cells.slice(index, index + 7));
  }

  return rows;
}

function buildArchiveSections(
  dreams: Dream[],
  selectedMonthKey: string | null,
  locale: string,
  selectedDate: string | null,
): ArchiveSection[] {
  if (!selectedMonthKey) {
    return [];
  }

  return [
    {
      title: selectedDate ? formatSelectedDate(selectedDate, locale) : getMonthLabel(selectedMonthKey, locale),
      monthKey: selectedMonthKey,
      data: dreams,
    },
  ];
}

const ArchiveDreamRow = React.memo(function ArchiveDreamRow({
  dream,
  copy,
  localeKey,
  moodLabels,
  navigation,
  styles,
  viewMode,
}: {
  dream: Dream;
  copy: DreamCopy;
  localeKey: string;
  moodLabels: Record<Mood, string>;
  navigation: NativeStackNavigationProp<RootStackParamList>;
  styles: ReturnType<typeof createArchiveScreenStyles>;
  viewMode: ArchiveViewMode;
}) {
  const date = getDreamDate(dream);
  const mood = moodLabel(dream.mood, moodLabels);
  const isCompact = viewMode === 'compact';
  const pills = getArchivePills(dream, copy, mood).slice(0, isCompact ? 2 : 4);

  return (
    <Pressable
      onPress={() => navigation.navigate(ROOT_ROUTE_NAMES.DreamDetail, { dreamId: dream.id })}
      style={({ pressed }) => [
        styles.listRowPressable,
        pressed ? styles.listRowPressed : null,
      ]}
    >
      <Card style={[styles.listRowCard, isCompact ? styles.listRowCardCompact : null]}>
        <View style={styles.rowTop}>
          <View style={styles.rowCopy}>
            <Text style={[styles.rowTitle, isCompact ? styles.rowTitleCompact : null]}>
              {dream.title || copy.untitled}
            </Text>
            <Text style={[styles.rowMeta, isCompact ? styles.rowMetaCompact : null]}>
              {date.toLocaleDateString(localeKey, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View style={[styles.dayChip, isCompact ? styles.dayChipCompact : null]}>
            <Text style={[styles.dayNumber, isCompact ? styles.dayNumberCompact : null]}>
              {date.getDate()}
            </Text>
            <Text style={[styles.dayWeek, isCompact ? styles.dayWeekCompact : null]}>
              {date.toLocaleDateString(localeKey, {
                weekday: 'short',
              })}
            </Text>
          </View>
        </View>

        <View style={[styles.rowPreviewWrap, isCompact ? styles.rowPreviewWrapCompact : null]}>
          <Text
            style={[styles.rowPreview, isCompact ? styles.rowPreviewCompact : null]}
            numberOfLines={isCompact ? 1 : 2}
          >
            {formatArchivePreview(dream, copy)}
          </Text>
        </View>

        {pills.length ? (
          <View style={styles.pillsRow}>
            {pills.map(label => (
              <View key={`${dream.id}-${label}`} style={styles.pill}>
                <Text style={styles.pillText}>{label}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
});

export default function ArchiveScreen() {
  const t = useTheme<Theme>();
  const { locale } = useI18n();
  const localeKey = locale === 'uk' ? 'uk-UA' : 'en-US';
  const copy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const moodLabels = React.useMemo(() => getDreamMoodLabels(locale), [locale]);
  const styles = createArchiveScreenStyles(t);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [dreams, setDreams] = React.useState(() => listDreams());
  const [filter, setFilter] = React.useState<ArchiveFilter>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedMonthKey, setSelectedMonthKey] = React.useState<string | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [isCalendarExpanded, setIsCalendarExpanded] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<ArchiveViewMode>('comfortable');

  useFocusEffect(
    React.useCallback(() => {
      setDreams(listDreams());
    }, []),
  );

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 160);
  const deferredSearchQuery = React.useDeferredValue(debouncedSearchQuery);
  const isSearchPending =
    searchQuery !== debouncedSearchQuery || deferredSearchQuery !== debouncedSearchQuery;

  const statusScopedDreams = React.useMemo(() => {
    switch (filter) {
      case 'active':
        return dreams.filter(dream => !isDreamArchived(dream));
      case 'archived':
        return dreams.filter(dream => isDreamArchived(dream));
      case 'starred':
        return dreams.filter(dream => isDreamStarred(dream));
      default:
        return dreams;
    }
  }, [dreams, filter]);

  const availableMonthKeys = React.useMemo(
    () => getAvailableMonthKeys(statusScopedDreams),
    [statusScopedDreams],
  );

  React.useEffect(() => {
    if (!availableMonthKeys.length) {
      setSelectedMonthKey(null);
      setSelectedDate(null);
      return;
    }

    if (!selectedMonthKey || !availableMonthKeys.includes(selectedMonthKey)) {
      setSelectedMonthKey(availableMonthKeys[0]);
      setSelectedDate(null);
    }
  }, [availableMonthKeys, selectedMonthKey]);

  React.useEffect(() => {
    if (selectedDate && selectedMonthKey && !selectedDate.startsWith(selectedMonthKey)) {
      setSelectedDate(null);
    }
  }, [selectedDate, selectedMonthKey]);

  const monthDreams = React.useMemo(
    () =>
      selectedMonthKey
        ? statusScopedDreams.filter(dream => getMonthKey(dream) === selectedMonthKey)
        : [],
    [selectedMonthKey, statusScopedDreams],
  );

  const searchedMonthDreams = React.useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
    const sortedDreams = sortDreamsForTimeline(monthDreams, 'newest');

    if (!normalizedQuery) {
      return sortedDreams;
    }

    return sortedDreams
      .map(dream => ({
        dream,
        score: getDreamSearchScore(dream, normalizedQuery),
      }))
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.dream);
  }, [deferredSearchQuery, monthDreams]);

  const visibleDreams = React.useMemo(
    () =>
      selectedDate
        ? searchedMonthDreams.filter(dream => toLocalDateKey(getDreamDate(dream)) === selectedDate)
        : searchedMonthDreams,
    [searchedMonthDreams, selectedDate],
  );

  const sections = React.useMemo(
    () => buildArchiveSections(visibleDreams, selectedMonthKey, localeKey, selectedDate),
    [visibleDreams, selectedMonthKey, localeKey, selectedDate],
  );

  const calendarCells = React.useMemo(
    () => (selectedMonthKey ? buildCalendarCells(selectedMonthKey, searchedMonthDreams) : []),
    [selectedMonthKey, searchedMonthDreams],
  );
  const calendarRows = React.useMemo(() => buildCalendarRows(calendarCells), [calendarCells]);

  const monthEntryCount = searchedMonthDreams.length;
  const monthActiveDays = getDistinctDayCount(searchedMonthDreams);
  const selectedMonthIndex = selectedMonthKey ? availableMonthKeys.indexOf(selectedMonthKey) : -1;
  const canGoOlder = selectedMonthIndex >= 0 && selectedMonthIndex < availableMonthKeys.length - 1;
  const canGoNewer = selectedMonthIndex > 0;
  const weekdayLabels = [
    copy.archiveWeekdayMon,
    copy.archiveWeekdayTue,
    copy.archiveWeekdayWed,
    copy.archiveWeekdayThu,
    copy.archiveWeekdayFri,
    copy.archiveWeekdaySat,
    copy.archiveWeekdaySun,
  ];
  const archiveFilters = [
    { key: 'all' as const, label: copy.archiveFilterAll },
    { key: 'active' as const, label: copy.archiveFilterActive },
    { key: 'starred' as const, label: copy.archiveFilterStarred },
    { key: 'archived' as const, label: copy.archiveFilterArchived },
  ];
  const browseModes = [
    { key: 'comfortable' as const, label: copy.archiveBrowseComfortable },
    { key: 'compact' as const, label: copy.archiveBrowseCompact },
  ];
  const hasScopedDreams = statusScopedDreams.length > 0;
  const hasVisibleDreams = visibleDreams.length > 0;
  const archiveEmptyContent = getArchiveEmptyContent(
    copy,
    filter,
    hasScopedDreams,
    hasVisibleDreams,
  );
  const hasResettableView =
    filter !== 'all' || Boolean(searchQuery.trim()) || Boolean(selectedDate);

  const renderArchiveItem = React.useCallback(
    ({ item }: { item: Dream }) => (
      <ArchiveDreamRow
        dream={item}
        copy={copy}
        localeKey={localeKey}
        moodLabels={moodLabels}
        navigation={navigation}
        styles={styles}
        viewMode={viewMode}
      />
    ),
    [copy, localeKey, moodLabels, navigation, styles, viewMode],
  );

  function moveMonth(direction: 'older' | 'newer') {
    if (selectedMonthIndex < 0) {
      return;
    }

    const nextIndex = direction === 'older' ? selectedMonthIndex + 1 : selectedMonthIndex - 1;
    const nextMonthKey = availableMonthKeys[nextIndex];
    if (!nextMonthKey) {
      return;
    }

    setSelectedMonthKey(nextMonthKey);
    setSelectedDate(null);
  }

  function resetArchiveView() {
    setFilter('all');
    setSearchQuery('');
    setSelectedDate(null);
  }

  if (!dreams.length) {
    return (
      <ScreenContainer scroll={false}>
        <ScreenStateCard
          variant="empty"
          title={copy.archiveEmptyTitle}
          subtitle={copy.archiveEmptyDescription}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false} padded={false}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={40}
        windowSize={8}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + t.spacing.xs,
            paddingBottom: getTabBarReservedSpace(insets.bottom) + t.spacing.xs,
          },
        ]}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <Animated.View
              entering={FadeInDown.duration(240)}
              layout={archiveLayoutTransition}
              style={styles.titleBlock}
            >
              <SectionHeader title={copy.archiveTitle} subtitle={copy.archiveSubtitle} large />
            </Animated.View>

            {selectedMonthKey ? (
              <Animated.View
                entering={FadeInDown.delay(40).duration(260)}
                layout={archiveLayoutTransition}
              >
                <Card style={styles.toolbarCard}>
                  <View style={styles.monthToolbar}>
                    <Pressable
                      style={[styles.monthPagerButton, !canGoOlder ? styles.monthPagerButtonDisabled : null]}
                      disabled={!canGoOlder}
                      onPress={() => moveMonth('older')}
                    >
                      <Text
                        style={[
                          styles.monthPagerButtonText,
                          !canGoOlder ? styles.monthPagerButtonTextDisabled : null,
                        ]}
                      >
                        {copy.archivePreviousMonth}
                      </Text>
                    </Pressable>
                    <View style={styles.monthLabelBlock}>
                      <Text style={styles.monthLabel}>{getMonthLabel(selectedMonthKey, localeKey)}</Text>
                      <View style={styles.monthMetaRow}>
                        <View style={styles.monthMetaChip}>
                          <Text style={styles.monthMetaChipText}>
                            {formatArchiveEntryCount(monthEntryCount, locale)}
                          </Text>
                        </View>
                        <View style={styles.monthMetaChip}>
                          <Text style={styles.monthMetaChipText}>
                            {formatArchiveActiveDaysCount(monthActiveDays, locale)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Pressable
                      style={[styles.monthPagerButton, !canGoNewer ? styles.monthPagerButtonDisabled : null]}
                      disabled={!canGoNewer}
                      onPress={() => moveMonth('newer')}
                    >
                      <Text
                        style={[
                          styles.monthPagerButtonText,
                          !canGoNewer ? styles.monthPagerButtonTextDisabled : null,
                        ]}
                      >
                        {copy.archiveNextMonth}
                      </Text>
                    </Pressable>
                  </View>

                  <FormField
                    placeholder={copy.archiveSearchPlaceholder}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                    helperText={isSearchPending ? copy.timelineLoadingDescription : undefined}
                  />

                  <View style={styles.filtersRow}>
                    {archiveFilters.map(option => {
                      const active = filter === option.key;
                      return (
                        <Pressable
                          key={option.key}
                          onPress={() => {
                            setFilter(option.key);
                            setSelectedDate(null);
                          }}
                          style={[styles.filterChip, active ? styles.filterChipActive : null]}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              active ? styles.filterChipTextActive : null,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.utilityRow}>
                    <View style={styles.utilityLeadingRow}>
                      {selectedDate ? (
                        <View style={styles.controlsMetaChip}>
                          <Text style={styles.controlsMetaChipText}>
                            {formatSelectedDate(selectedDate, localeKey)}
                          </Text>
                        </View>
                      ) : null}

                      <Pressable
                        style={styles.controlsActionChip}
                        onPress={() => setIsCalendarExpanded(current => !current)}
                      >
                        <Text style={styles.controlsActionChipText}>
                          {isCalendarExpanded
                            ? copy.archiveCalendarHideGrid
                            : copy.archiveCalendarShowGrid}
                        </Text>
                      </Pressable>

                      {hasResettableView ? (
                        <Pressable style={styles.controlsActionChip} onPress={resetArchiveView}>
                          <Text style={styles.controlsActionChipText}>{copy.archiveResetView}</Text>
                        </Pressable>
                      ) : null}
                    </View>

                    <View style={styles.utilityTrailingRow}>
                      {browseModes.map(option => {
                        const active = viewMode === option.key;

                        return (
                          <Pressable
                            key={option.key}
                            style={[styles.modeChip, active ? styles.modeChipActive : null]}
                            onPress={() => setViewMode(option.key)}
                          >
                            <Text
                              style={[
                                styles.modeChipText,
                                active ? styles.modeChipTextActive : null,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {isCalendarExpanded ? (
                    <Animated.View
                      entering={FadeInDown.duration(220)}
                      exiting={FadeOutUp.duration(180)}
                      layout={archiveLayoutTransition}
                      style={styles.calendarDaysWrap}
                    >
                      <View style={styles.weekdayRow}>
                        {weekdayLabels.map(label => (
                          <Text key={label} style={styles.weekdayLabel}>
                            {label}
                          </Text>
                        ))}
                      </View>

                      <View style={styles.calendarRows}>
                        {calendarRows.map((row, rowIndex) => (
                          <View key={`calendar-row-${rowIndex}`} style={styles.calendarWeekRow}>
                            {row.map(cell => {
                              const isSelected = cell.date === selectedDate;
                              const isInteractive = Boolean(cell.date && cell.count > 0);

                              return (
                                <Pressable
                                  key={cell.key}
                                  style={[
                                    styles.calendarCell,
                                    !cell.date ? styles.calendarCellPlaceholder : null,
                                    isSelected ? styles.calendarCellSelected : null,
                                    isInteractive ? styles.calendarCellActive : null,
                                  ]}
                                  disabled={!isInteractive}
                                  onPress={() =>
                                    setSelectedDate(current =>
                                      current === cell.date ? null : cell.date,
                                    )
                                  }
                                >
                                  {cell.dayNumber ? (
                                    <>
                                      <Text
                                        style={[
                                          styles.calendarCellDay,
                                          isSelected ? styles.calendarCellDaySelected : null,
                                          cell.count === 0 ? styles.calendarCellDayMuted : null,
                                        ]}
                                      >
                                        {cell.dayNumber}
                                      </Text>
                                      {cell.count > 0 ? (
                                        <Text
                                          style={[
                                            styles.calendarCellCount,
                                            isSelected ? styles.calendarCellCountSelected : null,
                                          ]}
                                        >
                                          {cell.count}
                                        </Text>
                                      ) : null}
                                    </>
                                  ) : null}
                                </Pressable>
                              );
                            })}
                          </View>
                        ))}
                      </View>
                    </Animated.View>
                  ) : null}
                </Card>
              </Animated.View>
            ) : null}

            {archiveEmptyContent || !selectedMonthKey ? (
              <View style={styles.emptyWrap}>
                <ScreenStateCard
                  variant="empty"
                  title={archiveEmptyContent?.title ?? copy.archiveNoResultsTitle}
                  subtitle={archiveEmptyContent?.subtitle ?? copy.archiveNoResultsDescription}
                  actionLabel={hasResettableView ? copy.archiveResetView : undefined}
                  onAction={hasResettableView ? resetArchiveView : undefined}
                />
              </View>
            ) : null}
          </View>
        }
        renderSectionHeader={({ section }) =>
          section.data.length ? (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          ) : null
        }
        renderItem={renderArchiveItem}
      />
    </ScreenContainer>
  );
}
