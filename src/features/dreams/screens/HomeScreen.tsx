import React from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SkeletonBlock } from '../../../components/ui/SkeletonBlock';
import { Text } from '../../../components/ui/Text';
import { getTabBarReservedSpace } from '../../../app/navigation/tabBarLayout';
import { type RootStackParamList } from '../../../app/navigation/routes';
import { openNewDreamTab, openWakeEntry } from '../../../app/navigation/navigationRef';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { ScreenStateCard } from '../components/ScreenStateCard';
import { getDreamCopy, getDreamMoodLabels } from '../../../constants/copy/dreams';
import { getDreamLayout } from '../constants/layout';
import { HomeDreamRow } from '../components/home/HomeDreamRow';
import { HomeFilterSheet } from '../components/home/HomeFilterSheet';
import { HomeHero } from '../components/home/HomeHero';
import { HomeListHeader } from '../components/home/HomeListHeader';
import { isWakeCaptureWindow } from '../model/homeOverview';
import { getDreamDraftResumeDescription } from '../model/dreamDraftPresentation';
import { getDreamDraftSnapshot } from '../services/dreamDraftService';
import { createHomeScreenStyles } from './HomeScreen.styles';
import { useHomeScreenData } from '../hooks/useHomeScreenData';
import { useHomeSwipeActions } from '../hooks/useHomeSwipeActions';
import { useHomeTimelineState } from '../hooks/useHomeTimelineState';
import { type Dream } from '../model/dream';
import { type DreamListItem } from '../repository/dreamsRepository';

function formatPreview(dream: DreamListItem, copy: ReturnType<typeof getDreamCopy>) {
  const text = dream.textPreview?.trim();
  if (text) {
    return text;
  }

  const transcript = dream.transcriptPreview?.trim();
  if (transcript) {
    return transcript;
  }

  if (dream.hasAudio) {
    return copy.audioOnlyPreview;
  }

  return copy.noDetailsPreview;
}

export default function HomeScreen() {
  const theme = useTheme<Theme>();
  const layout = React.useMemo(() => getDreamLayout(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { locale } = useI18n();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const copy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const moodLabels = React.useMemo(() => getDreamMoodLabels(locale), [locale]);
  const styles = createHomeScreenStyles(theme);
  const {
    dreamListItems,
    dreams,
    draft,
    savedSearchPresets,
    setSavedSearchPresets,
    lastViewedDream,
    detailsReady,
    loading,
    refreshing,
    loadError,
    refreshDreams,
  } = useHomeScreenData();
  const dreamIds = React.useMemo(() => dreams.map(dream => dream.id), [dreams]);
  const showWakeCapturePrompt = isWakeCaptureWindow();
  const fullLastViewedDream = React.useMemo(
    () =>
      lastViewedDream && 'tags' in lastViewedDream
        ? lastViewedDream
        : null,
    [lastViewedDream],
  );
  const draftSnapshot = React.useMemo(() => getDreamDraftSnapshot(draft), [draft]);
  const draftResumeDescription = React.useMemo(
    () => getDreamDraftResumeDescription(draftSnapshot, copy),
    [copy, draftSnapshot],
  );
  const swipeActions = useHomeSwipeActions({
    copy,
    navigation,
    refreshDreams,
    dreamIds,
  });
  const {
    closeActiveSwipe,
    closePreviousSwipe,
    closeSwipe,
    bindSwipeMethods,
    onSwipeClosed,
    onSwipeOpened,
    openDreamDetail,
    openDreamEditor,
    openDreamQuickActions,
    toggleArchiveFromList,
    removeDreamFromList,
    openPatternDetail,
  } = swipeActions;
  const timeline = useHomeTimelineState({
    dreams,
    copy,
    locale,
    moodLabels,
    savedSearchPresets,
    setSavedSearchPresets,
    lastViewedDream: fullLastViewedDream,
    closeActiveSwipe,
  });
  const openDefaultCapture = React.useCallback(() => {
    openNewDreamTab({
      entryMode: 'default',
      launchKey: Date.now(),
    });
  }, []);
  const openDraftCapture = React.useCallback(() => {
    if (!draftSnapshot) {
      openDefaultCapture();
      return;
    }

    openNewDreamTab({
      entryMode: draftSnapshot.resumeMode,
      autoStartRecording: false,
    });
  }, [draftSnapshot, openDefaultCapture]);
  const openWakeCapture = React.useCallback(() => {
    openWakeEntry({ source: 'manual' });
  }, []);
  const openRecommendedCapture = React.useCallback(() => {
    if (draft) {
      openDraftCapture();
      return;
    }

    if (showWakeCapturePrompt) {
      openWakeCapture();
      return;
    }

    openDefaultCapture();
  }, [draft, openDefaultCapture, openDraftCapture, openWakeCapture, showWakeCapturePrompt]);
  const heroPrompt = React.useMemo(
    () =>
      draft
        ? {
            title: copy.homeContinueDraft,
            description: draftResumeDescription,
            primaryActionLabel: copy.homeContinueDraft,
            primaryActionIcon:
              draftSnapshot?.resumeMode === 'voice' ? 'mic-outline' : 'document-text-outline',
            onPrimaryAction: openDraftCapture,
            secondaryActionLabel: showWakeCapturePrompt ? copy.quickAddWakeAction : undefined,
            secondaryActionIcon: showWakeCapturePrompt ? 'sunny-outline' : undefined,
            onSecondaryAction: showWakeCapturePrompt ? openWakeCapture : undefined,
          }
        : null,
    [
      copy.homeContinueDraft,
      copy.quickAddWakeAction,
      draft,
      draftResumeDescription,
      draftSnapshot?.resumeMode,
      openDraftCapture,
      openWakeCapture,
      showWakeCapturePrompt,
    ],
  );
  const listHeader = React.useMemo(
    () => (
      <>
        <HomeHero
          copy={copy}
          styles={styles}
          insetTop={insets.top + theme.spacing.sm}
          greeting={timeline.heroGreeting}
          dateLabel={timeline.heroDateLabel}
          prompt={heroPrompt}
        />

        <HomeListHeader
          copy={copy}
          styles={styles}
          timelineFilters={timeline.timelineFilters}
          activeFilterChips={timeline.activeFilterChips}
          visibleDreamCount={timeline.visibleDreams.length}
          archiveScopedCount={timeline.archiveScopedDreams.length}
          searchResultsLabel={timeline.searchResultsLabel}
          lastViewedDreamTitle={lastViewedDream?.title || copy.untitled}
          lastViewedDreamMeta={timeline.lastViewedDreamMeta}
          onOpenLastDream={
            lastViewedDream
              ? () => openDreamDetail(lastViewedDream.id)
              : null
          }
          streak={timeline.streak}
          totalDreams={timeline.activeDreams.length}
          averageWords={timeline.averageWords}
          isSearchPending={timeline.isSearchPending}
          isFilterMutationPending={timeline.isFilterMutationPending}
          hasSearchQuery={timeline.hasSearchQuery}
          hasNonSearchRefinements={timeline.hasNonSearchRefinements}
          savedSearchPresets={timeline.savedSearchPresets}
          activeSearchPresetId={timeline.activeSearchPresetId}
          canSaveSearchPreset={timeline.canSaveSearchPreset}
          spotlightPattern={timeline.spotlightPattern}
          spotlightPatternKind={timeline.spotlightPatternKind}
          spotlightCountLabel={timeline.spotlightCountLabel}
          revisitCue={timeline.revisitCue}
          weeklyValue={timeline.weeklyValue}
          weeklyHint={timeline.weeklyHint}
          attentionValue={timeline.attentionValue}
          attentionHint={timeline.attentionHint}
          onOpenRevisitDream={openDreamDetail}
          onOpenPatternDetail={openPatternDetail}
          onOpenFilterSheet={() => timeline.setIsFilterSheetOpen(true)}
          onClearFilters={timeline.clearTimelineFilters}
          onClearSearch={timeline.clearTimelineSearch}
          onSaveSearchPreset={timeline.saveCurrentSearchPreset}
          onApplySearchPreset={timeline.applySearchPreset}
          onDeleteSearchPreset={timeline.deleteSearchPreset}
          updateTimelineFilters={timeline.updateTimelineFilters}
        />

        <HomeFilterSheet
          visible={timeline.isFilterSheetOpen}
          copy={copy}
          styles={styles}
          timelineFilters={timeline.timelineFilters}
          homeFilters={timeline.homeFilters}
          moodFilters={timeline.moodFilters}
          typeFilters={timeline.typeFilters}
          transcriptFilters={timeline.transcriptFilters}
          availableTags={timeline.availableTags}
          dateRangeFilters={timeline.dateRangeFilters}
          sortOptions={timeline.sortOptions}
          onClose={() => timeline.setIsFilterSheetOpen(false)}
          updateTimelineFilters={timeline.updateTimelineFilters}
        />
      </>
    ),
    [
      copy,
      openDreamDetail,
      openPatternDetail,
      heroPrompt,
      insets.top,
      lastViewedDream,
      styles,
      theme.spacing.sm,
      timeline,
    ],
  );
  const onPullToRefresh = React.useCallback(() => {
    closeActiveSwipe();
    refreshDreams('refresh');
  }, [closeActiveSwipe, refreshDreams]);
  const renderListItem = React.useCallback(
    ({ item: dream }: { item: DreamListItem }) => (
      <Pressable
        onPress={() =>
          navigation.navigate('DreamDetail', {
            dreamId: dream.id,
          })
        }
        style={({ pressed }) => [
          styles.dreamPressable,
          pressed ? styles.dreamPressablePressed : null,
        ]}
      >
        <Card style={styles.dreamCard}>
          <View style={styles.dreamHeaderRow}>
            <View style={styles.dreamHeaderCopy}>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>
                  {dream.title || copy.untitled}
                </Text>
              </View>
              <View style={styles.timestampRow}>
                {dream.mood ? (
                  <View style={styles.moodPill}>
                    <Text style={styles.moodPillText}>{moodLabels[dream.mood]}</Text>
                  </View>
                ) : null}
                <Text style={styles.timestamp}>
                  {dream.sleepDate || new Date(dream.createdAt).toISOString().slice(0, 10)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.previewPanel}>
            <View
              style={[
                styles.previewAccent,
                { backgroundColor: theme.colors.primary },
              ]}
            />
            <Text style={styles.preview} numberOfLines={4}>
              {formatPreview(dream, copy)}
            </Text>
          </View>
        </Card>
      </Pressable>
    ),
    [copy, moodLabels, navigation, styles, theme.colors.primary],
  );
  const renderDream = React.useCallback(
    ({ item: dream }: { item: Dream }) => (
      <HomeDreamRow
        dream={dream}
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

  if (loadError) {
    return (
      <ScreenContainer scroll={false} style={styles.emptyContainer}>
        <ScreenStateCard
          variant="error"
          title={copy.timelineErrorTitle}
          subtitle={copy.timelineErrorDescription}
          actionLabel={copy.actionRetry}
          onAction={() => refreshDreams('silent')}
        />
      </ScreenContainer>
    );
  }

  if (loading) {
    return (
      <ScreenContainer scroll={false}>
        <Card style={styles.heroCard}>
          <SkeletonBlock width="22%" height={12} />
          <SkeletonBlock width="42%" height={28} />
          <SkeletonBlock width="72%" height={16} />
          <SkeletonBlock width="100%" height={44} />
        </Card>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={`home-loading-${index}`} style={styles.skeletonCard}>
            <View style={styles.skeletonHeaderRow}>
              <SkeletonBlock style={styles.skeletonDateBadge} />
              <View style={styles.skeletonHeaderCopy}>
                <SkeletonBlock width="70%" height={16} />
                <SkeletonBlock width="46%" height={12} />
              </View>
            </View>
            <View style={styles.skeletonPreviewBlock}>
              <SkeletonBlock width="94%" height={12} />
              <SkeletonBlock width="82%" height={12} />
              <SkeletonBlock width="68%" height={12} />
            </View>
          </Card>
        ))}
      </ScreenContainer>
    );
  }

  if (!dreamListItems.length && !draft) {
    return (
      <ScreenContainer scroll={false} style={styles.emptyContainer}>
        <ScreenStateCard
          variant="empty"
          title={copy.emptyTitle}
          subtitle={copy.emptyDescription}
          actionLabel={showWakeCapturePrompt ? copy.quickAddWakeAction : copy.createTitle}
          onAction={openRecommendedCapture}
        />
      </ScreenContainer>
    );
  }

  if (!detailsReady) {
    const latestSleepDate = dreamListItems[0]?.sleepDate ?? null;

    return (
      <ScreenContainer scroll={false} padded={false}>
        <FlatList
          data={dreamListItems}
          keyExtractor={item => item.id}
          ListHeaderComponent={
            <HomeHero
              copy={copy}
              styles={styles}
              insetTop={insets.top + theme.spacing.sm}
              greeting={timeline.heroGreeting}
              dateLabel={timeline.heroDateLabel}
              prompt={heroPrompt}
            />
          }
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onPullToRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary, theme.colors.accent]}
              progressBackgroundColor={theme.colors.surface}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom: getTabBarReservedSpace(insets.bottom) + theme.spacing.xs,
            },
          ]}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Text style={styles.sectionLabel}>{copy.homeSectionLabel}</Text>
              <Text style={styles.heroSubtitle}>
                {latestSleepDate
                  ? `${copy.homeLastDreamMetaPrefix} ${latestSleepDate}`
                  : copy.homeSearchEmptyDescription}
              </Text>
            </Card>
          }
          renderItem={renderListItem}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll={false} padded={false}>
      <FlatList
        data={timeline.displayedDreams}
        keyExtractor={item => item.id}
        ListHeaderComponent={listHeader}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onPullToRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary, theme.colors.accent]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: getTabBarReservedSpace(insets.bottom) + theme.spacing.xs,
          },
        ]}
        renderItem={renderDream}
      />
    </ScreenContainer>
  );
}
