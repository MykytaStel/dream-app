import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
import { type PatternDetailKind } from '../../../../app/navigation/routes';
import { createHomeScreenStyles } from '../../screens/HomeScreen.styles';
import { Theme } from '../../../../theme/theme';
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
  onOpenRevisitDream: (dreamId: string) => void;
  onOpenPatternDetail: (signal: string, kind: PatternDetailKind) => void;
  onOpenFilterSheet: () => void;
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
  onOpenRevisitDream,
  onOpenPatternDetail,
  onOpenFilterSheet,
  onClearFilters,
  onClearSearch,
  onSaveSearchPreset,
  onApplySearchPreset,
  onDeleteSearchPreset,
  updateTimelineFilters,
}: HomeListHeaderProps) {
  const t = useTheme<Theme>();
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

  return (
    <View style={styles.listHeaderContent}>
      {showLastViewedShortcut ? (
        <Pressable
          onPress={onOpenLastDream}
          style={({ pressed }) => [
            styles.heroShortcutButton,
            pressed ? styles.heroShortcutButtonPressed : null,
          ]}
        >
          <View style={styles.heroShortcutIconWrap}>
            <Ionicons
              name="return-up-forward-outline"
              size={15}
              color={t.colors.primary}
            />
          </View>
          <View style={styles.heroShortcutCopy}>
            <Text style={styles.heroShortcutLabel}>
              {copy.homeLastDreamLabel}
            </Text>
            <Text style={styles.heroShortcutTitle} numberOfLines={1}>
              {lastViewedDreamTitle}
            </Text>
            {lastViewedDreamMeta ? (
              <Text style={styles.heroShortcutMeta} numberOfLines={1}>
                {lastViewedDreamMeta}
              </Text>
            ) : null}
          </View>
        </Pressable>
      ) : null}

      {showSpotlightCard ? (
        <Card style={styles.spotlightCard}>
          <View style={styles.spotlightHeader}>
            <View style={styles.spotlightHeaderCopy}>
              <Text style={styles.sectionLabel}>{copy.homeSpotlightTitle}</Text>
              <Text style={styles.spotlightHeaderHint}>
                {copy.homeSpotlightSubtitle}
              </Text>
            </View>
          </View>

          {spotlightPatternKind ? (
            <View style={styles.spotlightLeadRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.spotlightTile,
                  styles.spotlightTileLead,
                  styles.spotlightTileFeatured,
                  pressed ? styles.spotlightTilePressed : null,
                ]}
                onPress={() =>
                  onOpenPatternDetail(spotlightPattern, spotlightPatternKind)
                }
              >
                <Text style={styles.spotlightLabel}>
                  {copy.homeSpotlightPatternLabel}
                </Text>
                <Text style={styles.spotlightValue}>{spotlightPattern}</Text>
                <Text style={styles.spotlightHint}>{spotlightCountLabel}</Text>
              </Pressable>
            </View>
          ) : null}

          {revisitCue ? (
            <Pressable
              style={({ pressed }) => [
                styles.spotlightTile,
                styles.spotlightTileLead,
                pressed ? styles.spotlightTilePressed : null,
              ]}
              onPress={() => onOpenRevisitDream(revisitCue.dreamId)}
            >
              <View style={styles.spotlightCueHeader}>
                <Text style={styles.spotlightLabel}>
                  {copy.homeSpotlightRevisitLabel}
                </Text>
                <View style={styles.spotlightCueBadge}>
                  <Ionicons
                    name={revisitCue.icon}
                    size={12}
                    color={t.colors.accent}
                  />
                  <Text style={styles.spotlightCueBadgeText}>
                    {revisitCue.contextLabel}
                  </Text>
                </View>
              </View>
              <Text style={styles.spotlightValue}>{revisitCue.title}</Text>
              <Text style={styles.spotlightHint}>{revisitCue.reason}</Text>
              <View style={styles.spotlightCueActionRow}>
                <Text style={styles.spotlightActionHint}>
                  {revisitCue.actionLabel}
                </Text>
                <Ionicons
                  name="arrow-forward-outline"
                  size={14}
                  color={t.colors.accent}
                />
              </View>
            </Pressable>
          ) : null}

          {hasAttentionCue ? (
            <View style={styles.spotlightSupportRow}>
              <View style={[styles.spotlightTile, styles.spotlightCompactTile]}>
                <Text style={styles.spotlightLabel}>
                  {copy.homeSpotlightAttentionLabel}
                </Text>
                <Text style={styles.spotlightCompactValue}>
                  {attentionValue}
                </Text>
                <Text style={styles.spotlightHint}>{attentionHint}</Text>
              </View>
            </View>
          ) : null}
        </Card>
      ) : null}

      {weeklyPatternCards.length ? (
        <View style={styles.weeklyPatternsSection}>
          <View style={styles.weeklyPatternsHeader}>
            <Text style={styles.sectionLabel}>
              {copy.homeWeeklyPatternsTitle}
            </Text>
            <Text style={styles.weeklyPatternsSubtitle}>
              {copy.homeWeeklyPatternsSubtitle}
            </Text>
          </View>

          <View style={styles.weeklyPatternsRow}>
            {weeklyPatternCards.map(card => {
              const content = (
                <>
                  <Text style={styles.weeklyPatternLabel}>{card.label}</Text>
                  <Text style={styles.weeklyPatternTitle}>{card.title}</Text>
                  <Text style={styles.weeklyPatternHint}>{card.hint}</Text>
                </>
              );

              if (card.signal && card.signalKind) {
                const signal = card.signal;
                const signalKind = card.signalKind;

                return (
                  <Pressable
                    key={card.key}
                    style={({ pressed }) => [
                      styles.weeklyPatternCard,
                      card.accent ? styles.weeklyPatternCardAccent : null,
                      pressed ? styles.spotlightTilePressed : null,
                    ]}
                    onPress={() => onOpenPatternDetail(signal, signalKind)}
                  >
                    {content}
                  </Pressable>
                );
              }

              return (
                <View
                  key={card.key}
                  style={[
                    styles.weeklyPatternCard,
                    card.accent ? styles.weeklyPatternCardAccent : null,
                  ]}
                >
                  {content}
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.timelineHeaderRow}>
        <View style={styles.timelineHeaderCopy}>
          <Text style={styles.sectionLabel}>{copy.homeSectionLabel}</Text>
        </View>
        {hasSearchQuery || hasNonSearchRefinements ? (
          <View style={styles.timelineHeaderActions}>
            <View style={styles.timelineCountPill}>
              <Text style={styles.timelineCountLabel}>
                {searchResultsLabel}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      <Card style={styles.searchCard}>
        <View style={styles.searchCardHeaderRow}>
          <Text style={styles.searchPresetLabel}>{copy.homeSearchLabel}</Text>
          {hasSearchQuery ? (
            <Pressable
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
                style={styles.inlineActionButton}
                onPress={onClearFilters}
              >
                <Text style={styles.inlineActionButtonText}>
                  {copy.homeClearFilters}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
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
