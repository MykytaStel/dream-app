import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Card } from '../../../../components/ui/Card';
import { FormField } from '../../../../components/ui/FormField';
import { SegmentedControl } from '../../../../components/ui/SegmentedControl';
import { SectionHeader } from '../../../../components/ui/SectionHeader';
import { TagChip } from '../../../../components/ui/TagChip';
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
import { HomeShortcutSection } from './sections/HomeShortcutSection';
import { HomeSpotlightSection } from './sections/HomeSpotlightSection';
import { HomeWeeklyPatternsSection } from './sections/HomeWeeklyPatternsSection';
import { createHomeScreenStyles } from '../../screens/HomeScreen.styles';
import { type HomeFilterChip, type HomeOption } from './homeTypes';
import { HomeSearchPresetChip } from './HomeSearchPresetChip';
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
  const orderedSearchPresets = React.useMemo(() => {
    if (!activeSearchPresetId) {
      return savedSearchPresets;
    }

    return [...savedSearchPresets].sort((a, b) => {
      if (a.id === activeSearchPresetId) {
        return -1;
      }

      if (b.id === activeSearchPresetId) {
        return 1;
      }

      return b.createdAt - a.createdAt;
    });
  }, [activeSearchPresetId, savedSearchPresets]);
  const hasSavedSearchSection = Boolean(
    savedSearchPresets.length || canSaveSearchPreset,
  );
  const sortControlOptions = React.useMemo(
    () =>
      sortOptions.map(option => ({ value: option.key, label: option.label })),
    [sortOptions],
  );
  const tagsShortcutLabel = timelineFilters.tags.length
    ? `${copy.homeTagFilterLabel} (${timelineFilters.tags.length})`
    : copy.homeTagFilterLabel;
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

      <Card style={styles.searchCard}>
        <View style={styles.searchCardHeaderRow}>
          <Text style={styles.searchPresetLabel}>{copy.homeSearchLabel}</Text>
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
        </View>
        <View style={styles.searchBarRow}>
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
            helperText={
              isSearchPending || isFilterMutationPending
                ? copy.timelineLoadingDescription
                : undefined
            }
            containerStyle={styles.searchFieldContainer}
            inputStyle={styles.searchFieldInput}
          />
        </View>

        {hasSavedSearchSection ? (
          <>
            <View style={styles.searchPresetHeaderRow}>
              <Text style={styles.searchPresetLabel}>
                {copy.homeSavedSearchesLabel}
              </Text>
              {canSaveSearchPreset ? (
                <Pressable
                  accessibilityRole="button"
                  style={styles.searchPresetSaveButton}
                  onPress={onSaveSearchPreset}
                >
                  <Text style={styles.searchPresetSaveButtonText}>
                    {copy.homeSaveSearchPreset}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            {orderedSearchPresets.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.searchPresetRow}
              >
                {orderedSearchPresets.map(preset => (
                  <HomeSearchPresetChip
                    key={preset.id}
                    label={preset.label}
                    active={activeSearchPresetId === preset.id}
                    removeLabel={copy.homeSearchPresetRemove}
                    onPress={() => onApplySearchPreset(preset)}
                    onRemove={() => onDeleteSearchPreset(preset)}
                  />
                ))}
              </ScrollView>
            ) : null}
          </>
        ) : null}
      </Card>

      <Card style={styles.controlCard}>
        <View style={styles.controlSectionHeader}>
          <Text style={styles.searchPresetLabel}>
            {copy.homeQuickFiltersLabel}
          </Text>
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
        <View style={styles.primaryActionsRow}>
          <Pressable
            accessibilityRole="button"
            style={[
              styles.inlineActionButton,
              timelineFilters.special === 'lucid'
                ? styles.inlineActionButtonActive
                : null,
            ]}
            onPress={() =>
              updateTimelineFilters(current => ({
                ...current,
                special: current.special === 'lucid' ? 'all' : 'lucid',
              }))
            }
          >
            <Text
              style={[
                styles.inlineActionButtonText,
                timelineFilters.special === 'lucid'
                  ? styles.inlineActionButtonTextActive
                  : null,
              ]}
            >
              {lucidQuickFilterLabel ?? 'Lucid'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={[
              styles.inlineActionButton,
              timelineFilters.special === 'nightmare'
                ? styles.inlineActionButtonActive
                : null,
            ]}
            onPress={() =>
              updateTimelineFilters(current => ({
                ...current,
                special: current.special === 'nightmare' ? 'all' : 'nightmare',
              }))
            }
          >
            <Text
              style={[
                styles.inlineActionButtonText,
                timelineFilters.special === 'nightmare'
                  ? styles.inlineActionButtonTextActive
                  : null,
              ]}
            >
              {nightmareQuickFilterLabel ?? 'Nightmare'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={[
              styles.inlineActionButton,
              timelineFilters.starredOnly
                ? styles.inlineActionButtonActive
                : null,
            ]}
            onPress={() =>
              updateTimelineFilters(current => ({
                ...current,
                starredOnly: !current.starredOnly,
              }))
            }
          >
            <Text
              style={[
                styles.inlineActionButtonText,
                timelineFilters.starredOnly
                  ? styles.inlineActionButtonTextActive
                  : null,
              ]}
            >
              {copy.homeFilterStarred}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={[
              styles.inlineActionButton,
              timelineFilters.entryType === 'audio'
                ? styles.inlineActionButtonActive
                : null,
            ]}
            onPress={() =>
              updateTimelineFilters(current => ({
                ...current,
                entryType: current.entryType === 'audio' ? 'all' : 'audio',
              }))
            }
          >
            <Text
              style={[
                styles.inlineActionButtonText,
                timelineFilters.entryType === 'audio'
                  ? styles.inlineActionButtonTextActive
                  : null,
              ]}
            >
              {copy.homeTypeFilterAudio}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={[
              styles.inlineActionButton,
              timelineFilters.tags.length
                ? styles.inlineActionButtonActive
                : null,
            ]}
            onPress={onOpenFilterSheet}
          >
            <Text
              style={[
                styles.inlineActionButtonText,
                timelineFilters.tags.length
                  ? styles.inlineActionButtonTextActive
                  : null,
              ]}
            >
              {tagsShortcutLabel}
            </Text>
          </Pressable>
        </View>

        <View style={styles.controlSectionDivider} />

        <View style={styles.sortControlBlock}>
          <Text style={styles.searchPresetLabel}>
            {copy.homeSortFilterLabel}
          </Text>
        </View>
        <SegmentedControl
          options={sortControlOptions}
          selectedValue={timelineFilters.sortOrder}
          onChange={(value: HomeSortOrder) =>
            updateTimelineFilters(current => ({
              ...current,
              sortOrder: value,
            }))
          }
          columns={2}
          minWidth={120}
        />

        {activeFilterChips.length ? (
          <>
            <View style={styles.controlSectionDivider} />
            <View style={styles.activeFiltersRow}>
              {activeFilterChips.map(chip => (
                <TagChip key={chip.key} label={chip.label} />
              ))}
              <Pressable
                accessibilityRole="button"
                style={styles.clearFiltersButton}
                onPress={onClearFilters}
              >
                <Text style={styles.clearFiltersButtonText}>
                  {copy.homeClearFilters}
                </Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </Card>

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
