import React from 'react';
import { Pressable, View } from 'react-native';
import { Card } from '../../../../components/ui/Card';
import { FormField } from '../../../../components/ui/FormField';
import { SectionHeader } from '../../../../components/ui/SectionHeader';
import { ScreenStateCard } from '../ScreenStateCard';
import { TagChip } from '../../../../components/ui/TagChip';
import { Text } from '../../../../components/ui/Text';
import { type DreamCopy } from '../../../../constants/copy/dreams';
import {
  type HomeArchiveFilter,
  type HomeTimelineFilters,
} from '../../model/homeTimeline';
import { type PatternDetailKind } from '../../../../app/navigation/routes';
import { createHomeScreenStyles } from '../../screens/HomeScreen.styles';
import { type HomeFilterChip, type HomeOption } from './homeTypes';

type HomeListHeaderProps = {
  copy: DreamCopy;
  styles: ReturnType<typeof createHomeScreenStyles>;
  timelineFilters: HomeTimelineFilters;
  homeFilters: Array<HomeOption<HomeArchiveFilter>>;
  activeFilterChips: HomeFilterChip[];
  visibleDreamCount: number;
  archiveScopedCount: number;
  displayedDreamCount: number;
  searchResultsLabel: string;
  isSearchPending: boolean;
  spotlightPattern: string;
  spotlightPatternKind: PatternDetailKind | null;
  spotlightCountLabel: string;
  weeklyValue: string;
  weeklyHint: string;
  backlogValue: string;
  backlogHint: string;
  onOpenPatternDetail: (signal: string, kind: PatternDetailKind) => void;
  onOpenFilterSheet: () => void;
  onClearFilters: () => void;
  updateTimelineFilters: (updater: (current: HomeTimelineFilters) => HomeTimelineFilters) => void;
};

export function HomeListHeader({
  copy,
  styles,
  timelineFilters,
  homeFilters,
  activeFilterChips,
  visibleDreamCount,
  archiveScopedCount,
  displayedDreamCount,
  searchResultsLabel,
  isSearchPending,
  spotlightPattern,
  spotlightPatternKind,
  spotlightCountLabel,
  weeklyValue,
  weeklyHint,
  backlogValue,
  backlogHint,
  onOpenPatternDetail,
  onOpenFilterSheet,
  onClearFilters,
  updateTimelineFilters,
}: HomeListHeaderProps) {
  return (
    <View style={styles.listHeaderContent}>
      <Card style={styles.spotlightCard}>
        <View style={styles.spotlightHeader}>
          <Text style={styles.sectionLabel}>{copy.homeSpotlightTitle}</Text>
          <Text style={styles.spotlightSubtitle}>{copy.homeSpotlightSubtitle}</Text>
        </View>

        <View style={styles.spotlightLeadRow}>
          {spotlightPatternKind ? (
            <Pressable
              style={({ pressed }) => [
                styles.spotlightTile,
                styles.spotlightTileLead,
                styles.spotlightTileFeatured,
                pressed ? styles.spotlightTilePressed : null,
              ]}
              onPress={() => onOpenPatternDetail(spotlightPattern, spotlightPatternKind)}
            >
              <Text style={styles.spotlightLabel}>{copy.homeSpotlightPatternLabel}</Text>
              <Text style={styles.spotlightValue}>{spotlightPattern}</Text>
              <Text style={styles.spotlightHint}>{spotlightCountLabel}</Text>
            </Pressable>
          ) : (
            <View style={[styles.spotlightTile, styles.spotlightTileLead, styles.spotlightTileFeatured]}>
              <Text style={styles.spotlightLabel}>{copy.homeSpotlightPatternLabel}</Text>
              <Text style={styles.spotlightValue}>{spotlightPattern}</Text>
              <Text style={styles.spotlightHint}>{copy.homeSpotlightNoPattern}</Text>
            </View>
          )}
        </View>

        <View style={styles.spotlightSecondaryRow}>
          <View style={[styles.spotlightTile, styles.spotlightCompactTile]}>
            <Text style={styles.spotlightLabel}>{copy.homeSpotlightWeeklyLabel}</Text>
            <Text style={styles.spotlightCompactValue}>{weeklyValue}</Text>
            <Text style={styles.spotlightHint}>{weeklyHint}</Text>
          </View>

          <View style={[styles.spotlightTile, styles.spotlightCompactTile]}>
            <Text style={styles.spotlightLabel}>{copy.homeSpotlightBacklogLabel}</Text>
            <Text style={styles.spotlightCompactValue}>{backlogValue}</Text>
            <Text style={styles.spotlightHint}>{backlogHint}</Text>
          </View>
        </View>
      </Card>

      <View style={styles.timelineHeaderRow}>
        <View style={styles.timelineHeaderCopy}>
          <Text style={styles.sectionLabel}>{copy.homeSectionLabel}</Text>
          <Text style={styles.sectionHint}>{copy.openDreamHint}</Text>
        </View>
        <View style={styles.timelineHeaderActions}>
          <View style={styles.timelineCountPill}>
            <Text style={styles.timelineCountLabel}>{searchResultsLabel}</Text>
          </View>
        </View>
      </View>

      <Card style={styles.searchCard}>
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
          helperText={isSearchPending ? copy.timelineLoadingDescription : undefined}
        />

        <View style={styles.primaryControlsRow}>
          <View style={styles.filterRow}>
            {homeFilters.map(filter => {
              const active = timelineFilters.archive === filter.key;

              return (
                <Pressable
                  key={filter.key}
                  style={[styles.filterButton, active ? styles.filterButtonActive : null]}
                  onPress={() =>
                    updateTimelineFilters(current => ({
                      ...current,
                      archive: filter.key,
                    }))
                  }
                >
                  <Text
                    style={[styles.filterButtonLabel, active ? styles.filterButtonLabelActive : null]}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.primaryActionsRow}>
            <Pressable
              style={[
                styles.inlineActionButton,
                timelineFilters.starredOnly ? styles.inlineActionButtonActive : null,
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
                  timelineFilters.starredOnly ? styles.inlineActionButtonTextActive : null,
                ]}
              >
                {copy.homeFilterStarred}
              </Text>
            </Pressable>
            <Pressable style={styles.inlineActionButton} onPress={onOpenFilterSheet}>
              <Text style={styles.inlineActionButtonText}>{copy.homeShowFilters}</Text>
            </Pressable>
          </View>
        </View>

        {activeFilterChips.length ? (
          <View style={styles.activeFiltersRow}>
            {activeFilterChips.map(chip => (
              <TagChip key={chip.key} label={chip.label} />
            ))}
            <Pressable style={styles.clearFiltersButton} onPress={onClearFilters}>
              <Text style={styles.clearFiltersButtonText}>{copy.homeClearFilters}</Text>
            </Pressable>
          </View>
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
        <ScreenStateCard
          variant="empty"
          title={copy.homeSearchEmptyTitle}
          subtitle={copy.homeSearchEmptyDescription}
        />
      ) : null}

      {visibleDreamCount > displayedDreamCount ? (
        <Text style={styles.recentLimitHint}>{copy.homeRecentLimitHint}</Text>
      ) : null}
    </View>
  );
}
