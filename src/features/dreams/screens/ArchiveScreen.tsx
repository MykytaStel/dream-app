import React from 'react';
import { SectionList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@shopify/restyle';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { ScreenStateCard } from '../components/ScreenStateCard';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { getDreamCopy, getDreamMoodLabels } from '../../../constants/copy/dreams';
import { type RootStackParamList } from '../../../app/navigation/routes';
import { getTabBarReservedSpace } from '../../../app/navigation/tabBarLayout';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { Dream } from '../model/dream';
import { createArchiveScreenStyles } from './ArchiveScreen.styles';
import { useArchiveScreenData } from '../hooks/useArchiveScreenData';
import { useArchiveBrowseState } from '../hooks/useArchiveBrowseState';
import { ArchiveDreamRow } from '../components/archive/ArchiveDreamRow';
import { ArchiveMonthPanel } from '../components/archive/ArchiveMonthPanel';
import { ArchiveControlsPanel } from '../components/archive/ArchiveControlsPanel';
import { type ArchiveSection } from '../model/archiveBrowser';

const archiveLayoutTransition = LinearTransition.springify()
  .damping(18)
  .stiffness(180);

export default function ArchiveScreen() {
  const theme = useTheme<Theme>();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const moodLabels = React.useMemo(() => getDreamMoodLabels(locale), [locale]);
  const styles = createArchiveScreenStyles(theme);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const listRef = React.useRef<SectionList<Dream, ArchiveSection>>(null);

  const scrollArchiveToTop = React.useCallback(() => {
    requestAnimationFrame(() => {
      const list = listRef.current as unknown as {
        scrollToOffset?: (params: { animated?: boolean; offset: number }) => void;
      } | null;

      list?.scrollToOffset?.({ animated: true, offset: 0 });
    });
  }, []);

  const data = useArchiveScreenData();
  const browse = useArchiveBrowseState({
    dreams: data.dreams,
    copy,
    locale,
    onBrowseMutate: scrollArchiveToTop,
  });

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
    [browse.deferredSearchQuery, browse.viewMode, copy, locale, moodLabels, navigation, styles],
  );

  const listHeader = React.useMemo(
    () => (
      <View style={styles.headerBlock}>
        <Animated.View
          entering={FadeInDown.duration(240)}
          layout={archiveLayoutTransition}
          style={styles.titleBlock}
        >
          <SectionHeader title={copy.archiveTitle} subtitle={copy.archiveSubtitle} large />
        </Animated.View>

        {browse.selectedMonthKey ? (
          <>
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
              onToggleCalendar={browse.toggleCalendarExpanded}
              isCalendarExpanded={browse.isCalendarExpanded}
              weekdayLabels={browse.weekdayLabels}
              calendarRows={browse.calendarRows}
              onSelectCalendarDate={browse.selectCalendarDate}
            />

            <ArchiveControlsPanel
              copy={copy}
              styles={styles}
              searchQuery={browse.searchQuery}
              onChangeSearch={browse.setSearchQuery}
              isSearchPending={browse.isSearchPending}
              archiveFilters={browse.archiveFilters}
              filter={browse.filter}
              onSelectFilter={browse.selectFilter}
              hasHardReset={browse.hasHardReset}
              onReset={browse.resetArchiveView}
              visibleEntriesLabel={browse.visibleEntriesLabel}
              browseModes={browse.browseModes}
              viewMode={browse.viewMode}
              onChangeViewMode={browse.setViewMode}
            />
          </>
        ) : null}

        {browse.archiveEmptyContent || !browse.selectedMonthKey ? (
          <View style={styles.emptyWrap}>
            <ScreenStateCard
              variant="empty"
              title={browse.archiveEmptyContent?.title ?? copy.archiveNoResultsTitle}
              subtitle={browse.archiveEmptyContent?.subtitle ?? copy.archiveNoResultsDescription}
              actionLabel={browse.hasResettableView ? copy.archiveResetView : undefined}
              onAction={browse.hasResettableView ? browse.resetArchiveView : undefined}
            />
          </View>
        ) : null}
      </View>
    ),
    [browse, copy, styles],
  );

  if (!data.dreams.length) {
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
            paddingBottom: getTabBarReservedSpace(insets.bottom) + theme.spacing.xs,
          },
        ]}
        ListHeaderComponent={listHeader}
        renderSectionHeader={({ section }) =>
          section.data.length && browse.selectedDate ? (
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
    </ScreenContainer>
  );
}
