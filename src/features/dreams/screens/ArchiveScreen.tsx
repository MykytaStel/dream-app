import React from 'react';
import { SectionList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@shopify/restyle';
import Animated, {
  FadeInDown,
  LinearTransition,
} from 'react-native-reanimated';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { ScreenStateCard } from '../components/ScreenStateCard';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { Card } from '../../../components/ui/Card';
import { SkeletonBlock } from '../../../components/ui/SkeletonBlock';
import {
  getDreamCopy,
  getDreamMoodLabels,
} from '../../../constants/copy/dreams';
import { type RootStackParamList } from '../../../app/navigation/routes';
import {
  openNewDreamTab,
  openWakeEntry,
} from '../../../app/navigation/navigationRef';
import { getTabBarReservedSpace } from '../../../app/navigation/tabBarLayout';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { getPracticeCopy } from '../../../constants/copy/practice';
import { Dream } from '../model/dream';
import { isWakeCaptureWindow } from '../model/homeOverview';
import { createArchiveScreenStyles } from './ArchiveScreen.styles';
import { useArchiveScreenData } from '../hooks/useArchiveScreenData';
import { useArchiveBrowseState } from '../hooks/useArchiveBrowseState';
import { ArchiveDreamRow } from '../components/archive/ArchiveDreamRow';
import { ArchiveMonthPanel } from '../components/archive/ArchiveMonthPanel';
import { ArchiveControlsPanel } from '../components/archive/ArchiveControlsPanel';
import { ArchiveFilterSheet } from '../components/archive/ArchiveFilterSheet';
import { type ArchiveSection } from '../model/archiveBrowser';
import {
  countActiveArchiveFilters,
  getArchiveFilterSheetCopy,
  type ArchiveFilterSelection,
} from '../model/archiveFilterSheet';

const archiveLayoutTransition = LinearTransition.springify()
  .damping(18)
  .stiffness(180);

export default function ArchiveScreen() {
  const theme = useTheme<Theme>();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const practiceCopy = React.useMemo(() => getPracticeCopy(locale), [locale]);
  const filterSheetCopy = React.useMemo(
    () => getArchiveFilterSheetCopy(locale),
    [locale],
  );
  const moodLabels = React.useMemo(() => getDreamMoodLabels(locale), [locale]);
  const styles = React.useMemo(() => createArchiveScreenStyles(theme), [theme]);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const listRef = React.useRef<SectionList<Dream, ArchiveSection>>(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = React.useState(false);
  const showWakeCapturePrompt = isWakeCaptureWindow();

  const scrollArchiveToTop = React.useCallback(() => {
    requestAnimationFrame(() => {
      const list = listRef.current as unknown as {
        scrollToOffset?: (params: {
          animated?: boolean;
          offset: number;
        }) => void;
      } | null;

      list?.scrollToOffset?.({ animated: true, offset: 0 });
    });
  }, []);
  const openEmptyStateCapture = React.useCallback(() => {
    if (showWakeCapturePrompt) {
      openWakeEntry({ source: 'manual' });
      return;
    }

    openNewDreamTab({
      entryMode: 'default',
      launchKey: Date.now(),
    });
  }, [showWakeCapturePrompt]);

  const data = useArchiveScreenData();
  const browse = useArchiveBrowseState({
    dreams: data.dreams,
    copy,
    locale,
    onBrowseMutate: scrollArchiveToTop,
  });

  const filterSelection = React.useMemo<ArchiveFilterSelection>(
    () => ({
      filter: browse.filter,
      specialFilter: browse.specialFilter,
      tagFilter: browse.tagFilter,
    }),
    [browse.filter, browse.specialFilter, browse.tagFilter],
  );
  const activeFilterCount = React.useMemo(
    () => countActiveArchiveFilters(filterSelection),
    [filterSelection],
  );
  const applyArchiveFilters = React.useCallback(
    (selection: ArchiveFilterSelection) => {
      // Applying from the sheet is one user action. React batches these state
      // updates, while selectFilter first clears refinements that may no longer
      // make sense under the new status scope.
      browse.selectFilter(selection.filter);
      if (selection.specialFilter !== 'all') {
        browse.selectSpecialFilter(selection.specialFilter);
      }
      if (selection.tagFilter) {
        browse.selectTagFilter(selection.tagFilter);
      }
    },
    [browse.selectFilter, browse.selectSpecialFilter, browse.selectTagFilter],
  );

  const renderArchiveItem = React.useCallback(
    ({ item }: { item: Dream }) => (
      <ArchiveDreamRow
        dream={item}
        copy={copy}
        searchQuery={browse.deferredSearchQuery}
        locale={locale}
        moodLabels={moodLabels}
        navigation={navigation}
        styles={styles}
        viewMode={browse.viewMode}
      />
    ),
    [
      browse.deferredSearchQuery,
      browse.viewMode,
      copy,
      locale,
      moodLabels,
      navigation,
      styles,
    ],
  );

  const listHeader = React.useMemo(
    () => (
      <View style={styles.headerBlock}>
        <Animated.View
          entering={FadeInDown.duration(240)}
          layout={archiveLayoutTransition}
          style={styles.titleBlock}
        >
          <SectionHeader title={copy.archiveTitle} large />
        </Animated.View>

        <ArchiveControlsPanel
          copy={copy}
          styles={styles}
          searchPlaceholder={browse.searchPlaceholder}
          searchQuery={browse.searchQuery}
          onChangeSearch={browse.setSearchQuery}
          isSearchPending={browse.isSearchPending}
          surfaceModes={browse.surfaceModes}
          surfaceMode={browse.surfaceMode}
          onChangeSurfaceMode={browse.selectSurfaceMode}
          filtersLabel={filterSheetCopy.triggerLabel}
          activeFilterCount={activeFilterCount}
          onOpenFilters={() => setIsFilterSheetOpen(true)}
          hasHardReset={browse.hasHardReset}
          onReset={browse.resetArchiveView}
          visibleEntriesLabel={browse.visibleEntriesLabel}
          revisitCue={browse.revisitCue}
          browseModes={browse.browseModes}
          viewMode={browse.viewMode}
          onChangeViewMode={browse.setViewMode}
          onOpenRevisitDream={dreamId =>
            navigation.navigate('DreamDetail', { dreamId })
          }
        />

        {browse.surfaceMode === 'calendar' && browse.selectedMonthKey ? (
          <ArchiveMonthPanel
            copy={copy}
            localeKey={browse.localeKey}
            styles={styles}
            selectedMonthKey={browse.selectedMonthKey}
            monthMetaText={browse.monthMetaText}
            canGoOlder={browse.canGoOlder}
            canGoNewer={browse.canGoNewer}
            onMoveMonth={browse.moveMonth}
            quickJumpMonthKeys={browse.quickJumpMonthKeys}
            selectedDate={browse.selectedDate}
            onSelectMonth={browse.selectMonth}
            onClearDate={browse.clearSelectedDate}
            weekdayLabels={browse.weekdayLabels}
            calendarRows={browse.calendarRows}
            onSelectCalendarDate={browse.selectCalendarDate}
          />
        ) : null}

        {browse.archiveEmptyContent ||
        (browse.surfaceMode === 'calendar' && !browse.selectedMonthKey) ? (
          <View style={styles.emptyWrap}>
            <ScreenStateCard
              variant="empty"
              title={
                browse.archiveEmptyContent?.title ?? copy.archiveNoResultsTitle
              }
              subtitle={
                browse.archiveEmptyContent?.subtitle ??
                copy.archiveNoResultsDescription
              }
              actionLabel={
                browse.hasResettableView ? copy.archiveResetView : undefined
              }
              onAction={
                browse.hasResettableView ? browse.resetArchiveView : undefined
              }
            />
          </View>
        ) : null}
      </View>
    ),
    [
      activeFilterCount,
      browse,
      copy,
      filterSheetCopy.triggerLabel,
      navigation,
      styles,
    ],
  );

  if (data.loading) {
    return (
      <ScreenContainer scroll={false}>
        <Card style={styles.toolbarCard}>
          <SkeletonBlock width="44%" height={24} />
          <SkeletonBlock width="28%" height={14} />
          <SkeletonBlock width="100%" height={44} />
        </Card>
        <Card style={styles.controlsCard}>
          <SkeletonBlock width="100%" height={42} />
          <View style={styles.controlsMetaRow}>
            <SkeletonBlock width={72} height={28} />
            <SkeletonBlock width={84} height={28} />
            <SkeletonBlock width={68} height={28} />
          </View>
        </Card>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={`archive-loading-${index}`} style={styles.controlsCard}>
            <SkeletonBlock width="36%" height={16} />
            <SkeletonBlock width="76%" height={12} />
            <SkeletonBlock width="100%" height={76} />
          </Card>
        ))}
      </ScreenContainer>
    );
  }

  if (data.loadError) {
    return (
      <ScreenContainer scroll={false}>
        <ScreenStateCard
          variant="error"
          title={copy.timelineErrorTitle}
          subtitle={copy.timelineErrorDescription}
          actionLabel={copy.actionRetry}
          onAction={() => data.refreshArchive('initial')}
        />
      </ScreenContainer>
    );
  }

  if (!data.meta.totalCount) {
    return (
      <ScreenContainer scroll={false}>
        <ScreenStateCard
          variant="empty"
          title={copy.archiveEmptyTitle}
          subtitle={copy.archiveEmptyDescription}
          actionLabel={
            showWakeCapturePrompt ? copy.quickAddWakeAction : copy.createTitle
          }
          onAction={openEmptyStateCapture}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false} padded={false}>
      <SectionList
        ref={listRef}
        sections={browse.sections}
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
            paddingTop: insets.top + theme.spacing.xs,
            paddingBottom:
              getTabBarReservedSpace(insets.bottom) + theme.spacing.xs,
          },
        ]}
        ListHeaderComponent={listHeader}
        renderSectionHeader={({ section }) =>
          section.data.length &&
          (browse.surfaceMode === 'list' || browse.selectedDate) ? (
            <Animated.View
              entering={FadeInDown.duration(160)}
              layout={archiveLayoutTransition}
              style={styles.sectionHeader}
            >
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </Animated.View>
          ) : null
        }
        renderItem={renderArchiveItem}
      />

      <ArchiveFilterSheet
        visible={isFilterSheetOpen}
        copy={filterSheetCopy}
        archiveFilters={browse.archiveFilters}
        specialFilters={browse.specialFilters}
        topTags={browse.topMonthTags}
        selection={filterSelection}
        onClose={() => setIsFilterSheetOpen(false)}
        onApply={applyArchiveFilters}
      />
    </ScreenContainer>
  );
}
