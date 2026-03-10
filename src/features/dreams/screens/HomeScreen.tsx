import React from 'react';
import {
  Animated,
  FlatList,
  Platform,
  RefreshControl,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../../components/ui/Card';
import { ListItemSeparator } from '../../../components/ui/ListItemSeparator';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SkeletonBlock } from '../../../components/ui/SkeletonBlock';
import { getDreamCopy, getDreamMoodLabels } from '../../../constants/copy/dreams';
import {
  type RootStackParamList,
} from '../../../app/navigation/routes';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { getTabBarReservedSpace } from '../../../app/navigation/tabBarLayout';
import { ScreenStateCard } from '../components/ScreenStateCard';
import { HomeDreamRow } from '../components/home/HomeDreamRow';
import { HomeFilterSheet } from '../components/home/HomeFilterSheet';
import { HomeHero } from '../components/home/HomeHero';
import { HomeListHeader } from '../components/home/HomeListHeader';
import { getDreamLayout } from '../constants/layout';
import type { Dream } from '../model/dream';
import { createHomeScreenStyles } from './HomeScreen.styles';
import { useHomeScreenData } from '../hooks/useHomeScreenData';
import { useHomeSwipeActions } from '../hooks/useHomeSwipeActions';
import { useHomeTimelineState } from '../hooks/useHomeTimelineState';

const HERO_COLLAPSE_DISTANCE = 132;

export default function HomeScreen() {
  const theme = useTheme<Theme>();
  const insets = useSafeAreaInsets();
  const { locale } = useI18n();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scrollY = React.useRef(new Animated.Value(0)).current;

  const copy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const moodLabels = React.useMemo(() => getDreamMoodLabels(locale), [locale]);
  const layout = React.useMemo(() => getDreamLayout(theme), [theme]);
  const styles = createHomeScreenStyles(theme);

  const data = useHomeScreenData();
  const {
    dreams,
    draft,
    loading,
    loadError,
    refreshing,
    lastViewedDream,
    savedSearchPresets,
    setSavedSearchPresets,
    refreshDreams,
  } = data;
  const swipe = useHomeSwipeActions({
    copy,
    navigation,
    refreshDreams,
    dreamIds: dreams.map(dream => dream.id),
  });
  const timeline = useHomeTimelineState({
    dreams,
    copy,
    locale,
    moodLabels,
    savedSearchPresets,
    setSavedSearchPresets,
    lastViewedDream,
    closeActiveSwipe: swipe.closeActiveSwipe,
  });
  const {
    bindSwipeMethods,
    closeActiveSwipe,
    closePreviousSwipe,
    closeSwipe,
    onSwipeClosed,
    onSwipeOpened,
    openDreamDetail,
    openDreamEditor,
    openDreamQuickActions,
    openPatternDetail,
    removeDreamFromList,
    toggleArchiveFromList,
  } = swipe;

  useFocusEffect(
    React.useCallback(() => {
      refreshDreams(loading ? 'initial' : 'silent');

      return () => {
        closeActiveSwipe();
      };
    }, [closeActiveSwipe, loading, refreshDreams]),
  );

  const heroInsetTop = insets.top + theme.spacing.sm;
  const heroExpandedHeight = 214;
  const heroCollapsedHeight = 104;

  const openLastViewedDream = React.useCallback(() => {
    if (!lastViewedDream) {
      return;
    }

    openDreamDetail(lastViewedDream.id);
  }, [lastViewedDream, openDreamDetail]);

  const onPullToRefresh = React.useCallback(() => {
    closeActiveSwipe();
    refreshDreams('refresh');
  }, [closeActiveSwipe, refreshDreams]);

  const renderDreamRow = React.useCallback(
    ({ item }: { item: Dream }) => (
      <HomeDreamRow
        dream={item}
        copy={copy}
        searchQuery={timeline.deferredSearchQuery}
        moodLabels={moodLabels}
        theme={theme}
        styles={styles}
        layout={layout}
        closeActiveSwipe={closeActiveSwipe}
        closePreviousSwipe={closePreviousSwipe}
        closeSwipe={closeSwipe}
        bindSwipeMethods={bindSwipeMethods}
        onSwipeClosed={onSwipeClosed}
        onSwipeOpened={onSwipeOpened}
        openDreamDetail={openDreamDetail}
        openDreamEditor={openDreamEditor}
        openDreamQuickActions={openDreamQuickActions}
        toggleArchiveFromList={toggleArchiveFromList}
        removeDreamFromList={removeDreamFromList}
      />
    ),
    [
      bindSwipeMethods,
      closeActiveSwipe,
      closePreviousSwipe,
      closeSwipe,
      copy,
      layout,
      moodLabels,
      onSwipeClosed,
      onSwipeOpened,
      openDreamDetail,
      openDreamEditor,
      openDreamQuickActions,
      removeDreamFromList,
      styles,
      theme,
      timeline.deferredSearchQuery,
      toggleArchiveFromList,
    ],
  );

  const listHeader = React.useMemo(
    () => (
      <HomeListHeader
        copy={copy}
        styles={styles}
        timelineFilters={timeline.timelineFilters}
        homeFilters={timeline.homeFilters}
        activeFilterChips={timeline.activeFilterChips}
        visibleDreamCount={timeline.visibleDreams.length}
        archiveScopedCount={timeline.archiveScopedDreams.length}
        displayedDreamCount={timeline.displayedDreams.length}
        searchResultsLabel={timeline.searchResultsLabel}
        isSearchPending={timeline.isSearchPending}
        hasSearchQuery={timeline.hasSearchQuery}
        hasNonSearchRefinements={timeline.hasNonSearchRefinements}
        savedSearchPresets={timeline.savedSearchPresets}
        activeSearchPresetId={timeline.activeSearchPresetId}
        canSaveSearchPreset={timeline.canSaveSearchPreset}
        spotlightPattern={timeline.spotlightPattern}
        spotlightPatternKind={timeline.spotlightPatternKind}
        spotlightCountLabel={timeline.spotlightCountLabel}
        weeklyValue={timeline.weeklyValue}
        weeklyHint={timeline.weeklyHint}
        backlogValue={timeline.backlogDisplayValue}
        backlogHint={timeline.backlogHint}
        onOpenPatternDetail={openPatternDetail}
        onOpenFilterSheet={() => timeline.setIsFilterSheetOpen(true)}
        onClearFilters={timeline.clearTimelineFilters}
        onClearSearch={timeline.clearTimelineSearch}
        onSaveSearchPreset={timeline.saveCurrentSearchPreset}
        onApplySearchPreset={timeline.applySearchPreset}
        onDeleteSearchPreset={timeline.deleteSearchPreset}
        updateTimelineFilters={timeline.updateTimelineFilters}
      />
    ),
    [copy, openPatternDetail, styles, timeline],
  );

  if (loading) {
    return (
      <ScreenContainer scroll={false}>
        <Card style={styles.heroCard}>
          <SkeletonBlock width="26%" height={12} />
          <SkeletonBlock width="52%" height={26} />
          <SkeletonBlock width="72%" height={16} />
          <View style={styles.statsRow}>
            <SkeletonBlock width="31%" height={56} />
            <SkeletonBlock width="31%" height={56} />
            <SkeletonBlock width="31%" height={56} />
          </View>
        </Card>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={`home-skeleton-${index}`} style={styles.skeletonCard}>
            <View style={styles.skeletonHeaderRow}>
              <SkeletonBlock style={styles.skeletonDateBadge} />
              <View style={styles.skeletonHeaderCopy}>
                <SkeletonBlock width="72%" height={16} />
                <SkeletonBlock width="48%" height={12} />
              </View>
            </View>
            <View style={styles.skeletonPreviewBlock}>
              <SkeletonBlock width="92%" height={12} />
              <SkeletonBlock width="84%" height={12} />
              <SkeletonBlock width="66%" height={12} />
            </View>
            <View style={styles.skeletonFooterRow}>
              <SkeletonBlock width="34%" height={24} />
              <SkeletonBlock width="26%" height={24} />
            </View>
          </Card>
        ))}
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
          onAction={() => refreshDreams('initial')}
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
    <ScreenContainer scroll={false} padded={false}>
      <HomeHero
        copy={copy}
        styles={styles}
        scrollY={scrollY}
        insetTop={heroInsetTop}
        expandedHeight={heroExpandedHeight}
        collapsedHeight={heroCollapsedHeight}
        collapseDistance={HERO_COLLAPSE_DISTANCE}
        greeting={timeline.heroGreeting}
        dateLabel={timeline.heroDateLabel}
        streak={timeline.streak}
        totalDreams={timeline.activeDreams.length}
        averageWords={timeline.averageWords}
        lastViewedDreamTitle={
          lastViewedDream?.title || (lastViewedDream ? copy.untitled : null)
        }
        lastViewedDreamMeta={timeline.lastViewedDreamMeta}
        onOpenLastDream={lastViewedDream ? openLastViewedDream : null}
      />

      <FlatList
        data={timeline.displayedDreams}
        keyExtractor={item => item.id}
        renderItem={renderDreamRow}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={ListItemSeparator}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={40}
        windowSize={7}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onPullToRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary, theme.colors.accent]}
            progressBackgroundColor={theme.colors.surface}
            progressViewOffset={heroCollapsedHeight + heroInsetTop - 8}
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: heroExpandedHeight + heroInsetTop + theme.spacing.md,
            paddingBottom: getTabBarReservedSpace(insets.bottom) + theme.spacing.xs,
          },
        ]}
      />

      <HomeFilterSheet
        visible={timeline.isFilterSheetOpen}
        copy={copy}
        styles={styles}
        timelineFilters={timeline.timelineFilters}
        moodFilters={timeline.moodFilters}
        typeFilters={timeline.typeFilters}
        transcriptFilters={timeline.transcriptFilters}
        availableTags={timeline.availableTags}
        dateRangeFilters={timeline.dateRangeFilters}
        sortOptions={timeline.sortOptions}
        onClose={() => timeline.setIsFilterSheetOpen(false)}
        updateTimelineFilters={timeline.updateTimelineFilters}
      />
    </ScreenContainer>
  );
}
