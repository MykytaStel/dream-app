import React from 'react';
import { Pressable, View } from 'react-native';
import { Card } from '../../../../components/ui/Card';
import { SectionHeader } from '../../../../components/ui/SectionHeader';
import { Text } from '../../../../components/ui/Text';
import { type DreamCopy } from '../../../../constants/copy/dreams';
import { type HomeSearchPreset } from '../../services/homeSearchPresetService';
import {
  type HomeSortOrder,
  type HomeTimelineFilters,
} from '../../model/homeTimeline';
import { type HomeRevisitCue } from '../../model/homeOverview';
import {
  type HomeLayoutPreferences,
  type HomeLayoutSection,
} from '../../model/homeLayout';
import { type PatternDetailKind } from '../../../../app/navigation/routes';
import { HomeControlCard } from './sections/HomeControlCard';
import { HomeSearchCard } from './sections/HomeSearchCard';
import { HomeShortcutSection } from './sections/HomeShortcutSection';
import { HomeSpotlightSection } from './sections/HomeSpotlightSection';
import { HomeWeeklyPatternsSection } from './sections/HomeWeeklyPatternsSection';
import { createHomeScreenStyles } from '../../screens/HomeScreen.styles';
import { type HomeFilterChip, type HomeOption } from './homeTypes';
import { type WeeklyPatternCard } from '../../../stats/model/weeklyPatternCards';

type HomeListHeaderProps = {
  copy: DreamCopy;
  styles: ReturnType<typeof createHomeScreenStyles>;
  timelineFilters: HomeTimelineFilters;
  activeFilterChips: HomeFilterChip[];
  visibleDreamCount: number;
  archiveScopedCount: number;
  searchResultsLabel: string;
  lastViewedDreamTitle?: string | null;
  lastViewedDreamMeta?: string | null;
  onOpenLastDream?: (() => void) | null;
  isSearchPending: boolean;
  isFilterMutationPending: boolean;
  hasSearchQuery: boolean;
  hasNonSearchRefinements: boolean;
  savedSearchPresets: HomeSearchPreset[];
  activeSearchPresetId: string | null;
  canSaveSearchPreset: boolean;
  sortOptions: Array<HomeOption<HomeSortOrder>>;
  spotlightPattern: string;
  spotlightPatternKind: PatternDetailKind | null;
  spotlightCountLabel: string;
  revisitCue: HomeRevisitCue | null;
  weeklyPatternCards: WeeklyPatternCard[];
  attentionValue: string;
  attentionHint: string;
  practiceShortcutTitle?: string;
  practiceShortcutHint?: string;
  nightmareShortcutTitle?: string;
  nightmareShortcutHint?: string;
  lucidQuickFilterLabel?: string;
  nightmareQuickFilterLabel?: string;
  homeLayoutPreferences: HomeLayoutPreferences;
  onOpenPractice?: (() => void) | null;
  onOpenNightmarePractice?: (() => void) | null;
  onOpenRevisitDream: (dreamId: string) => void;
  onOpenPatternDetail: (signal: string, kind: PatternDetailKind) => void;
  onOpenFilterSheet: () => void;
  onOpenHomeCustomizationSheet: () => void;
  onClearFilters: () => void;
  onClearSearch: () => void;
  onSaveSearchPreset: () => void;
  onApplySearchPreset: (preset: HomeSearchPreset) => void;
  onDeleteSearchPreset: (preset: HomeSearchPreset) => void;
  updateTimelineFilters: (
    updater: (current: HomeTimelineFilters) => HomeTimelineFilters,
  ) => void;
};

export const HomeListHeader = React.memo(function HomeListHeader({
  copy,
  styles,
  timelineFilters,
  activeFilterChips,
  visibleDreamCount,
  archiveScopedCount,
  searchResultsLabel,
  lastViewedDreamTitle,
  lastViewedDreamMeta,
  onOpenLastDream,
  isSearchPending,
  isFilterMutationPending,
  hasSearchQuery,
  hasNonSearchRefinements,
  savedSearchPresets,
  activeSearchPresetId,
  canSaveSearchPreset,
  sortOptions,
  spotlightPattern,
  spotlightPatternKind,
  spotlightCountLabel,
  revisitCue,
  weeklyPatternCards,
  attentionValue,
  attentionHint,
  practiceShortcutTitle,
  practiceShortcutHint,
  nightmareShortcutTitle,
  nightmareShortcutHint,
  lucidQuickFilterLabel,
  nightmareQuickFilterLabel,
  homeLayoutPreferences,
  onOpenPractice,
  onOpenNightmarePractice,
  onOpenRevisitDream,
  onOpenPatternDetail,
  onOpenFilterSheet,
  onOpenHomeCustomizationSheet,
  onClearFilters,
  onClearSearch,
  onSaveSearchPreset,
  onApplySearchPreset,
  onDeleteSearchPreset,
  updateTimelineFilters,
}: HomeListHeaderProps) {
  const hasAttentionCue = attentionValue !== copy.homeSpotlightAttentionClear;
  const showSpotlightCard = Boolean(
    spotlightPatternKind || revisitCue || hasAttentionCue,
  );
  const showLastViewedShortcut =
    Boolean(lastViewedDreamTitle && onOpenLastDream) &&
    !showSpotlightCard &&
    !hasSearchQuery &&
    !hasNonSearchRefinements &&
    timelineFilters.sortOrder === 'newest';
  /**
   * Which section goes where, and which are switched off.
   *
   * The one piece of logic that stays here now that each section is its own
   * component. Sections that have nothing to show return null, and the fragment
   * they are rendered into draws nothing for them — which is why this no longer
   * needs to filter empty nodes out.
   */
  const orderedSectionKeys = React.useMemo(
    () =>
      homeLayoutPreferences.sectionOrder.filter(
        section => !homeLayoutPreferences.hiddenSections.includes(section),
      ),
    [homeLayoutPreferences.hiddenSections, homeLayoutPreferences.sectionOrder],
  );

  const sectionsByKey: Record<HomeLayoutSection, React.ReactNode> = {
    shortcuts: (
      <HomeShortcutSection
        copy={copy}
        styles={styles}
        showLastViewedShortcut={showLastViewedShortcut}
        lastViewedDreamTitle={lastViewedDreamTitle}
        lastViewedDreamMeta={lastViewedDreamMeta}
        practiceShortcutTitle={practiceShortcutTitle}
        practiceShortcutHint={practiceShortcutHint}
        nightmareShortcutTitle={nightmareShortcutTitle}
        nightmareShortcutHint={nightmareShortcutHint}
        onOpenLastDream={onOpenLastDream}
        onOpenPractice={onOpenPractice}
        onOpenNightmarePractice={onOpenNightmarePractice}
      />
    ),
    spotlight: (
      <HomeSpotlightSection
        copy={copy}
        styles={styles}
        showSpotlightCard={showSpotlightCard}
        spotlightPattern={spotlightPattern}
        spotlightPatternKind={spotlightPatternKind}
        spotlightCountLabel={spotlightCountLabel}
        hasAttentionCue={hasAttentionCue}
        attentionValue={attentionValue}
        attentionHint={attentionHint}
        revisitCue={revisitCue}
        onOpenPatternDetail={onOpenPatternDetail}
        onOpenRevisitDream={onOpenRevisitDream}
      />
    ),
    weeklyPatterns: (
      <HomeWeeklyPatternsSection
        copy={copy}
        styles={styles}
        weeklyPatternCards={weeklyPatternCards}
        onOpenPatternDetail={onOpenPatternDetail}
      />
    ),
  };
  return (
    <View style={styles.listHeaderContent}>
      {orderedSectionKeys.map(key => (
        <React.Fragment key={key}>{sectionsByKey[key]}</React.Fragment>
      ))}

      <View style={styles.timelineHeaderRow}>
        <View style={styles.timelineHeaderCopy}>
          <Text style={styles.sectionLabel}>{copy.homeSectionLabel}</Text>
        </View>
        <View style={styles.timelineHeaderActions}>
          <Pressable
            accessibilityRole="button"
            style={styles.inlineActionButton}
            onPress={onOpenHomeCustomizationSheet}
          >
            <Text style={styles.inlineActionButtonText}>
              {copy.homeCustomizeAction}
            </Text>
          </Pressable>
          {hasSearchQuery || hasNonSearchRefinements ? (
            <View style={styles.timelineCountPill}>
              <Text style={styles.timelineCountLabel}>
                {searchResultsLabel}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <HomeSearchCard
        copy={copy}
        styles={styles}
        timelineFilters={timelineFilters}
        isSearchPending={isSearchPending}
        hasSearchQuery={hasSearchQuery}
        isFilterMutationPending={isFilterMutationPending}
        savedSearchPresets={savedSearchPresets}
        activeSearchPresetId={activeSearchPresetId}
        canSaveSearchPreset={canSaveSearchPreset}
        onClearSearch={onClearSearch}
        onSaveSearchPreset={onSaveSearchPreset}
        onApplySearchPreset={onApplySearchPreset}
        onDeleteSearchPreset={onDeleteSearchPreset}
        updateTimelineFilters={updateTimelineFilters}
      />

      <HomeControlCard
        copy={copy}
        styles={styles}
        timelineFilters={timelineFilters}
        activeFilterChips={activeFilterChips}
        sortOptions={sortOptions}
        lucidQuickFilterLabel={lucidQuickFilterLabel}
        nightmareQuickFilterLabel={nightmareQuickFilterLabel}
        onOpenFilterSheet={onOpenFilterSheet}
        onClearFilters={onClearFilters}
        updateTimelineFilters={updateTimelineFilters}
      />

      {!archiveScopedCount ? (
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

      {archiveScopedCount > 0 && !visibleDreamCount ? (
        <Card style={styles.emptyCard}>
          <SectionHeader
            title={copy.homeSearchEmptyTitle}
            subtitle={copy.homeSearchEmptyDescription}
          />
          <View style={styles.emptyActionsRow}>
            {hasSearchQuery ? (
              <Pressable
                accessibilityRole="button"
                style={styles.inlineActionButton}
                onPress={onClearSearch}
              >
                <Text style={styles.inlineActionButtonText}>
                  {copy.homeClearSearch}
                </Text>
              </Pressable>
            ) : null}
            {hasNonSearchRefinements ? (
              <Pressable
                accessibilityRole="button"
                style={styles.inlineActionButton}
                onPress={onClearFilters}
              >
                <Text style={styles.inlineActionButtonText}>
                  {copy.homeClearFilters}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              style={styles.inlineActionButton}
              onPress={onOpenFilterSheet}
            >
              <Text style={styles.inlineActionButtonText}>
                {copy.homeAllFilters}
              </Text>
            </Pressable>
          </View>
        </Card>
      ) : null}
    </View>
  );
});
